import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// POST /api/test-dm — Testa invio DM da un account Instagram
// Body: { senderAccountId: "DB _id", recipientIgId: "IG user id", message: "testo", useCommentId: bool }
// oppure: { senderAccountId: "DB _id", action: "list-comments" } per vedere commenti recenti
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();

    const reqBody = await req.json();
    const { senderAccountId, action } = reqBody;

    if (!senderAccountId) {
      return NextResponse.json({ error: 'senderAccountId richiesto' }, { status: 400 });
    }

    const account = await SocialAccount.findOne({
      _id: new mongoose.Types.ObjectId(senderAccountId),
      userId: new mongoose.Types.ObjectId(session.user.id),
    });

    if (!account) {
      return NextResponse.json({ error: 'Account non trovato o non tuo' }, { status: 404 });
    }

    // ── AZIONE: Lista commenti recenti ──────────────────────────────
    if (action === 'list-comments') {
      const apiBase = account.platform === 'instagram'
        ? 'https://graph.instagram.com/v21.0'
        : 'https://graph.facebook.com/v21.0';

      // 0. Verifica permessi effettivi del token
      let permissions = null;
      try {
        const permRes = await fetch(`${apiBase}/me?fields=id,username,user_id&access_token=${account.accessToken}`);
        permissions = await permRes.json();
      } catch (e) {
        permissions = { error: e.message };
      }

      // Prendi ultimi 3 post CON comments_count
      const mediaRes = await fetch(`${apiBase}/${account.accountId}/media?fields=id,caption,timestamp,comments_count,like_count&limit=3&access_token=${account.accessToken}`);
      const mediaData = await mediaRes.json();
      
      if (mediaData.error) {
        return NextResponse.json({ error: 'Errore media', details: mediaData.error });
      }

      const postsWithComments = [];
      for (const post of (mediaData.data || [])) {
        // Test: commenti con vari fields
        const commRes = await fetch(`${apiBase}/${post.id}/comments?fields=id,text,username,timestamp&limit=20&access_token=${account.accessToken}`);
        const commData = await commRes.json();

        // Test: replies (subcomments) — alcuni commenti possono essere replies
        let repliesTest = null;
        if (commData.data && commData.data.length > 0) {
          const firstComment = commData.data[0];
          const repRes = await fetch(`${apiBase}/${firstComment.id}/replies?fields=id,text,username,timestamp&access_token=${account.accessToken}`);
          repliesTest = await repRes.json();
        }

        postsWithComments.push({
          postId: post.id,
          caption: (post.caption || '').substring(0, 80),
          timestamp: post.timestamp,
          comments_count: post.comments_count,
          like_count: post.like_count,
          comments: commData.data || [],
          commentsError: commData.error || null,
          commentsRawResponse: commData,
          repliesTest,
        });
      }

      return NextResponse.json({
        account: { username: account.username, accountId: account.accountId, platform: account.platform },
        tokenInfo: permissions,
        posts: postsWithComments,
      });
    }

    // ── AZIONE: Invio DM ─────────────────────────────────────────────
    const { recipientIgId, message, useCommentId } = reqBody;

    if (!recipientIgId || !message) {
      return NextResponse.json({ error: 'Parametri mancanti: recipientIgId, message' }, { status: 400 });
    }

    console.log(`🧪 [TEST-DM] Invio DM da @${account.username} (${account.accountId}) a IG user ${recipientIgId}`);
    console.log(`🧪 [TEST-DM] Messaggio: "${message}"`);
    console.log(`🧪 [TEST-DM] Token (primi 20 char): ${account.accessToken?.substring(0, 20)}...`);

    // Test 1: Verifica token con /me
    const meRes = await fetch(`https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${account.accessToken}`);
    const meData = await meRes.json();
    console.log(`🧪 [TEST-DM] /me response:`, JSON.stringify(meData));

    if (meData.error) {
      return NextResponse.json({ 
        error: 'Token non valido', 
        details: meData.error,
        step: '/me verification failed'
      }, { status: 400 });
    }

    // Test 2: Invio DM
    const url = `https://graph.instagram.com/v21.0/${account.accountId}/messages`;
    const recipient = useCommentId 
      ? { comment_id: recipientIgId } 
      : { id: recipientIgId };

    const body = {
      recipient,
      message: { text: message },
    };

    console.log(`🧪 [TEST-DM] POST ${url}`);
    console.log(`🧪 [TEST-DM] Body:`, JSON.stringify(body));

    const dmRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const dmData = await dmRes.json();
    console.log(`🧪 [TEST-DM] Risultato DM:`, JSON.stringify(dmData));

    return NextResponse.json({
      sender: { username: account.username, accountId: account.accountId, platform: account.platform },
      recipient: recipientIgId,
      meCheck: meData,
      dmResult: dmData,
      success: !dmData.error,
    });
  } catch (error) {
    console.error('🧪 [TEST-DM] Errore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
