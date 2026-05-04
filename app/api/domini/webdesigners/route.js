import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import { Collaboratore } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Recupera i nomi dei web designer attivi
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'amministratore' && session.user.role !== 'segretaria')) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const webDesigners = await Collaboratore.find({
      subRoles: 'web designer',
      status: 'attivo',
    })
      .select('nome cognome')
      .sort({ nome: 1 })
      .lean();

    const nomi = webDesigners.map(c => `${c.nome} ${c.cognome}`.trim());

    return NextResponse.json(nomi);
  } catch (error) {
    console.error('Errore GET webdesigners:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
