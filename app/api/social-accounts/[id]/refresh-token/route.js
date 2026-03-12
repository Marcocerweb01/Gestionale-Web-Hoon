import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Refresh token per Facebook (fb_exchange_token)
async function refreshFacebookToken(currentToken) {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${currentToken}`
  );
  const data = await response.json();
  if (data.access_token) {
    const expiresIn = data.expires_in || 5184000;
    return { accessToken: data.access_token, tokenExpiry: new Date(Date.now() + expiresIn * 1000) };
  }
  throw new Error(data.error?.message || 'Refresh token Facebook fallito');
}

// Refresh token per Instagram Business Login (ig_refresh_token)
async function refreshInstagramToken(currentToken) {
  const response = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
  );
  const data = await response.json();
  if (data.access_token) {
    const expiresIn = data.expires_in || 5184000;
    return { accessToken: data.access_token, tokenExpiry: new Date(Date.now() + expiresIn * 1000) };
  }
  throw new Error(data.error?.message || 'Refresh token Instagram fallito');
}

// POST - Refresh token di un account
export async function POST(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const params = await context.params;
    const accountId = params.id;

    await connectToDB();
    
    const account = await SocialAccount.findOne({
      _id: accountId,
      userId: new mongoose.Types.ObjectId(session.user.id)
    });
    
    if (!account) {
      return NextResponse.json({ error: 'Account non trovato' }, { status: 404 });
    }
    
    // Scegli il meccanismo di refresh in base alla piattaforma e al tipo di permessi
    const isInstagramBusinessLogin = account.platform === 'instagram' && 
      account.permissions?.some(p => p.startsWith('instagram_business_'));
    
    let result;
    if (isInstagramBusinessLogin) {
      result = await refreshInstagramToken(account.accessToken);
    } else {
      result = await refreshFacebookToken(account.accessToken);
    }
    
    // Aggiorna nel database
    account.accessToken = result.accessToken;
    account.tokenExpiry = result.tokenExpiry;
    account.status = 'active';
    await account.save();
    
    return NextResponse.json({
      message: 'Token aggiornato con successo',
      tokenExpiry: result.tokenExpiry
    });
    
  } catch (error) {
    console.error('Errore refresh token:', error);
    return NextResponse.json({ 
      error: 'Errore refresh token'
    }, { status: 500 });
  }
}
