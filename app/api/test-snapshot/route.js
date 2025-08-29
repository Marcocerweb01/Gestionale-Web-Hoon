import { connectToDB } from "@/utils/database";
import { updateSnapshot, getSnapshot, markSnapshotAsExported } from "@/utils/snapshotManager";

export async function GET(req) {
  try {
    await connectToDB();
    
    console.log("=== TEST SISTEMA SNAPSHOT ===");
    
    // 1. Aggiorna lo snapshot
    console.log("1. Aggiornamento snapshot...");
    await updateSnapshot();
    
    // 2. Recupera lo snapshot
    console.log("2. Recupero snapshot...");
    const snapshot = await getSnapshot();
    
    if (!snapshot) {
      return new Response(
        JSON.stringify({ error: "Nessuno snapshot trovato" }),
        { status: 404 }
      );
    }
    
    const testResults = {
      timestamp: new Date().toISOString(),
      snapshot: {
        mese: snapshot.mese,
        anno: snapshot.anno,
        totale_collaborazioni: snapshot.collaborazioni_snapshot.length,
        stato: snapshot.stato,
        data_creazione: snapshot.data_creazione,
        data_aggiornamento: snapshot.data_aggiornamento
      },
      sample_data: snapshot.collaborazioni_snapshot.slice(0, 2).map(collab => ({
        azienda: collab.cliente,
        collaboratore: collab.collaboratore,
        appuntamenti_fatti: collab.appuntamenti_fatti,
        posts: {
          ig_fb: collab.post_ig_fb,
          tiktok: collab.post_tiktok,
          linkedin: collab.post_linkedin
        }
      })),
      test_status: "SUCCESS"
    };
    
    console.log("3. Test completato con successo");
    console.log("Risultati:", JSON.stringify(testResults, null, 2));
    
    return new Response(
      JSON.stringify(testResults),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Errore durante il test dello snapshot:", error);
    return new Response(
      JSON.stringify({ 
        error: "Errore durante il test", 
        details: error.message,
        test_status: "FAILED"
      }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    
    const { action } = await req.json();
    
    if (action === "mark_exported") {
      console.log("Test: Marcando snapshot come esportato...");
      await markSnapshotAsExported();
      
      return new Response(
        JSON.stringify({ message: "Snapshot marcato come esportato" }),
        { status: 200 }
      );
    }
    
    if (action === "force_update") {
      console.log("Test: Forzando aggiornamento snapshot...");
      await updateSnapshot();
      
      return new Response(
        JSON.stringify({ message: "Snapshot forzato e aggiornato" }),
        { status: 200 }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Azione non riconosciuta" }),
      { status: 400 }
    );
    
  } catch (error) {
    console.error("Errore durante il test POST:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
