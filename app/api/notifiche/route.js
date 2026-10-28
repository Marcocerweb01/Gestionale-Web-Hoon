import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import Notifica from '@/models/Notifica';
import Nota from '@/models/Note';
import Collaborazione from '@/models/Collaborazioni';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from 'mongoose';

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

    // Le vecchie notifiche problema contenevano solo l'autore nel link e
    // aprivano quindi il primo cliente del feed. Ricostruiamo sempre la
    // destinazione dalla nota, così funzionano anche le notifiche già salvate.
    const problemaRefIds = notifiche
      .filter((notifica) => notifica.tipo === 'nota_problema' && isValidObjectId(notifica.refId))
      .map((notifica) => notifica.refId);

    if (problemaRefIds.length > 0) {
      const noteProblema = await Nota.find({ _id: { $in: problemaRefIds } })
        .select('_id collaborazione autoreId')
        .lean();
      const collaborazioneIds = noteProblema.map((nota) => nota.collaborazione);
      const collaborazioni = await Collaborazione.find({ _id: { $in: collaborazioneIds } })
        .select('_id collaboratore')
        .lean();
      const noteById = new Map(noteProblema.map((nota) => [nota._id.toString(), nota]));
      const collaborazioniById = new Map(
        collaborazioni.map((collaborazione) => [collaborazione._id.toString(), collaborazione])
      );

      for (const notifica of notifiche) {
        if (notifica.tipo !== 'nota_problema') continue;
        const nota = noteById.get(notifica.refId);
        if (!nota) continue;
        const collaborazioneId = nota.collaborazione.toString();
        const collaborazione = collaborazioniById.get(collaborazioneId);
        const collaboratoreId = collaborazione?.collaboratore?.toString() || nota.autoreId?.toString();
        if (!collaboratoreId) continue;
        notifica.link = `/Feed-2/${encodeURIComponent(collaboratoreId)}?collaborazioneId=${encodeURIComponent(collaborazioneId)}&notaId=${encodeURIComponent(notifica.refId)}`;
      }
    }
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
