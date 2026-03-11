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

      // 0b. Verifica lo stato dell'app (development vs live)
      let appModeInfo = null;
      try {
        // user_id dalla risposta di /me è l'IGID classico
        const igUserId = permissions.user_id || permissions.id;
        const appRes = await fetch(`${apiBase}/${igUserId}?fields=id,username,followers_count,media_count&access_token=${account.accessToken}`);
        appModeInfo = await appRes.json();
      } catch (e) {
        appModeInfo = { error: e.message };
      }

      // Prendi il primo post con commenti
      const mediaRes = await fetch(`${apiBase}/${account.accountId}/media?fields=id,caption,timestamp,comments_count,like_count&limit=5&access_token=${account.accessToken}`);
      const mediaData = await mediaRes.json();
      
      if (mediaData.error) {
        return NextResponse.json({ error: 'Errore media', details: mediaData.error });
      }

      // Trova il post con più commenti
      const postWithComments = (mediaData.data || []).sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0))[0];
      
      const testResults = {};
      
      if (postWithComments && postWithComments.comments_count > 0) {
        // Test A: commenti standard
        const commResA = await fetch(`${apiBase}/${postWithComments.id}/comments?fields=id,text,username,timestamp&limit=50&access_token=${account.accessToken}`);
        testResults.standardQuery = await commResA.json();

        // Test B: con paginazione after cursor
        if (testResults.standardQuery.paging?.cursors?.after) {
          const cursor = testResults.standardQuery.paging.cursors.after;
          const commResB = await fetch(`${apiBase}/${postWithComments.id}/comments?fields=id,text,username,timestamp&limit=50&after=${cursor}&access_token=${account.accessToken}`);
          testResults.afterCursor = await commResB.json();
        }

        // Test C: con paginazione before cursor
        if (testResults.standardQuery.paging?.cursors?.before) {
          const cursor = testResults.standardQuery.paging.cursors.before;
          const commResC = await fetch(`${apiBase}/${postWithComments.id}/comments?fields=id,text,username,timestamp&limit=50&before=${cursor}&access_token=${account.accessToken}`);
          testResults.beforeCursor = await commResC.json();
        }

        // Test D: Prova con il vecchio user_id (IGID) come endpoint base
        if (permissions.user_id) {
          try {
            const commResD = await fetch(`https://graph.facebook.com/v21.0/${postWithComments.id}/comments?fields=id,text,from,message&limit=50&access_token=${account.accessToken}`);
            testResults.viaFBGraph = await commResD.json();
          } catch (e) {
            testResults.viaFBGraph = { error: e.message };
          }
        }
      }

      return NextResponse.json({
        account: { username: account.username, accountId: account.accountId, platform: account.platform },
        tokenInfo: permissions,
        appModeInfo,
        postAnalyzed: postWithComments ? {
          postId: postWithComments.id,
          comments_count: postWithComments.comments_count,
          like_count: postWithComments.like_count,
          timestamp: postWithComments.timestamp,
        } : null,
        allPosts: (mediaData.data || []).map(p => ({ id: p.id, comments_count: p.comments_count, timestamp: p.timestamp })),
        testResults,
        diagnosis: postWithComments?.comments_count > 0 && (!testResults.standardQuery?.data?.length)
          ? '⚠️ Il post ha commenti ma l\'API li filtra. Causa probabile: App in Development Mode. Soluzione: passare a Live Mode o usare webhook (che ricevono TUTTI i commenti in dev mode).'
          : null,
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
