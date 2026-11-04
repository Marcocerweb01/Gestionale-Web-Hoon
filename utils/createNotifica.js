/**
 * Utility server-side per creare notifiche.
 * Da importare nelle API route, NON nei componenti client.
 */
import { connectToDB } from '@/utils/database';
import { notifyAdmins } from '@/lib/notification-preferences';

/**
 * Crea una notifica personale per ogni amministratore che ha scelto di riceverla.
 * Accoda e tenta subito anche l'email quando il canale è attivo.
 */
export async function createNotifica({ tipo, titolo, messaggio, link = '', refId = '', attachmentSnapshotId = null, attachmentFilename = '' }) {
  try {
    await connectToDB();

    const results = await notifyAdmins({ tipo, titolo, messaggio, link, refId, attachmentSnapshotId, attachmentFilename });
    return results.find((result) => result.notification || result.delivery) || null;
  } catch (error) {
    console.error('[createNotifica] Errore:', error);
    return null;
  }
}
