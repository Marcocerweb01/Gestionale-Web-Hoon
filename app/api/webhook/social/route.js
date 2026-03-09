import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import SocialAutomation from '@/models/SocialAutomation';
import SocialAccount from '@/models/SocialAccount';

// Risponde a un commento Instagram/Facebook
async function replyToComment(platform, commentId, message, accessToken) {
  if (platform === 'instagram') {
    await fetch(`https://graph.facebook.com/v21.0/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: accessToken }),
    });
  } else if (platform === 'facebook') {
    await fetch(`https://graph.facebook.com/v21.0/${commentId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: accessToken }),
    });
  }
}

// Invia DM a un utente
async function sendDM(platform, recipientId, message, accessToken, pageId) {
  if (platform === 'instagram') {
    await fetch(`https://graph.facebook.com/v21.0/${pageId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        access_token: accessToken,
      }),
    });
  } else if (platform === 'facebook') {
    await fetch(`https://graph.facebook.com/v21.0/${pageId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        access_token: accessToken,
      }),
    });
  }
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

      // Trova l'account corrispondente nel DB
      const account = await SocialAccount.findOne({ accountId: pageId, status: 'active' });
      if (!account) {
        console.log(`[WEBHOOK] Account non trovato per pageId: ${pageId}`);
        continue;
      }

      // Trova automazioni attive per questo account
      const automations = await SocialAutomation.find({
        accountId: account._id,
        status: 'active',
      });

      const changes = entry.changes || [];
      for (const change of changes) {
        const field = change.field;
        const value = change.value;

        // ── COMMENTI INSTAGRAM ──────────────────────────────────────────
        if (field === 'comments' && object === 'instagram') {
          const commentText = value.text || '';
          const commentId = value.id;
          const fromId = value.from?.id;

          for (const auto of automations) {
            if (!['comment_reply', 'dm_auto'].includes(auto.type)) continue;
            if (!matchesKeywords(commentText, auto.trigger?.keywords)) continue;

            const actionType = auto.action?.actionType || 'send_dm';
            const message = auto.action?.message;
            if (!message) continue;

            if (actionType === 'reply_comment' || actionType === 'both') {
              await replyToComment('instagram', commentId, message, account.accessToken);
            }
            if ((actionType === 'send_dm' || actionType === 'both') && fromId) {
              await sendDM('instagram', fromId, message, account.accessToken, pageId);
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
  
  // Token di verifica (deve corrispondere a quello configurato in Meta)
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
