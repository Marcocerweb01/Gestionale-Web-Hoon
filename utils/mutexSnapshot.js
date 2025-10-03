// Sistema di lock per evitare aggiornamenti simultanei
import { updateSnapshot } from './snapshotManager.js'; // ✨ Fix: import corretto

class SnapshotMutex {
  constructor() {
    this.locked = false;
    this.queue = [];
  }
  
  async acquire() {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  
  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

const snapshotMutex = new SnapshotMutex();

export async function lockedUpdateSnapshot() {
  await snapshotMutex.acquire();
  
  try {
    console.log("🔒 Lock acquisito, aggiornando snapshot...");
    await updateSnapshot(); // ✨ Fix: funzione corretta
    console.log("✅ Snapshot aggiornato con successo");
  } catch (error) {
    console.error("❌ Errore aggiornamento snapshot:", error);
    throw error;
  } finally {
    snapshotMutex.release();
    console.log("🔓 Lock rilasciato");
  }
}
