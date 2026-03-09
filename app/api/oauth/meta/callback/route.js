import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';

// GET - Callback OAuth da Meta
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.redirect(new URL('/Login', req.url));
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
      
      return NextResponse.redirect(
        new URL(`/Operations/SocialAutomation?error=${encodeURIComponent(errorDescription || error)}`, req.url)
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/Operations/SocialAutomation?error=missing_code', req.url)
      );
    }
    
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
    
    // Ottieni info utente/pagine + account Instagram collegati
    const meResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,accounts{id,username,name,picture,access_token,connected_instagram_account{id,username,name,profile_picture_url},instagram_business_account{id,username,name,profile_picture_url}}&access_token=${accessToken}`
    );
    
    const meData = await meResponse.json();
    
    if (meData.error) {
      console.error('Me API Error:', meData.error);
      return NextResponse.redirect(
        new URL(`/Operations/SocialAutomation?error=${encodeURIComponent(meData.error.message)}`, req.url)
      );
    }
    
    await connectToDB();
    
    const accountsToSave = [];
    
    // Facebook Pages
    if (meData.accounts?.data) {
      for (const page of meData.accounts.data) {
        accountsToSave.push({
          platform: 'facebook',
          accountId: page.id,
          username: page.username || page.name,
          displayName: page.name,
          profilePicture: page.picture?.data?.url,
          accessToken: page.access_token,
          tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          permissions: ['pages_read_engagement']
        });
        
        // Chiamata separata per ottenere l'Instagram Business Account collegato alla Page
        try {
          const igRes = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url}&access_token=${page.access_token}`
          );
          const igData = await igRes.json();
          
          console.log(`[META CALLBACK] Page ${page.name} (${page.id}) - IG response:`, JSON.stringify(igData));
          
          const igAccount = igData.instagram_business_account;
          if (igAccount) {
            accountsToSave.push({
              platform: 'instagram',
              accountId: igAccount.id,
              username: igAccount.username,
              displayName: igAccount.name || igAccount.username,
              profilePicture: igAccount.profile_picture_url,
              accessToken: page.access_token,
              tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              permissions: ['instagram_manage_comments', 'instagram_content_publish']
            });
          }
        } catch (igErr) {
          console.error(`Errore recupero Instagram per page ${page.id}:`, igErr);
        }
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
        await existing.save();
      } else {
        // Crea nuovo
        const newAccount = new SocialAccount({
          ...accountData,
          userId: session.user.id
        });
        await newAccount.save();
      }
      
      savedCount++;
    }
    
    // Redirect con successo
    return NextResponse.redirect(
      new URL(`/Operations/SocialAutomation?success=true&accounts=${savedCount}`, req.url)
    );
    
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(
      new URL(`/Operations/SocialAutomation?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }
}
