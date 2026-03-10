import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAutomation from '@/models/SocialAutomation';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// GET - Lista automazioni (filtrabili per accountId)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    const filter = { userId: new mongoose.Types.ObjectId(session.user.id) };
    if (accountId) filter.accountId = new mongoose.Types.ObjectId(accountId);

    const automations = await SocialAutomation.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(automations);
  } catch (error) {
    console.error('Errore recupero automazioni:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

// POST - Crea nuova automazione
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();

    const data = await req.json();
    const { accountId, name, platform, type, trigger, action } = data;

    if (!accountId || !name || !platform || !type || !action?.message) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Verifica che l'account appartenga all'utente
    const account = await SocialAccount.findOne({
      _id: new mongoose.Types.ObjectId(accountId),
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!account) {
      return NextResponse.json({ error: 'Account non trovato' }, { status: 404 });
    }

    console.log('📝 Creazione automazione con dati:', {
      accountId, name, platform, type,
      trigger: trigger || { keywords: [] },
      actionType: action.type || action.actionType,
      hasMessage: !!action.message
    });

    const automation = await SocialAutomation.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      accountId: new mongoose.Types.ObjectId(accountId),
      name,
      platform,
      type,
      trigger: trigger || { keywords: [] },
      action: {
        actionType: action.type || action.actionType,
        message: action.message,
        template: action.template,
        delay: action.delay
      },
      status: 'active'
    });

    console.log('✅ Automazione creata con successo:', automation._id);
    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error('❌ Errore creazione automazione:', error);
    
    // Errori di validazione Mongoose
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(e => e.message).join(', ');
      return NextResponse.json({ 
        error: 'Errore validazione', 
        details 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Errore server',
      details: error.message 
    }, { status: 500 });
  }
}
