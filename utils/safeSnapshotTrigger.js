// Sistema ibrido: aggiornamento immediato + debounce per performance
import { updateCurrentMonthSnapshot } from '../utils/snapshotManager.js';

let updateTimeout = null;
let isUpdating = false;
let pendingUpdates = new Set();

// Aggiornamento immediato per operazioni critiche
async function immediateUpdateSnapshot(action, data) {
  try {
    console.log(`🚨 Aggiornamento IMMEDIATO per: ${action}`);
    await updateCurrentMonthSnapshot();
    console.log(`✅ Snapshot aggiornato immediatamente`);
    return true;
  } catch (error) {
    console.error(`❌ Errore aggiornamento immediato:`, error);
    return false;
  }
}

// Sistema di backup con retry
async function backupUpdateWithRetry(action, data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await updateCurrentMonthSnapshot();
      console.log(`✅ Backup update riuscito (tentativo ${i + 1})`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Backup update fallito (tentativo ${i + 1}):`, error.message);
      if (i < retries - 1) {
        // Aspetta prima del retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  console.error(`❌ Backup update fallito dopo ${retries} tentativi`);
  return false;
}

export async function triggerSnapshotUpdate(action, data = {}) {
  const operationId = Date.now() + Math.random();
  pendingUpdates.add(operationId);
  
  try {
    console.log(`🔄 Trigger snapshot update: ${action}`, data);
    
    // STRATEGIA DOPPIA SICUREZZA:
    
    // 1. TENTATIVO IMMEDIATO (per sicurezza)
    const immediateSuccess = await immediateUpdateSnapshot(action, data);
    
    // 2. BACKUP DEBOUNCED (per performance e ridondanza)
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    updateTimeout = setTimeout(async () => {
      if (isUpdating) {
        console.log("⏳ Backup update già in corso...");
        return;
      }
      
      try {
        isUpdating = true;
        console.log("🔄 Eseguendo backup update (debounced)...");
        await backupUpdateWithRetry("BACKUP_UPDATE", {});
      } finally {
        isUpdating = false;
        pendingUpdates.clear();
      }
    }, 500);
    
    if (!immediateSuccess) {
      console.warn(`⚠️ Aggiornamento immediato fallito per ${action}, backup in corso...`);
    }
    
  } catch (error) {
    console.error(`❌ Errore trigger snapshot per ${action}:`, error);
  } finally {
    pendingUpdates.delete(operationId);
  }
}
