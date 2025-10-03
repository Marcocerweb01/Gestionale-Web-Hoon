// Sistema di debounce per evitare troppi aggiornamenti simultanei
import { updateSnapshot } from './snapshotManager.js'; // ✨ Fix: import corretto

let updateTimeout = null;
let isUpdating = false;

export async function debouncedUpdateSnapshot() {
  // Cancella il timer precedente
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  
  // Imposta un nuovo timer di 500ms
  updateTimeout = setTimeout(async () => {
    if (isUpdating) {
      console.log("⏳ Aggiornamento snapshot già in corso, saltando...");
      return;
    }
    
    try {
      isUpdating = true;
      console.log("🔄 Eseguendo aggiornamento snapshot (debounced)...");
      await updateSnapshot(); // ✨ Fix: funzione corretta
      console.log("✅ Aggiornamento snapshot completato");
    } catch (error) {
      console.error("❌ Errore aggiornamento snapshot:", error);
    } finally {
      isUpdating = false;
    }
  }, 500); // Aspetta 500ms di "silenzio" prima di aggiornare
}

// Funzione con retry automatico
export async function safeUpdateSnapshot(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await updateSnapshot(); // ✨ Fix: funzione corretta
      return;
    } catch (error) {
      console.warn(`⚠️ Tentativo ${i + 1}/${retries} fallito:`, error.message);
      if (i === retries - 1) throw error;
      
      // Aspetta un po' prima del retry
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
}
