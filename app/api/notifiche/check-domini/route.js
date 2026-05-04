import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import Dominio from '@/models/Dominio';
import { createNotifica } from '@/utils/createNotifica';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET - Controlla domini in scadenza (entro 30 giorni) e genera notifiche.
 * Chiamato automaticamente dal NotificheDropdown al caricamento del primo admin.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const oggi = new Date();
    const fra30giorni = new Date();
    fra30giorni.setDate(oggi.getDate() + 30);

    const dominiInScadenza = await Dominio.find({
      dataScadenza: { $gte: oggi, $lte: fra30giorni },
    }).lean();

    let create = 0;
    for (const d of dominiInScadenza) {
      const giorniMancanti = Math.ceil((new Date(d.dataScadenza) - oggi) / (1000 * 60 * 60 * 24));
      const notifica = await createNotifica({
        tipo: 'dominio_scadenza',
        titolo: `Dominio in scadenza: ${d.urlDominio}`,
        messaggio: `Il dominio ${d.urlDominio} (${d.webDesigner}) scade tra ${giorniMancanti} giorni.`,
        link: '/Gestione-Domini',
        refId: `dominio_${d._id}`,
      });
      if (notifica) create++;
    }

    // Controlla anche domini già scaduti ma non notificati
    const dominiScaduti = await Dominio.find({
      dataScadenza: { $lt: oggi },
    }).lean();

    for (const d of dominiScaduti) {
      const giorniFA = Math.abs(Math.ceil((new Date(d.dataScadenza) - oggi) / (1000 * 60 * 60 * 24)));
      const notifica = await createNotifica({
        tipo: 'dominio_scadenza',
        titolo: `Dominio scaduto: ${d.urlDominio}`,
        messaggio: `Il dominio ${d.urlDominio} (${d.webDesigner}) è scaduto ${giorniFA} giorni fa!`,
        link: '/Gestione-Domini',
        refId: `dominio_scaduto_${d._id}`,
      });
      if (notifica) create++;
    }

    return NextResponse.json({ controllati: dominiInScadenza.length + dominiScaduti.length, create });
  } catch (error) {
    console.error('Errore check domini scadenza:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
