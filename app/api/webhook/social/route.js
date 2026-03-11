import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import SocialAutomation from '@/models/SocialAutomation';
import SocialAccount from '@/models/SocialAccount';

// Risponde a un commento Instagram/Facebook
async function replyToComment(platform, commentId, message, accessToken) {
  let url, body, headers;
  if (platform === 'instagram') {
    // Instagram Business Login token → usa graph.instagram.com con Bearer auth
    url = `https://graph.instagram.com/v21.0/${commentId}/replies`;
    body = { message };
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
  } else {
    url = `https://graph.facebook.com/v21.0/${commentId}/comments`;
    body = { message, access_token: accessToken };
    headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log(`[WEBHOOK] replyToComment (${platform}):`, JSON.stringify(data));
  if (data.error) {
    console.error(`[WEBHOOK] ❌ replyToComment ERRORE:`, data.error.message || JSON.stringify(data.error));
  }
  return data;
}

// Invia DM a un utente
// Per Instagram: se presente commentId, usa recipient.comment_id (risposta DM a commentatore)
async function sendDM(platform, recipientId, message, accessToken, igUserId, commentId) {
  let url, body;
  if (platform === 'instagram') {
    // Instagram Business Login token → usa graph.instagram.com
    url = `https://graph.instagram.com/v21.0/${igUserId}/messages`;
    // Usa comment_id se disponibile (più affidabile per commentatori)
    const recipient = commentId ? { comment_id: commentId } : { id: recipientId };
    body = {
      recipient,
      message: { text: message },
    };
  } else {
    url = `https://graph.facebook.com/v21.0/${igUserId}/messages`;
    body = {
      recipient: { id: recipientId },
      message: { text: message },
      access_token: accessToken,
    };
  }
  const headers = { 'Content-Type': 'application/json' };
  // Instagram Business Login usa Authorization header, non query param
  if (platform === 'instagram') {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  console.log(`[WEBHOOK] sendDM (${platform}) to ${recipientId}:`, JSON.stringify(data));
  return data;
}

// Controlla se il testo matcha le keyword dell'automazione
function matchesKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return true; // nessuna keyword = sempre attiva
  const lowerText = text.toLowerCase();
  return keywords.some(k => lowerText.includes(k.toLowerCase()));
}

// POST /api/webhook/social - Riceve eventi da Meta
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('🔔 [WEBHOOK] Ricevuto evento COMPLETO:', JSON.stringify(body, null, 2));

    // Verifica firma Meta (opzionale ma consigliato)
    const object = body.object; // 'instagram' o 'page'
    if (!object || !body.entry) {
      return NextResponse.json({ status: 'ignored' });
    }

    await connectToDB();

    for (const entry of body.entry) {
      const pageId = entry.id;
      console.log(`[WEBHOOK] Processing entry pageId: ${pageId}, object: ${object}`);

      // Trova l'account corrispondente nel DB
      // Meta webhook usa IGID (17841...) per Instagram, ma noi salviamo IGSID (26568...)
      // Quindi cerchiamo sia per accountId che per metadata.igUserId
      console.log(`🔍 [WEBHOOK] Cerco account con accountId O igUserId: "${pageId}"`);
      let account = await SocialAccount.findOne({
        $or: [
          { accountId: pageId, status: 'active' },
          { 'metadata.igUserId': pageId, status: 'active' },
        ],
      });
      
      // Fallback: cerca per platform Instagram se non trovato
      if (!account && object === 'instagram') {
        console.log(`⚠️ [WEBHOOK] Account non trovato con accountId/igUserId ${pageId}, provo ricerca generica...`);
        const igAccounts = await SocialAccount.find({ platform: 'instagram', status: 'active' });
        console.log(`📋 [WEBHOOK] Account Instagram nel DB: ${igAccounts.length}`);
        if (igAccounts.length === 1) {
          account = igAccounts[0];
          console.log(`🔄 [WEBHOOK] Uso l'unico account Instagram trovato: @${account.username} (${account.accountId})`);
          // Salva l'IGID per le prossime volte
          if (!account.metadata?.igUserId) {
            account.metadata = { ...account.metadata, igUserId: pageId };
            await account.save();
            console.log(`💾 [WEBHOOK] Salvato igUserId ${pageId} per @${account.username}`);
          }
        } else if (igAccounts.length > 1) {
          console.log(`⚠️ [WEBHOOK] Trovati ${igAccounts.length} account Instagram, non so quale usare:`);
          igAccounts.forEach(a => console.log(`   - @${a.username} (${a.accountId}) igUserId: ${a.metadata?.igUserId}`));
        }
      }
      
      if (!account) {
        console.log(`❌ [WEBHOOK] Account non trovato per pageId: ${pageId}. Cerco tutti gli account attivi...`);
        const allAccounts = await SocialAccount.find({ status: 'active' }, { accountId: 1, platform: 1, username: 1, 'metadata.igUserId': 1 });
        console.log(`📋 [WEBHOOK] Account attivi nel DB:`, JSON.stringify(allAccounts));
        console.log(`⚠️ [WEBHOOK] Salto questo entry perché non ho trovato l'account corrispondente.`);
        continue;
      }
      console.log(`✅ [WEBHOOK] Account trovato: ${account.username} (${account.platform}), ID DB: ${account._id}, accountId: ${account.accountId}`);

      // Trova automazioni attive per questo account
      console.log(`🔍 [WEBHOOK] Cerco automazioni per accountId: ${account._id}`);
      const automations = await SocialAutomation.find({
        accountId: account._id,
        status: 'active',
      });
      console.log(`📊 [WEBHOOK] Automazioni attive trovate: ${automations.length}`);
      if (automations.length > 0) {
        automations.forEach(a => {
          console.log(`  - "${a.name}" | type: ${a.type} | keywords: ${JSON.stringify(a.trigger?.keywords)} | action: ${a.action?.actionType}`);
        });
      }

      const changes = entry.changes || [];
      for (const change of changes) {
        const field = change.field;
        const value = change.value;

        // ── COMMENTI INSTAGRAM ──────────────────────────────────────────
        if (field === 'comments' && object === 'instagram') {
          const commentText = value.text || '';
          const commentId = value.id;
          const fromId = value.from?.id;
          console.log(`[WEBHOOK] Instagram comment — text: "${commentText}", commentId: ${commentId}, fromId: ${fromId}`);

          for (const auto of automations) {
            console.log(`[WEBHOOK] Check auto "${auto.name}" type:${auto.type} status:${auto.status}`);
            if (!['comment_reply', 'dm_auto'].includes(auto.type)) {
              console.log(`[WEBHOOK] Skip: tipo non supportato (${auto.type})`);
              continue;
            }
            if (!matchesKeywords(commentText, auto.trigger?.keywords)) {
              console.log(`[WEBHOOK] Skip: keyword non trovata in "${commentText}", keywords:`, auto.trigger?.keywords);
              continue;
            }

            const actionType = auto.action?.actionType || 'send_dm';
            const message = auto.action?.message;
            console.log(`[WEBHOOK] ✅ Match! actionType: ${actionType}, message: "${message}"`);
            if (!message) { console.log('[WEBHOOK] Skip: message vuoto'); continue; }

            let actionSuccess = true;

            if (actionType === 'reply_comment' || actionType === 'both') {
              const replyResult = await replyToComment('instagram', commentId, message, account.accessToken);
              if (replyResult.error) actionSuccess = false;
            }
            if (actionType === 'send_dm' || actionType === 'both') {
              if (commentId || fromId) {
                const dmResult = await sendDM('instagram', fromId, message, account.accessToken, account.accountId, commentId);
                if (dmResult.error) actionSuccess = false;
              } else {
                console.log('[WEBHOOK] ⚠️ sendDM skip: commentId e fromId entrambi mancanti');
                actionSuccess = false;
              }
            }

            await SocialAutomation.findByIdAndUpdate(auto._id, {
              $inc: {
                'stats.triggered': 1,
                ...(actionSuccess ? { 'stats.successful': 1 } : { 'stats.failed': 1 }),
              },
              lastTriggered: new Date(),
            });
            console.log(`[WEBHOOK] Automazione ${actionSuccess ? '✅ eseguita' : '❌ fallita'}: ${auto.name}`);
          }
        }

        // ── COMMENTI FACEBOOK PAGE ──────────────────────────────────────
        if (field === 'feed' && object === 'page') {
          const item = value.item;
          if (item !== 'comment') continue;
          const commentText = value.message || '';
          const commentId = value.comment_id;
          const fromId = value.from?.id;

          for (const auto of automations) {
            if (!['comment_reply', 'dm_auto'].includes(auto.type)) continue;
            if (!matchesKeywords(commentText, auto.trigger?.keywords)) continue;

            const actionType = auto.action?.actionType || 'send_dm';
            const message = auto.action?.message;
            if (!message) continue;

            let fbActionSuccess = true;

            if (actionType === 'reply_comment' || actionType === 'both') {
              const replyResult = await replyToComment('facebook', commentId, message, account.accessToken);
              if (replyResult.error) fbActionSuccess = false;
            }
            if ((actionType === 'send_dm' || actionType === 'both') && fromId) {
              const dmResult = await sendDM('facebook', fromId, message, account.accessToken, account.accountId);
              if (dmResult.error) fbActionSuccess = false;
            }

            await SocialAutomation.findByIdAndUpdate(auto._id, {
              $inc: {
                'stats.triggered': 1,
                ...(fbActionSuccess ? { 'stats.successful': 1 } : { 'stats.failed': 1 }),
              },
              lastTriggered: new Date(),
            });
            console.log(`[WEBHOOK] Automazione ${fbActionSuccess ? '✅ eseguita' : '❌ fallita'}: ${auto.name}`);
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Errore webhook social:', error);
    return NextResponse.json({ error: 'Errore nel processare il webhook' }, { status: 500 });
  }
}

// GET /api/webhook/social - Verifica webhook (per Meta)
export async function GET(req) {
  console.log(`[WEBHOOK GET] Full URL: ${req.url}`);
  console.log(`[WEBHOOK GET] Headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
  
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  console.log(`[WEBHOOK GET] mode=${mode} token=${token} challenge=${challenge}`);
  
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WEBHOOK GET] ✅ Verifica Meta riuscita');
    return new NextResponse(challenge, { status: 200 });
  }
  
  console.log(`[WEBHOOK GET] ❌ Verifica fallita — token ricevuto: "${token}", atteso: "${VERIFY_TOKEN}"`);
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
