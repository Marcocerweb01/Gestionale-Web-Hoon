import { firstDayOfMonthOperation } from "../first-day-operation/route.js";

// API per il cron job automatico del primo del mese
export async function POST(req) {
  try {
    // Controlla se è davvero il primo del mese
    const today = new Date();
    const dayOfMonth = today.getDate();
    const hour = today.getHours();
    
    console.log(`🤖 Cron Job eseguito: ${today.toISOString()}`);
    console.log(`📅 Giorno del mese: ${dayOfMonth}, Ora: ${hour}`);
    
    // Esegui solo se è il primo del mese
    if (dayOfMonth === 1) {
      console.log("✅ È il primo del mese, eseguendo operazione automatica...");
      
      const result = await firstDayOfMonthOperation();
      
      if (result.success) {
        console.log("🎉 Operazione automatica completata con successo");
        return new Response(
          JSON.stringify({
            success: true,
            message: "Cron job eseguito con successo",
            operation_result: result
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        console.log("⚠️ Operazione automatica completata con avvisi");
        return new Response(
          JSON.stringify({
            success: true,
            message: "Cron job eseguito (con avvisi)",
            operation_result: result
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log(`ℹ️ Non è il primo del mese (giorno ${dayOfMonth}), saltando operazione`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Cron job verificato - Non è il primo del mese (giorno ${dayOfMonth})`,
          skipped: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error("❌ Errore nel cron job:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500 }
    );
  }
}

// Permetti anche GET per test
export async function GET(req) {
  return new Response(
    JSON.stringify({
      message: "Cron Job API attiva",
      info: "Usa POST per eseguire il cron job",
      test_url: "/api/cron-monthly?test=true",
      timestamp: new Date().toISOString()
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
