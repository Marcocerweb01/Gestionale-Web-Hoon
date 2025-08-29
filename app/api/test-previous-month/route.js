import { connectToDB } from "@/utils/database";
import { createSnapshotForMonth, getPreviousMonth } from "@/utils/snapshotManager";

export async function GET(req) {
  try {
    await connectToDB();
    
    const previousMonth = getPreviousMonth();
    console.log(`Test: Creando snapshot per ${previousMonth.meseNome}`);
    
    // Crea lo snapshot per il mese precedente
    const snapshot = await createSnapshotForMonth(previousMonth.mese, previousMonth.anno);
    
    if (!snapshot) {
      return new Response(
        JSON.stringify({ error: "Impossibile creare snapshot per il mese precedente" }),
        { status: 404 }
      );
    }
    
    const testResults = {
      timestamp: new Date().toISOString(),
      month_created: previousMonth.meseNome,
      total_collaborations: snapshot.collaborazioni_snapshot.length,
      status: snapshot.stato,
      message: "Snapshot per mese precedente creato con successo"
    };
    
    console.log("Snapshot mese precedente creato:", testResults);
    
    return new Response(
      JSON.stringify(testResults),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Errore durante il test del mese precedente:", error);
    return new Response(
      JSON.stringify({ 
        error: "Errore durante il test", 
        details: error.message
      }),
      { status: 500 }
    );
  }
}
