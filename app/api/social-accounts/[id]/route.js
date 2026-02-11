import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import connectDB from '@/utils/database';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';

// GET - Dettagli account specifico
export async function GET(req, context) {
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
