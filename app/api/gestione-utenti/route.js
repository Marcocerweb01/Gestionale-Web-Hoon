import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import { Collaboratore, Amministratore, Azienda } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Lista tutti gli utenti (solo per amministratori)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const [collaboratori, amministratori, aziende] = await Promise.all([
      Collaboratore.find({}, '_id nome cognome email status subRoles').lean(),
      Amministratore.find({}, '_id nome cognome email ruolo').lean(),
      Azienda.find({}, '_id nome cognome email ragioneSociale').lean(),
    ]);

    const result = [
      ...amministratori.map(u => ({
        _id: u._id,
        nome: u.nome,
        cognome: u.cognome || '',
        email: u.email,
        tipo: 'amministratore',
        etichetta: u.ruolo === 'segretaria' ? 'Segretaria' : 'Amministratore',
      })),
      ...collaboratori.map(u => ({
        _id: u._id,
        nome: u.nome,
        cognome: u.cognome,
        email: u.email,
        tipo: 'collaboratore',
        etichetta: 'Collaboratore',
        status: u.status,
        subRoles: u.subRoles || [],
      })),
      ...aziende.map(u => ({
        _id: u._id,
        nome: u.ragioneSociale || u.nome || '',
        cognome: '',
        email: u.email,
        tipo: 'azienda',
        etichetta: 'Azienda',
      })),
    ];

    return NextResponse.json(result);
  } catch (error) {
    console.error('Errore lista utenti:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
