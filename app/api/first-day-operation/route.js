import { connectToDB } from "@/utils/database";
import { createSnapshotForMonth, getPreviousMonth } from "@/utils/snapshotManager";
import SnapshotCollaborazioni from "@/models/SnapshotCollaborazioni";
import Collaborazione from "@/models/Collaborazioni";

// Funzione per l'operazione del primo del mese
export const firstDayOfMonthOperation = async () => {
  try {
    await connectToDB();
    
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    // ⚠️ PROTEZIONE: Avvisa se non è il primo del mese
    if (dayOfMonth > 5) {
      console.log(`⚠️ ATTENZIONE: Oggi è il ${dayOfMonth}, non è il primo del mese!`);
      // Non blocchiamo, ma avvisiamo che è insolito
    }
    
    const previousMonth = getPreviousMonth();
    console.log(`🗓️ Operazione primo del mese - Processando ${previousMonth.meseNome}`);
    
    // Verifica se esiste già lo snapshot del mese precedente
    const existingSnapshot = await SnapshotCollaborazioni.findOne({
      mese: previousMonth.mese,
      anno: previousMonth.anno
    });
    
    if (existingSnapshot && existingSnapshot.stato === 'completato') {
      return {
        success: false,
        warning: true,
        message: `⚠️ Lo snapshot per ${previousMonth.meseNome} è già stato completato il ${existingSnapshot.data_completamento?.toLocaleDateString('it-IT')}. Non è necessario rifarlo.`,
        existing_snapshot: {
          mese: existingSnapshot.meseNome,
          collaborazioni: existingSnapshot.collaborazioni_snapshot.length,
          stato: existingSnapshot.stato
        }
      };
    }
    
    // 1. CREA LO SNAPSHOT DEL MESE APPENA CONCLUSO
    console.log(`📸 Creando snapshot per ${previousMonth.meseNome}...`);
    const snapshot = await createSnapshotForMonth(previousMonth.mese, previousMonth.anno);
    
    if (!snapshot) {
      throw new Error(`Impossibile creare snapshot per ${previousMonth.meseNome}`);
    }
    
    console.log(`✅ Snapshot creato: ${snapshot.collaborazioni_snapshot.length} collaborazioni salvate`);
    
    // 2. AZZERA I DATI "FATTI" PER IL NUOVO MESE
    console.log(`🔄 Azzerando i dati "fatti" per iniziare il nuovo mese...`);
    
    const resetResult = await Collaborazione.updateMany(
      {}, // Tutte le collaborazioni
      {
        $set: {
          post_ig_fb_fatti: 0,
          post_tiktok_fatti: 0,
          post_linkedin_fatti: 0
        }
      }
    );
    
    console.log(`✅ Azzerati i dati di ${resetResult.modifiedCount} collaborazioni`);
    
    // 3. MARCA IL MESE PRECEDENTE COME "COMPLETATO"
    snapshot.stato = 'completato';
    snapshot.data_completamento = new Date();
    await snapshot.save();
    
    return {
      success: true,
      message: `Operazione primo del mese completata per ${previousMonth.meseNome}`,
      snapshot: {
        mese: snapshot.meseNome,
        collaborazioni: snapshot.collaborazioni_snapshot.length,
        stato: snapshot.stato
      },
      collaborazioni_azzerate: resetResult.modifiedCount
    };
    
  } catch (error) {
    console.error("❌ Errore nell'operazione primo del mese:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// API endpoint
export async function POST(req) {
  try {
    const result = await firstDayOfMonthOperation();
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Errore API primo del mese:", error);
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
  // Permetti sia GET che POST per testare
  return POST(req);
}
