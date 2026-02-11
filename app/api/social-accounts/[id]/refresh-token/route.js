import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import connectDB from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';

// Funzione helper per refresh token Meta
async function refreshMetaToken(accountId, currentToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${currentToken}`
    );
    
    const data = await response.json();
    
    if (data.access_token) {
      // Token esteso dura ~60 giorni
      const expiresIn = data.expires_in || 5184000; // 60 giorni default
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      
      return {
        accessToken: data.access_token,
        tokenExpiry
      };
    }
    
    throw new Error(data.error?.message || 'Refresh token fallito');
  } catch (error) {
    console.error('Errore refresh token:', error);
    throw error;
  }
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

    await connectDB();
    
    const account = await SocialAccount.findOne({
      _id: accountId,
      userId: session.user.id
    });
    
    if (!account) {
      return NextResponse.json({ error: 'Account non trovato' }, { status: 404 });
    }
    
    // Refresh token
    const { accessToken, tokenExpiry } = await refreshMetaToken(
      account.accountId,
      account.accessToken
    );
    
    // Aggiorna nel database
    account.accessToken = accessToken;
    account.tokenExpiry = tokenExpiry;
    account.status = 'active';
    await account.save();
    
    return NextResponse.json({
      message: 'Token aggiornato con successo',
      tokenExpiry
    });
    
  } catch (error) {
    console.error('Errore refresh token:', error);
    return NextResponse.json({ 
      error: 'Errore refresh token', 
      details: error.message 
    }, { status: 500 });
  }
}
