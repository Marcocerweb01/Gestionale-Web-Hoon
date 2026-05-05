import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import { Collaboratore, Amministratore, Azienda } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

// PATCH - Resetta la password di un utente (solo per amministratori)
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { newPassword, tipo } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      );
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
        { error: 'Non puoi modificare la tua stessa password da qui' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    console.error('Errore reset password:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
