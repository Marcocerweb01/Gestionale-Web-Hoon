import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import Notifica from '@/models/Notifica';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import NotificationLegacyDismissal from '@/models/NotificationLegacyDismissal';

export const dynamic = 'force-dynamic';

// PATCH - Segna come letta
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['amministratore', 'collaboratore'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();
    const { id } = await params;

    const scope = { _id: id, destinatario: session.user.id };
    const notifica = await Notifica.findOneAndUpdate(
      scope,
      { letta: true },
      { new: true }
    );

    if (!notifica) {
      return NextResponse.json({ error: 'Non trovata' }, { status: 404 });
    }

    return NextResponse.json(notifica);
  } catch (error) {
    console.error('Errore PATCH notifica:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// DELETE - Elimina singola notifica
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['amministratore', 'collaboratore'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();
    const { id } = await params;

    const scope = { _id: id, destinatario: session.user.id };
    const notification = await Notifica.findOneAndDelete(scope);
    if (!notification) {
      return NextResponse.json({ error: 'Non trovata' }, { status: 404 });
    }
    if (notification.legacySourceId) {
      await NotificationLegacyDismissal.findOneAndUpdate(
        { userId: session.user.id, legacySourceId: notification.legacySourceId },
        { $setOnInsert: { userId: session.user.id, legacySourceId: notification.legacySourceId } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Errore DELETE notifica:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
