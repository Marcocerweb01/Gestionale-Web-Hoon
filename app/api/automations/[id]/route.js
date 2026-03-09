import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDB } from '@/utils/database';
import SocialAutomation from '@/models/SocialAutomation';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// PATCH - Aggiorna automazione (toggle status, modifica dati)
export async function PATCH(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const params = await context.params;
    await connectToDB();

    const automation = await SocialAutomation.findOne({
      _id: params.id,
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automazione non trovata' }, { status: 404 });
    }

    const data = await req.json();

    if (data.status !== undefined) automation.status = data.status;
    if (data.name !== undefined) automation.name = data.name;
    if (data.trigger !== undefined) automation.trigger = data.trigger;
    if (data.action !== undefined) automation.action = data.action;

    await automation.save();

    return NextResponse.json(automation);
  } catch (error) {
    console.error('Errore aggiornamento automazione:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}

// DELETE - Elimina automazione
export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const params = await context.params;
    await connectToDB();

    const automation = await SocialAutomation.findOneAndDelete({
      _id: params.id,
      userId: new mongoose.Types.ObjectId(session.user.id)
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automazione non trovata' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore eliminazione automazione:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
