import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';

// GET - Lista account social dell'utente
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();
    
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    
    const filter = { userId: session.user.id };
    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    
    const accounts = await SocialAccount.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    // Rimuovi access token dalla risposta per sicurezza
    const sanitizedAccounts = accounts.map(acc => ({
      ...acc,
      accessToken: undefined
    }));
    
    return NextResponse.json(sanitizedAccounts);
  } catch (error) {
    console.error('Errore recupero account:', error);
    return NextResponse.json({ 
      error: 'Errore server', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Connetti nuovo account (dopo OAuth callback)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();
    
    const data = await req.json();
    const {
      platform,
      accountId,
      username,
      displayName,
      profilePicture,
      accessToken,
      tokenExpiry,
      permissions
    } = data;
    
    // Validazione
    if (!platform || !accountId || !username || !accessToken) {
      return NextResponse.json({ 
        error: 'Dati mancanti' 
      }, { status: 400 });
    }
    
    // Verifica se account già esistente
    const existing = await SocialAccount.findOne({ accountId });
    if (existing) {
      // Aggiorna token
      existing.accessToken = accessToken;
      existing.tokenExpiry = tokenExpiry;
      existing.status = 'active';
      existing.permissions = permissions || existing.permissions;
      existing.displayName = displayName || existing.displayName;
      existing.profilePicture = profilePicture || existing.profilePicture;
      await existing.save();
      
      return NextResponse.json({
        message: 'Account aggiornato',
        account: {
          ...existing.toObject(),
          accessToken: undefined
        }
      });
    }
    
    // Crea nuovo account
    const newAccount = new SocialAccount({
      userId: session.user.id,
      platform,
      accountId,
      username,
      displayName: displayName || username,
      profilePicture,
      accessToken,
      tokenExpiry,
      permissions: permissions || [],
      status: 'active'
    });
    
    await newAccount.save();
    
    return NextResponse.json({
      message: 'Account connesso con successo',
      account: {
        ...newAccount.toObject(),
        accessToken: undefined
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Errore connessione account:', error);
    return NextResponse.json({ 
      error: 'Errore server', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Disconnetti account
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();
    
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('id');
    
    if (!accountId) {
      return NextResponse.json({ error: 'ID account mancante' }, { status: 400 });
    }
    
    const account = await SocialAccount.findOne({
      _id: accountId,
      userId: session.user.id
    });
    
    if (!account) {
      return NextResponse.json({ error: 'Account non trovato' }, { status: 404 });
    }
    
    await account.deleteOne();
    
    return NextResponse.json({ 
      message: 'Account disconnesso con successo' 
    });
    
  } catch (error) {
    console.error('Errore disconnessione account:', error);
    return NextResponse.json({ 
      error: 'Errore server', 
      details: error.message 
    }, { status: 500 });
  }
}
