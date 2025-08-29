import { connectToDB } from "@/utils/database";
import { updateSnapshot, getCurrentMonth, getPreviousMonth } from "@/utils/snapshotManager";
import SnapshotCollaborazioni from "@/models/SnapshotCollaborazioni";

// Funzione per verificare e creare snapshot automaticamente
export const autoCreateMonthlySnapshot = async () => {
  try {
    await connectToDB();
    
    const currentMonth = getCurrentMonth();
    const previousMonth = getPreviousMonth();
    
    console.log("=== AUTO-CREAZIONE SNAPSHOT MENSILE ===");
    
    // 1. Verifica se esiste già lo snapshot del mese corrente
    const currentSnapshot = await SnapshotCollaborazioni.findOne({
      mese: currentMonth.mese,
      anno: currentMonth.anno
    });
    
    if (!currentSnapshot) {
      console.log(`Creando snapshot automatico per ${currentMonth.meseNome}`);
      await updateSnapshot();
      console.log(`✅ Snapshot per ${currentMonth.meseNome} creato automaticamente`);
    } else {
      console.log(`✓ Snapshot per ${currentMonth.meseNome} già esistente`);
    }
    
    // 2. Se siamo il primo del mese, crea anche lo snapshot del mese precedente se non esiste
    const today = new Date().getDate();
    if (today === 1) {
      const prevSnapshot = await SnapshotCollaborazioni.findOne({
        mese: previousMonth.mese,
        anno: previousMonth.anno
      });
      
      if (!prevSnapshot) {
        console.log(`Primo del mese: creando snapshot per ${previousMonth.meseNome}`);
        await createSnapshotForMonth(previousMonth.mese, previousMonth.anno);
        console.log(`✅ Snapshot per ${previousMonth.meseNome} creato automaticamente`);
      }
    }
    
    return {
      success: true,
      message: "Controllo snapshot automatico completato"
    };
    
  } catch (error) {
    console.error("Errore nella creazione automatica degli snapshot:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// API endpoint per trigger manuale del controllo
export async function POST(req) {
  try {
    const result = await autoCreateMonthlySnapshot();
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Errore API auto-snapshot:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return POST(req); // Stesso comportamento per GET e POST
}
