import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAutomation from '@/models/SocialAutomation';
import SocialAccount from '@/models/SocialAccount';
import { NextResponse } from 'next/server';

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

    const filter = { userId: session.user.id };
    if (accountId) filter.accountId = accountId;

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
      _id: accountId,
      userId: session.user.id
    });

    if (!account) {
      return NextResponse.json({ error: 'Account non trovato' }, { status: 404 });
    }

    const automation = await SocialAutomation.create({
      userId: session.user.id,
      accountId,
      name,
      platform,
      type,
      trigger: trigger || { keywords: [] },
      action,
      status: 'active'
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error('Errore creazione automazione:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
