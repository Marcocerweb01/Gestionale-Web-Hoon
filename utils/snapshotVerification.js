import SnapshotCollaborazioni from '../models/SnapshotCollaborazioni.js';
import Collaborazioni from '../models/Collaborazioni.js';
import { getCurrentMonth, updateSnapshot } from '../utils/snapshotManager.js';

// Sistema di verifica consistenza tra database e snapshot
export async function verifySnapshotConsistency() {
  try {
    const currentMonth = getCurrentMonth();
    
    // 1. Prendi snapshot corrente
    const snapshot = await SnapshotCollaborazioni.findOne({
      mese: currentMonth.mese,
      anno: currentMonth.anno
    });
    
    // 2. Prendi dati live dal database
    const collaborazioni = await Collaborazioni.find({ stato_collaborazione: 'attiva' })
      .populate('collaboratore', 'nome cognome')
      .populate('cliente', 'nome_azienda')
      .lean();
    
    if (!snapshot) {
      console.warn("⚠️ Snapshot mancante, creazione automatica...");
      await updateSnapshot();
      return { consistent: false, fixed: true, reason: "snapshot_missing" };
    }
    
    // 3. Confronta i conteggi
    const dbCount = collaborazioni.length;
    const snapshotCount = snapshot.collaborazioni_snapshot.length;
    
    if (dbCount !== snapshotCount) {
      console.warn(`⚠️ Inconsistenza conteggio: DB=${dbCount}, Snapshot=${snapshotCount}`);
      await updateSnapshot();
      return { consistent: false, fixed: true, reason: "count_mismatch" };
    }
    
    // 4. Confronta i dati specifici (campione)
    const sampleCollab = collaborazioni[0];
    const sampleSnapshot = snapshot.collaborazioni_snapshot.find(s => 
      s.collaborazione_id.toString() === sampleCollab._id.toString()
    );
    
    if (sampleSnapshot) {
      const dbPosts = sampleCollab.post_ig_fb_fatti || 0;
      const snapshotPosts = sampleSnapshot.post_ig_fb_fatti || 0;
      
      if (dbPosts !== snapshotPosts) {
        console.warn(`⚠️ Dati disallineati per ${sampleCollab.collaboratore?.nome}: DB=${dbPosts}, Snapshot=${snapshotPosts}`);
        await updateSnapshot();
        return { consistent: false, fixed: true, reason: "data_mismatch" };
      }
    }
    
    return { consistent: true, fixed: false, reason: "all_good" };
    
  } catch (error) {
    console.error("❌ Errore verifica consistenza:", error);
    return { consistent: false, fixed: false, reason: "error", error: error.message };
  }
}

// Auto-recovery che gira periodicamente
export async function autoRecoveryCheck() {
  console.log("🔍 Eseguendo controllo automatico consistenza...");
  
  const result = await verifySnapshotConsistency();
  
  if (!result.consistent) {
    console.log(`🔧 Inconsistenza rilevata e ${result.fixed ? 'CORRETTA' : 'NON CORRETTA'}: ${result.reason}`);
  } else {
    console.log("✅ Dati consistenti");
  }
  
  return result;
}

// Middleware per verificare prima degli export
export async function ensureConsistencyBeforeExport() {
  console.log("🔍 Verifica pre-export...");
  const result = await verifySnapshotConsistency();
  
  if (!result.consistent && !result.fixed) {
    throw new Error(`Dati inconsistenti e non recuperabili: ${result.reason}`);
  }
  
  return result;
}
