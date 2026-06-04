import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import Dominio from '@/models/Dominio';
import { createNotifica } from '@/utils/createNotifica';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Soglie in giorni in cui si vuole ricevere una notifica
const SOGLIE_GIORNI = [30, 20, 10, 5, 3, 2, 1];

/**
 * GET - Controlla domini in scadenza e genera notifiche alle soglie: 30,20,10,5,3,2,1 giorni.
 * Ogni soglia produce al massimo una notifica in assoluto (mai duplicati).
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
    const massimaSoglia = Math.max(...SOGLIE_GIORNI);
    const fraMaxGiorni = new Date();
    fraMaxGiorni.setDate(oggi.getDate() + massimaSoglia);

    // Recupera tutti i domini che scadono entro la soglia massima (o già scaduti)
    const domini = await Dominio.find({
      dataScadenza: { $lte: fraMaxGiorni },
    }).lean();

    let create = 0;

    for (const d of domini) {
      const giorniMancanti = Math.ceil((new Date(d.dataScadenza) - oggi) / (1000 * 60 * 60 * 24));

      if (giorniMancanti < 0) {
        // Dominio già scaduto — una sola notifica in assoluto
        const notifica = await createNotifica({
          tipo: 'dominio_scadenza',
          titolo: `Dominio scaduto: ${d.urlDominio}`,
          messaggio: `Il dominio ${d.urlDominio} (${d.webDesigner}) è scaduto ${Math.abs(giorniMancanti)} giorni fa!`,
          link: '/Gestione-Domini',
          refId: `dominio_scaduto_${d._id}`,
        });
        if (notifica) create++;
      } else {
        // Controlla tutte le soglie raggiunte (es. se siamo a 8gg → soglie 10,5 non ancora create)
        for (const soglia of SOGLIE_GIORNI) {
          if (giorniMancanti <= soglia) {
            const notifica = await createNotifica({
              tipo: 'dominio_scadenza',
              titolo: `Dominio in scadenza tra ${soglia} giorni: ${d.urlDominio}`,
              messaggio: `Il dominio ${d.urlDominio} (${d.webDesigner}) scade tra ${giorniMancanti} giorni (soglia ${soglia}gg).`,
              link: '/Gestione-Domini',
              refId: `dominio_${d._id}_${soglia}gg`,
            });
            if (notifica) create++;
          }
        }
      }
    }

    return NextResponse.json({ controllati: domini.length, create });
  } catch (error) {
    console.error('Errore check domini scadenza:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
