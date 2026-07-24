import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import { Collaboratore, Amministratore, Azienda } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

// PATCH - Aggiorna password o status di un utente (solo per amministratori)
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { newPassword, tipo, status } = await req.json();

    if (!newPassword && !status) {
      return NextResponse.json(
        { error: 'Nessun dato da aggiornare' },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
    }

    if (status && !['attivo', 'non_attivo'].includes(status)) {
      return NextResponse.json({ error: 'Status utente non valido' }, { status: 400 });
    }

    if (!tipo || !['collaboratore', 'amministratore', 'azienda'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo utente non valido' }, { status: 400 });
    }

    await connectToDB();

    const modelMap = {
      collaboratore: Collaboratore,
      amministratore: Amministratore,
      azienda: Azienda,
    };

    const Model = modelMap[tipo];
    const user = await Model.findById(id);

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Impedisce all'admin di modificare la propria password da questa interfaccia
    if (user._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'Non puoi modificare il tuo stesso account da qui' },
        { status: 400 }
      );
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    if (status) {
      if (!['collaboratore', 'azienda'].includes(tipo)) {
        return NextResponse.json(
          { error: 'Lo status attivo/non attivo è disponibile solo per collaboratori e aziende' },
          { status: 400 }
        );
      }

      user.status = status;
    }

    await user.save();

    return NextResponse.json({
      message: newPassword && status
        ? 'Utente aggiornato con successo'
        : newPassword
          ? 'Password aggiornata con successo'
          : 'Status aggiornato con successo',
      user: {
        _id: user._id,
        nome: user.nome,
        cognome: user.cognome || '',
        email: user.email,
        tipo,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Errore aggiornamento utente:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
