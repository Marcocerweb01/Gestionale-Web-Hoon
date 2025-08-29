// Hook per aggiornare automaticamente lo snapshot quando cambiano le collaborazioni
import { updateCurrentMonthSnapshot } from '../utils/snapshotManager.js';

// Sistema di debounce per evitare troppi aggiornamenti simultanei
let updateTimeout = null;
let isUpdating = false;

async function debouncedUpdateSnapshot() {
  // Cancella il timer precedente
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  
  // Imposta un nuovo timer di 300ms
  updateTimeout = setTimeout(async () => {
    if (isUpdating) {
      console.log("⏳ Aggiornamento snapshot già in corso, saltando...");
      return;
    }
    
    try {
      isUpdating = true;
      console.log("🔄 Eseguendo aggiornamento snapshot (debounced)...");
      await updateCurrentMonthSnapshot();
      console.log("✅ Aggiornamento snapshot completato");
    } catch (error) {
      console.error("❌ Errore aggiornamento snapshot:", error);
    } finally {
      isUpdating = false;
    }
  }, 300); // Aspetta 300ms di "silenzio"
}

// Chiamata automatica quando:
// 1. Si modifica una collaborazione 
// 2. Si aggiunge/rimuove un SMM
// 3. Si crea/cancella una collaborazione

export async function triggerSnapshotUpdate(action, data = {}) {
  try {
    console.log(`🔄 Trigger snapshot update: ${action}`, data);
    // Usa la versione debounced invece di quella diretta
    await debouncedUpdateSnapshot();
  } catch (error) {
    console.error(`❌ Errore trigger snapshot per ${action}:`, error);
    // Non bloccare l'operazione principale se l'aggiornamento snapshot fallisce
  }
}
