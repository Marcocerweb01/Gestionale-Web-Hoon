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

    // Evita duplicati: stesso refId già presente (qualunque giorno)
    if (refId) {
      const esiste = await Notifica.findOne({ tipo, refId });
      if (esiste) return null;
    }

    const notifica = await Notifica.create({ tipo, titolo, messaggio, link, refId });
    return notifica;
  } catch (error) {
    console.error('[createNotifica] Errore:', error);
    return null;
  }
}
