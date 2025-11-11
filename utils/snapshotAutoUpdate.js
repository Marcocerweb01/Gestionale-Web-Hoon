import { updateSnapshot } from "./snapshotManager";

// Funzione debounce per evitare troppi aggiornamenti
let updateTimeout = null;

export const triggerSnapshotUpdate = () => {
  // Cancella timeout precedente
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  // Aggiorna dopo 5 secondi di inattività
  updateTimeout = setTimeout(async () => {
    try {
      console.log("🔄 Trigger aggiornamento snapshot automatico...");
      await updateSnapshot();
    } catch (error) {
      console.error("❌ Errore aggiornamento automatico snapshot:", error);
    }
  }, 5000);
};
