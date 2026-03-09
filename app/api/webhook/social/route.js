import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import SocialAutomation from '@/models/SocialAutomation';
import SocialAccount from '@/models/SocialAccount';

// Risponde a un commento Instagram/Facebook
async function replyToComment(platform, commentId, message, accessToken) {
  let url, body;
  if (platform === 'instagram') {
    // Instagram Business Login token → usa graph.instagram.com
    url = `https://graph.instagram.com/v21.0/${commentId}/replies`;
    body = { message, access_token: accessToken };
  } else {
    url = `https://graph.facebook.com/v21.0/${commentId}/comments`;
    body = { message, access_token: accessToken };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log(`[WEBHOOK] replyToComment (${platform}):`, JSON.stringify(data));
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
    console.log('[WEBHOOK] Ricevuto:', JSON.stringify(body).substring(0, 500));

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
      const account = await SocialAccount.findOne({ accountId: pageId, status: 'active' });
      if (!account) {
        console.log(`[WEBHOOK] ⚠️ Account non trovato per pageId: ${pageId}. Cerco tutti gli account attivi...`);
        const allAccounts = await SocialAccount.find({ status: 'active' }, { accountId: 1, platform: 1, username: 1 });
        console.log(`[WEBHOOK] Account attivi nel DB:`, JSON.stringify(allAccounts));
        continue;
      }
      console.log(`[WEBHOOK] ✅ Account trovato: ${account.username} (${account.platform})`);

      // Trova automazioni attive per questo account
      const automations = await SocialAutomation.find({
        accountId: account._id,
        status: 'active',
      });
      console.log(`[WEBHOOK] Automazioni attive per account: ${automations.length}`);

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

            if (actionType === 'reply_comment' || actionType === 'both') {
              await replyToComment('instagram', commentId, message, account.accessToken);
            }
            if (actionType === 'send_dm' || actionType === 'both') {
              if (commentId || fromId) {
                await sendDM('instagram', fromId, message, account.accessToken, pageId, commentId);
              } else {
                console.log('[WEBHOOK] ⚠️ sendDM skip: commentId e fromId entrambi mancanti');
              }
            }

            await SocialAutomation.findByIdAndUpdate(auto._id, {
              $inc: { 'stats.triggered': 1, 'stats.successful': 1 },
              lastTriggered: new Date(),
            });
            console.log(`[WEBHOOK] Automazione eseguita: ${auto.name}`);
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

            if (actionType === 'reply_comment' || actionType === 'both') {
              await replyToComment('facebook', commentId, message, account.accessToken);
            }
            if ((actionType === 'send_dm' || actionType === 'both') && fromId) {
              await sendDM('facebook', fromId, message, account.accessToken, pageId);
            }

            await SocialAutomation.findByIdAndUpdate(auto._id, {
              $inc: { 'stats.triggered': 1, 'stats.successful': 1 },
              lastTriggered: new Date(),
            });
            console.log(`[WEBHOOK] Automazione eseguita: ${auto.name}`);
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
