import { NextResponse } from 'next/server';
import { createNotifica } from '@/utils/createNotifica';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET - Controlla se siamo negli ultimi 5 giorni del mese e genera notifica fine mese.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const oggi = new Date();
    const ultimoGiornoMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0).getDate();
    const giornoCorrente = oggi.getDate();
    const giorniAllaFine = ultimoGiornoMese - giornoCorrente;

    if (giorniAllaFine > 5) {
      return NextResponse.json({ creata: false, motivo: 'Non siamo a fine mese' });
    }

    const mesi = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    const nomeMese = mesi[oggi.getMonth()];
    const anno = oggi.getFullYear();

    const notifica = await createNotifica({
      tipo: 'fine_mese',
      titolo: `Fine mese: scarica i dati di ${nomeMese}`,
      messaggio: `Mancano ${giorniAllaFine} giorni alla fine di ${nomeMese} ${anno}. Ricordati di scaricare i dati di fatturazione.`,
      link: '/Fatturazione',
      refId: `fine_mese_${nomeMese}_${anno}`,
    });

    return NextResponse.json({ creata: !!notifica });
  } catch (error) {
    console.error('Errore check fine mese:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
