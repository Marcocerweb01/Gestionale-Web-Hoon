import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// GET - Callback OAuth da Meta
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // Costruisce base URL corretta (gestisce Railway proxy interno)
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || new URL(req.url).origin);
    
    if (!session) {
      return NextResponse.redirect(`${baseUrl}/Login`);
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    
    // Verifica errori OAuth
    if (error) {
      const errorReason = searchParams.get('error_reason');
      const errorDescription = searchParams.get('error_description');
      
      console.error('OAuth Error:', {
        error,
        errorReason,
        errorDescription
      });
      
      return NextResponse.redirect(`${baseUrl}/Operations/SocialAutomation?error=${encodeURIComponent(errorDescription || error)}`);
    }
    
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/Operations/SocialAutomation?error=missing_code`);
    }
    
    // ── INSTAGRAM BUSINESS LOGIN (state=instagram) ──────────────────────────
    if (state === 'instagram') {
      // Scambio code → short-lived token
      const igTokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID,
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || process.env.NEXT_PUBLIC_META_REDIRECT_URI,
          code: code.replace('#_', ''), // Instagram aggiunge #_ alla fine
        }),
      });
      const igTokenData = await igTokenRes.json();
      console.log('[IG CALLBACK] Token response:', JSON.stringify(igTokenData));

      if (igTokenData.error_message || igTokenData.error_type) {
        return NextResponse.redirect(`${baseUrl}/Operations/SocialAutomation?error=${encodeURIComponent(igTokenData.error_message || 'Instagram auth error')}`);
      }

      const shortToken = igTokenData.access_token;
      const igUserId = igTokenData.user_id;

      // Scambio short → long-lived token
      const llRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortToken}`
      );
      const llData = await llRes.json();
      console.log('[IG CALLBACK] Long-lived token response:', JSON.stringify(llData));
      const longToken = llData.access_token || shortToken;

      // Info account Instagram
      const igMeRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url&access_token=${longToken}`
      );
      const igMe = await igMeRes.json();
      console.log('[IG CALLBACK] /me response:', JSON.stringify(igMe));

      await connectToDB();
      const userId = new mongoose.Types.ObjectId(session.user.id);
      const existing = await SocialAccount.findOne({ accountId: igMe.id });
      if (existing) {
        existing.accessToken = longToken;
        existing.tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        existing.status = 'active';
        existing.userId = userId;
        existing.displayName = igMe.name || igMe.username;
        existing.profilePicture = igMe.profile_picture_url || existing.profilePicture;
        await existing.save();
      } else {
        await new SocialAccount({
          userId,
          platform: 'instagram',
          accountId: igMe.id,
          username: igMe.username,
          displayName: igMe.name || igMe.username,
          profilePicture: igMe.profile_picture_url,
          accessToken: longToken,
          tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'active',
          permissions: ['instagram_business_basic', 'instagram_business_manage_comments'],
        }).save();
      }

      // Auto-subscribe ai webhook Instagram dopo connessione
      try {
        const subRes = await fetch(
          `https://graph.instagram.com/v21.0/${igMe.id}/subscribed_apps?subscribed_fields=comments,messages&access_token=${longToken}`,
          { method: 'POST' }
        );
        const subData = await subRes.json();
        console.log('[IG CALLBACK] Auto-subscribe webhook:', JSON.stringify(subData));
      } catch (subErr) {
        console.log('[IG CALLBACK] Auto-subscribe webhook fallito:', subErr.message);
      }

      return NextResponse.redirect(`${baseUrl}/Operations/SocialAutomation?success=true&accounts=1`);
    }

    // ── FACEBOOK LOGIN (state=facebook o default) ────────────────────────────

    // Scambia code per access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_META_REDIRECT_URI)}&client_secret=${process.env.META_APP_SECRET}&code=${code}`
    );
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Token Exchange Error:', tokenData.error);
      return NextResponse.redirect(
        new URL(`/Operations/SocialAutomation?error=${encodeURIComponent(tokenData.error.message)}`, req.url)
      );
    }
    
    const accessToken = tokenData.access_token;
    console.log(`[META CALLBACK] Token type: ${tokenData.token_type}, expires_in: ${tokenData.expires_in}`);
    
    // Debug: verifica permessi effettivamente concessi
    const permRes = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`);
    const permData = await permRes.json();
    console.log(`[META CALLBACK] Permessi concessi:`, JSON.stringify(permData));
    
    // Metodo 1: /me/accounts (standard Graph API)
    const allPages = [];
    let nextUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,username,picture,access_token&limit=100&access_token=${accessToken}`;
    
    while (nextUrl) {
      const res = await fetch(nextUrl);
      const data = await res.json();
      console.log('[META CALLBACK] /me/accounts response:', JSON.stringify(data).substring(0, 800));
      if (data.error) { console.error('[META CALLBACK] /me/accounts error:', data.error); break; }
      if (data.data) allPages.push(...data.data);
      nextUrl = data.paging?.next || null;
    }
    
    // Metodo 2: fallback con campo nested su /me
    if (allPages.length === 0) {
      let meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,accounts{id,username,name,picture,access_token}&access_token=${accessToken}`;
      while (meUrl) {
        const meRes = await fetch(meUrl);
        const meData = await meRes.json();
        console.log('[META CALLBACK] /me nested response:', JSON.stringify(meData).substring(0, 800));
        if (meData.error) { break; }
        const pagesData = meData.accounts;
        if (pagesData?.data) allPages.push(...pagesData.data);
        meUrl = pagesData?.paging?.next || null;
      }
    }
    
    // Metodo 3: Business Manager pages (per pagine gestite tramite Meta Business Suite)
    try {
      const bizRes = await fetch(`https://graph.facebook.com/v21.0/me/businesses?fields=id,name,owned_pages{id,name,username,picture,access_token},client_pages{id,name,username,picture,access_token}&access_token=${accessToken}`);
      const bizData = await bizRes.json();
      console.log('[META CALLBACK] /me/businesses response:', JSON.stringify(bizData).substring(0, 1000));
      if (!bizData.error && bizData.data) {
        for (const biz of bizData.data) {
          if (biz.owned_pages?.data) {
            for (const p of biz.owned_pages.data) {
              if (!allPages.find(x => x.id === p.id)) allPages.push(p);
            }
          }
          if (biz.client_pages?.data) {
            for (const p of biz.client_pages.data) {
              if (!allPages.find(x => x.id === p.id)) allPages.push(p);
            }
          }
        }
      }
    } catch (e) {
      console.log('[META CALLBACK] /me/businesses error:', e.message);
    }

    console.log(`[META CALLBACK] Trovate ${allPages.length} pagine Facebook`);
    
    await connectToDB();
    
    const accountsToSave = [];
    
    // Facebook Pages
    for (const page of allPages) {
        // Se la pagina non ha access_token (es. Business Manager), lo recuperiamo separatamente
        let pageToken = page.access_token;
        if (!pageToken) {
          try {
            const tokenRes = await fetch(
              `https://graph.facebook.com/v21.0/${page.id}?fields=access_token,name,username,picture&access_token=${accessToken}`
            );
            const tokenData = await tokenRes.json();
            console.log(`[META CALLBACK] Fetch token per page ${page.name}:`, JSON.stringify(tokenData).substring(0, 300));
            pageToken = tokenData.access_token;
          } catch (e) {
            console.log(`[META CALLBACK] Impossibile recuperare token per page ${page.id}:`, e.message);
          }
        }

        if (!pageToken) {
          console.log(`[META CALLBACK] Skip page ${page.name} - nessun access token disponibile`);
          continue;
        }

        accountsToSave.push({
          platform: 'facebook',
          accountId: page.id,
          username: page.username || page.name,
          displayName: page.name,
          profilePicture: page.picture?.data?.url || page.picture?.url,
          accessToken: pageToken,
          tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          permissions: ['pages_read_engagement']
        });
        
        // Chiamata separata per ottenere l'Instagram Account collegato alla Page
        try {
          const igRes = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url},connected_instagram_account{id,username,name,profile_picture_url}&access_token=${pageToken}`
          );
          const igData = await igRes.json();
          
          console.log(`[META CALLBACK] Page ${page.name} (${page.id}) - IG response:`, JSON.stringify(igData));
          
          // Supporta sia Business che Creator account
          const igAccount = igData.instagram_business_account || igData.connected_instagram_account;
          if (igAccount) {
            accountsToSave.push({
              platform: 'instagram',
              accountId: igAccount.id,
              username: igAccount.username,
              displayName: igAccount.name || igAccount.username,
              profilePicture: igAccount.profile_picture_url,
              accessToken: pageToken,
              tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              permissions: ['instagram_manage_comments', 'instagram_content_publish']
            });
          }
        } catch (igErr) {
          console.error(`Errore recupero Instagram per page ${page.id}:`, igErr);
        }
    }
    
    // Salva account nel database
    let savedCount = 0;
    for (const accountData of accountsToSave) {
      const existing = await SocialAccount.findOne({ accountId: accountData.accountId });
      
      if (existing) {
        // Aggiorna
        existing.accessToken = accountData.accessToken;
        existing.tokenExpiry = accountData.tokenExpiry;
        existing.status = 'active';
        existing.displayName = accountData.displayName || existing.displayName;
        existing.profilePicture = accountData.profilePicture || existing.profilePicture;
        existing.userId = new mongoose.Types.ObjectId(session.user.id); // fix userId type
        await existing.save();
      } else {
        // Crea nuovo
        const newAccount = new SocialAccount({
          ...accountData,
          userId: new mongoose.Types.ObjectId(session.user.id)
        });
        await newAccount.save();
      }
      
      savedCount++;
    }

    // Auto-subscribe tutte le pagine Facebook ai webhook
    for (const accountData of accountsToSave) {
      try {
        if (accountData.platform === 'facebook') {
          const subRes = await fetch(
            `https://graph.facebook.com/v21.0/${accountData.accountId}/subscribed_apps?subscribed_fields=feed,messages&access_token=${accountData.accessToken}`,
            { method: 'POST' }
          );
          const subData = await subRes.json();
          console.log(`[META CALLBACK] Auto-subscribe webhook page ${accountData.accountId}:`, JSON.stringify(subData));
        }
      } catch (subErr) {
        console.log(`[META CALLBACK] Auto-subscribe fallito per ${accountData.accountId}:`, subErr.message);
      }
    }
    
    // Redirect con successo
    return NextResponse.redirect(`${baseUrl}/Operations/SocialAutomation?success=true&accounts=${savedCount}`);
    
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(`${baseUrl}/Operations/SocialAutomation?error=${encodeURIComponent(error.message)}`);
  }
}
