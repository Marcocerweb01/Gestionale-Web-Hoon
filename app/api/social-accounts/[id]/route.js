import { requireAdminSession } from '@/lib/adminAuth';
import { connectToDB } from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// GET - Dettagli account specifico
export async function GET(req, context) {
  try {
    const auth = await requireAdminSession();
    if (auth.error) return auth.error;
    const { session } = auth;

    const params = await context.params;
    const accountId = params.id;

    await connectToDB();
    
    const account = await SocialAccount.findOne({
      _id: accountId,
      userId: new mongoose.Types.ObjectId(session.user.id)
    }).lean();
    
    if (!account) {
      return NextResponse.json({ error: 'Account non trovato' }, { status: 404 });
    }
    
    // Rimuovi access token
    const sanitizedAccount = {
      ...account,
      accessToken: undefined
    };
    
    return NextResponse.json(sanitizedAccount);
  } catch (error) {
    console.error('Errore recupero account:', error);
    return NextResponse.json({ 
      error: 'Errore server', 
      details: error.message 
    }, { status: 500 });
  }
}

// PATCH - Aggiorna statistiche account
export async function PATCH(req, context) {
  try {
    const auth = await requireAdminSession();
    if (auth.error) return auth.error;
    const { session } = auth;

    const params = await context.params;
    const accountId = params.id;

    await connectToDB();
    
    const account = await SocialAccount.findOne({
      _id: accountId,
      userId: session.user.id
    });
    
    if (!account) {
      return NextResponse.json({ error: 'Account non trovato' }, { status: 404 });
    }
    
    const data = await req.json();
    
    // Aggiorna solo campi permessi
    if (data.stats) {
      account.stats = {
        ...account.stats,
        ...data.stats,
        lastSync: new Date()
      };
    }
    
    if (data.status) {
      account.status = data.status;
    }
    
    await account.save();
    
    return NextResponse.json({
      message: 'Account aggiornato',
      account: {
        ...account.toObject(),
        accessToken: undefined
      }
    });
    
  } catch (error) {
    console.error('Errore aggiornamento account:', error);
    return NextResponse.json({ 
      error: 'Errore server', 
      details: error.message 
    }, { status: 500 });
  }
}
