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
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '0');

    let query = Notifica.find().sort({ createdAt: -1 });
    if (limit > 0) query = query.limit(limit);

    const notifiche = await query.lean();
    const nonLette = await Notifica.countDocuments({ letta: false });

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
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();
    const result = await Notifica.deleteMany({ letta: true });

    return NextResponse.json({ eliminati: result.deletedCount });
  } catch (error) {
    console.error('Errore DELETE notifiche lette:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
