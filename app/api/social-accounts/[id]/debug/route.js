import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import SocialAutomation from '@/models/SocialAutomation';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// GET /api/social-accounts/:id/debug — Diagnostica completa account
export async function GET(req, context) {
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

    const results = {
      account: {
        id: account._id,
        platform: account.platform,
        accountId: account.accountId,
        username: account.username,
        status: account.status,
        tokenExpiry: account.tokenExpiry,
        tokenExpired: new Date() > new Date(account.tokenExpiry),
      },
      automations: [],
      apiTests: {},
    };

    // Automazioni attive
    const automations = await SocialAutomation.find({ accountId: account._id });
    results.automations = automations.map(a => ({
      id: a._id,
      name: a.name,
      type: a.type,
      status: a.status,
      keywords: a.trigger?.keywords,
      actionType: a.action?.actionType,
      message: a.action?.message?.substring(0, 50),
      stats: a.stats,
      lastTriggered: a.lastTriggered,
    }));

    // Test 1: Token valido? (/me)
    try {
      const apiBase = account.platform === 'instagram' 
        ? 'https://graph.instagram.com/v21.0' 
        : 'https://graph.facebook.com/v21.0';
      
      const meRes = await fetch(`${apiBase}/me?fields=id,username,name&access_token=${account.accessToken}`);
      const meData = await meRes.json();
      results.apiTests.me = meData.error ? { error: meData.error.message } : { ok: true, data: meData };
    } catch (e) {
      results.apiTests.me = { error: e.message };
    }

    // Test 2: Recupera media
    try {
      const apiBase = account.platform === 'instagram' 
        ? 'https://graph.instagram.com/v21.0' 
        : 'https://graph.facebook.com/v21.0';
      const mediaEndpoint = account.platform === 'instagram' ? 'media' : 'feed';
      
      const mediaRes = await fetch(`${apiBase}/${account.accountId}/${mediaEndpoint}?fields=id,timestamp&limit=3&access_token=${account.accessToken}`);
      const mediaData = await mediaRes.json();
      results.apiTests.media = mediaData.error 
        ? { error: mediaData.error.message } 
        : { ok: true, count: mediaData.data?.length || 0, posts: mediaData.data };
    } catch (e) {
      results.apiTests.media = { error: e.message };
    }

    // Test 3: Commenti sul primo post
    if (results.apiTests.media?.ok && results.apiTests.media.posts?.length > 0) {
      const firstPost = results.apiTests.media.posts[0];
      try {
        const apiBase = account.platform === 'instagram' 
          ? 'https://graph.instagram.com/v21.0' 
          : 'https://graph.facebook.com/v21.0';
        const fields = account.platform === 'instagram' 
          ? 'id,text,username,from,timestamp' 
          : 'id,message,from,created_time';
        
        const commRes = await fetch(`${apiBase}/${firstPost.id}/comments?fields=${fields}&limit=5&access_token=${account.accessToken}`);
        const commData = await commRes.json();
        results.apiTests.comments = commData.error 
          ? { error: commData.error.message, code: commData.error.code } 
          : { ok: true, count: commData.data?.length || 0, comments: commData.data };
      } catch (e) {
        results.apiTests.comments = { error: e.message };
      }
    }

    // Test 4: Webhook subscription check
    try {
      const apiBase = account.platform === 'instagram' 
        ? 'https://graph.instagram.com/v21.0' 
        : 'https://graph.facebook.com/v21.0';
      
      const subRes = await fetch(`${apiBase}/${account.accountId}/subscribed_apps?access_token=${account.accessToken}`);
      const subData = await subRes.json();
      results.apiTests.webhookSubscription = subData.error 
        ? { error: subData.error.message } 
        : { ok: true, data: subData };
    } catch (e) {
      results.apiTests.webhookSubscription = { error: e.message };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Errore debug account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
