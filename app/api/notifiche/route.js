import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import Notifica from '@/models/Notifica';
import Nota from '@/models/Note';
import Collaborazione from '@/models/Collaborazioni';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from 'mongoose';
import NotificationLegacyDismissal from '@/models/NotificationLegacyDismissal';

export const dynamic = 'force-dynamic';

async function materializeLegacyAdminNotifications(userId) {
  const legacyNotifications = await Notifica.find({ destinatario: null }).lean();
  if (legacyNotifications.length === 0) return;
  const dismissed = await NotificationLegacyDismissal.find({ userId })
    .select('legacySourceId')
    .lean();
  const dismissedIds = new Set(dismissed.map((item) => item.legacySourceId.toString()));
  const visibleLegacyNotifications = legacyNotifications.filter(
    (notification) => !dismissedIds.has(notification._id.toString())
  );
  if (visibleLegacyNotifications.length === 0) return;

  await Notifica.bulkWrite(
    visibleLegacyNotifications.map((notification) => ({
      updateOne: {
        filter: { destinatario: userId, legacySourceId: notification._id },
        update: {
          $setOnInsert: {
            tipo: notification.tipo,
            titolo: notification.titolo,
            messaggio: notification.messaggio,
            letta: false,
            link: notification.link,
            refId: notification.refId,
            legacySourceId: notification._id,
            destinatario: userId,
            destinatarioModel: 'Amministratore',
            createdAt: notification.createdAt,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

// GET - Tutte le notifiche (con ?limit=5 per dropdown)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['amministratore', 'collaboratore'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    if (session.user.role === 'amministratore') {
      await materializeLegacyAdminNotifications(session.user.id);
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '0');

    const scope = { destinatario: session.user.id };
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
    const scope = { destinatario: session.user.id };
    const readLegacyNotifications = await Notifica.find({
      ...scope,
      letta: true,
      legacySourceId: { $ne: null },
    }).select('legacySourceId').lean();
    if (readLegacyNotifications.length > 0) {
      await NotificationLegacyDismissal.bulkWrite(
        readLegacyNotifications.map((notification) => ({
          updateOne: {
            filter: { userId: session.user.id, legacySourceId: notification.legacySourceId },
            update: { $setOnInsert: { userId: session.user.id, legacySourceId: notification.legacySourceId } },
            upsert: true,
          },
        })),
        { ordered: false }
      );
    }
    const result = await Notifica.deleteMany({ ...scope, letta: true });

    return NextResponse.json({ eliminati: result.deletedCount });
  } catch (error) {
    console.error('Errore DELETE notifiche lette:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
