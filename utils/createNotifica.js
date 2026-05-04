/**
 * Utility server-side per creare notifiche.
 * Da importare nelle API route, NON nei componenti client.
 */
import { connectToDB } from '@/utils/database';
import Notifica from '@/models/Notifica';

/**
 * Crea una notifica evitando duplicati (stesso tipo + refId nello stesso giorno).
 */
export async function createNotifica({ tipo, titolo, messaggio, link = '', refId = '' }) {
  try {
    await connectToDB();

    // Evita duplicati: stesso tipo e refId creati oggi
    if (refId) {
      const inizioGiorno = new Date();
      inizioGiorno.setHours(0, 0, 0, 0);
      const esiste = await Notifica.findOne({
        tipo,
        refId,
        createdAt: { $gte: inizioGiorno },
      });
      if (esiste) return null; // già presente oggi
    }

    const notifica = await Notifica.create({ tipo, titolo, messaggio, link, refId });
    return notifica;
  } catch (error) {
    console.error('[createNotifica] Errore:', error);
    return null;
  }
}
