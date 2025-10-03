import { connectToDB } from "@/utils/database";
import { getCurrentMonth, getSnapshot, updateSnapshot } from "@/utils/snapshotManager";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    console.log("🧪 === TEST EXPORT ENDPOINT ===");
    
    // Test connessione database
    console.log("🔌 Test connessione database...");
    await connectToDB();
    console.log("✅ Database connesso");

    // Test getCurrentMonth
    console.log("📅 Test getCurrentMonth...");
    const currentMonth = getCurrentMonth();
    console.log("✅ Mese corrente:", currentMonth);

    // Test getSnapshot
    console.log("🔍 Test getSnapshot...");
    let snapshot = await getSnapshot(currentMonth.mese, currentMonth.anno);
    
    if (!snapshot) {
      console.log("📁 Snapshot non trovato, tentativo creazione...");
      
      try {
        snapshot = await updateSnapshot();
        console.log("✅ Snapshot creato con updateSnapshot");
      } catch (updateError) {
        console.error("❌ Errore updateSnapshot:", updateError);
        throw updateError;
      }
    } else {
      console.log("✅ Snapshot esistente trovato");
    }

    // Verifica contenuto snapshot
    const collabCount = snapshot?.collaborazioni_snapshot?.length || 0;
    console.log(`📊 Collaborazioni nello snapshot: ${collabCount}`);

    // Test risultato finale
    const testResult = {
      success: true,
      currentMonth: currentMonth,
      snapshotExists: !!snapshot,
      snapshotId: snapshot?._id,
      collaborazioniCount: collabCount,
      message: "Test completato con successo"
    };

    console.log("🎉 === TEST COMPLETATO ===");
    console.log("Risultato:", testResult);

    return NextResponse.json(testResult, { status: 200 });

  } catch (error) {
    console.error("💥 === ERRORE TEST ===");
    console.error("Errore:", error);
    console.error("Stack:", error.stack);
    
    const errorResult = {
      success: false,
      error: error.message,
      stack: error.stack,
      message: "Test fallito"
    };

    return NextResponse.json(errorResult, { status: 500 });
  }
}