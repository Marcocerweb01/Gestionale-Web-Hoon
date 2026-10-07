import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import Notifica from '@/models/Notifica';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Tutte le notifiche (con ?limit=5 per dropdown)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['amministratore', 'collaboratore'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '0');

    const scope = session.user.role === 'amministratore'
      ? { $or: [{ destinatario: null }, { destinatario: session.user.id }] }
      : { destinatario: session.user.id };
    let query = Notifica.find(scope).sort({ createdAt: -1 });
    if (limit > 0) query = query.limit(limit);

    const notifiche = await query.lean();
    const nonLette = await Notifica.countDocuments({ ...scope, letta: false });

    return NextResponse.json({ notifiche, nonLette });
  } catch (error) {
    console.error('Errore GET notifiche:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// DELETE - Elimina tutte le notifiche già lette
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['amministratore', 'collaboratore'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();
    const scope = session.user.role === 'amministratore' ? { $or: [{ destinatario: null }, { destinatario: session.user.id }] } : { destinatario: session.user.id };
    const result = await Notifica.deleteMany({ ...scope, letta: true });

    return NextResponse.json({ eliminati: result.deletedCount });
  } catch (error) {
    console.error('Errore DELETE notifiche lette:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
