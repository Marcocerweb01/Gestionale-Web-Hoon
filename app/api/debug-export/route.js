import { connectToDB } from "@/utils/database";
import { getCurrentMonth, updateSnapshot, createSnapshotForMonth, getSnapshot } from "@/utils/snapshotManager";
import SnapshotCollaborazioni from "@/models/SnapshotCollaborazioni";
import Collaborazione from "@/models/Collaborazioni";

export async function GET(req) {
  try {
    await connectToDB();
    
    const currentMonth = getCurrentMonth();
    
    console.log("=== DEBUG EXPORT ===");
    console.log(`Mese corrente: ${currentMonth.meseNome} (${currentMonth.mese}/${currentMonth.anno})`);
    
    // 1. Conta le collaborazioni nel database
    const totalCollabs = await Collaborazione.countDocuments();
    console.log(`Collaborazioni totali nel DB: ${totalCollabs}`);
    
    // 2. Controlla se esiste già uno snapshot
    const existingSnapshot = await SnapshotCollaborazioni.findOne({
      mese: currentMonth.mese,
      anno: currentMonth.anno
    });
    
    console.log(`Snapshot esistente: ${existingSnapshot ? 'Sì' : 'No'}`);
    if (existingSnapshot) {
      console.log(`- Collaborazioni nello snapshot: ${existingSnapshot.collaborazioni_snapshot.length}`);
      console.log(`- Stato: ${existingSnapshot.stato}`);
    }
    
    // 3. Prova a creare/aggiornare lo snapshot
    console.log("Tentativo creazione/aggiornamento snapshot...");
    try {
      const snapshot = await updateSnapshot();
      console.log(`Snapshot creato/aggiornato: ${snapshot.collaborazioni_snapshot.length} collaborazioni`);
      
      return new Response(
        JSON.stringify({
          success: true,
          debug: {
            currentMonth: currentMonth.meseNome,
            totalCollaborations: totalCollabs,
            existingSnapshot: existingSnapshot ? true : false,
            snapshotCollaborations: snapshot.collaborazioni_snapshot.length,
            snapshotState: snapshot.stato,
            sampleData: snapshot.collaborazioni_snapshot.slice(0, 2).map(c => ({
              collaboratore: c.collaboratore,
              cliente: c.cliente,
              appuntamenti: `${c.appuntamenti_fatti}/${c.appuntamenti_totali}`,
              posts_ig: c.post_ig_fb
            }))
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
      
    } catch (snapshotError) {
      console.error("Errore nella creazione dello snapshot:", snapshotError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: snapshotError.message,
          debug: {
            currentMonth: currentMonth.meseNome,
            totalCollaborations: totalCollabs,
            existingSnapshot: existingSnapshot ? true : false
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error("Errore debug export:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
