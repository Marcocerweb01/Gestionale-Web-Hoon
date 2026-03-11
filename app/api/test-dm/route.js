import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// POST /api/test-dm — Testa invio DM da un account Instagram
// Body: { senderAccountId: "DB _id", recipientIgId: "IG user id", message: "testo" }
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();

    const { senderAccountId, recipientIgId, message, useCommentId } = await req.json();

    if (!senderAccountId || !recipientIgId || !message) {
      return NextResponse.json({ error: 'Parametri mancanti: senderAccountId, recipientIgId, message' }, { status: 400 });
    }

    const account = await SocialAccount.findOne({
      _id: new mongoose.Types.ObjectId(senderAccountId),
      userId: new mongoose.Types.ObjectId(session.user.id),
    });

    if (!account) {
      return NextResponse.json({ error: 'Account non trovato o non tuo' }, { status: 404 });
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
