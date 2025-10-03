import mongoose from 'mongoose';
import SnapshotCollaborazioni from '../models/SnapshotCollaborazioni.js';
import Collaborazioni from '../models/Collaborazioni.js';

// Aggiornamento con transazione MongoDB
export async function transactionalUpdateSnapshot() {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const currentMonth = getCurrentMonth();
      
      // 1. Lock dello snapshot con versioning
      const snapshot = await SnapshotCollaborazioni.findOne({
        mese: currentMonth.mese,
        anno: currentMonth.anno
      }).session(session);
      
      if (!snapshot) {
        // Crea nuovo snapshot
        const newSnapshot = new SnapshotCollaborazioni({
          mese: currentMonth.mese,
          anno: currentMonth.anno,
          meseNome: currentMonth.meseNome,
          stato: 'attivo',
          version: 1
        });
        await newSnapshot.save({ session });
      }
      
      // 2. Leggi tutte le collaborazioni nella stessa transazione
      const collaborazioni = await Collaborazioni.find({ 
        stato_collaborazione: 'attiva' 
      })
      .populate('collaboratore', 'nome cognome email')
      .populate('azienda', 'ragioneSociale')
      .session(session);
      
      // 3. Aggiorna snapshot con versioning
      const updatedData = collaborazioni.map(collab => ({
        collaborazione_id: collab._id,
        collaboratore: collab.collaboratore ? 
          `${collab.collaboratore.nome} ${collab.collaboratore.cognome}` : 'N/A',
        cliente: collab.cliente?.nome_azienda || 'N/A',
        post_ig_fb_fatti: collab.post_ig_fb_fatti || 0,
        post_tiktok_fatti: collab.post_tiktok_fatti || 0,
        post_linkedin_fatti: collab.post_linkedin_fatti || 0,
        ultimo_aggiornamento: new Date()
      }));
      
      await SnapshotCollaborazioni.findOneAndUpdate(
        {
          mese: currentMonth.mese,
          anno: currentMonth.anno
        },
        {
          $set: {
            collaborazioni_snapshot: updatedData,
            data_ultimo_aggiornamento: new Date()
          },
          $inc: { version: 1 } // Incrementa versione
        },
        { session, new: true }
      );
      
      console.log(`✅ Snapshot aggiornato in transazione: ${updatedData.length} collaborazioni`);
    });
    
  } catch (error) {
    console.error('❌ Errore nella transazione snapshot:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}
