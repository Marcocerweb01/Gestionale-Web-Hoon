import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// POST - Sottoscrive la pagina/account ai webhook Meta
export async function POST(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const params = await context.params;
    await connectToDB();

    const account = await SocialAccount.findOne({
      _id: params.id,
      userId: new mongoose.Types.ObjectId(session.user.id),
    });

    if (!account) {
      return NextResponse.json({ error: 'Account non trovato' }, { status: 404 });
    }

    const webhookUrl = `${process.env.NEXTAUTH_URL_PRODUCTION || 'https://gestionale-web-hoon-production.up.railway.app'}/api/webhook/social`;
    const results = [];

    if (account.platform === 'facebook') {
      // Sottoscrivi la pagina Facebook ai webhook
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${account.accountId}/subscribed_apps?subscribed_fields=feed,messages&access_token=${account.accessToken}`,
        { method: 'POST' }
      );
      const data = await res.json();
      results.push({ type: 'facebook_page', result: data });
      console.log('[WEBHOOK SUBSCRIBE] Facebook page:', JSON.stringify(data));
    }

    if (account.platform === 'instagram') {
      // Instagram Business Login: il token è di graph.instagram.com → usare graph.instagram.com per subscribed_apps
      const res = await fetch(
        `https://graph.instagram.com/v21.0/${account.accountId}/subscribed_apps?subscribed_fields=comments,messages&access_token=${account.accessToken}`,
        { method: 'POST' }
      );
      const data = await res.json();
      results.push({ type: 'instagram_account', result: data });
      console.log('[WEBHOOK SUBSCRIBE] Instagram:', JSON.stringify(data));
    }

    return NextResponse.json({ success: true, results, webhookUrl });
  } catch (error) {
    console.error('Errore subscribe webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
