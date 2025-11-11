import { connectToDB } from "@/utils/database";
import { closeMonthSnapshot, getCurrentMonth, getPreviousMonth } from "@/utils/snapshotManager";
import Collaborazione from "@/models/Collaborazioni";

// Operazione da eseguire il primo giorno del mese
export async function POST(req) {
  try {
    await connectToDB();
    console.log("🗓️ === OPERAZIONE PRIMO GIORNO DEL MESE ===");

    // 1. Chiudi snapshot del mese precedente
    const prevMonth = getPreviousMonth();
    console.log(`🔒 Chiusura snapshot ${prevMonth.meseNome}...`);
    
    const closedSnapshot = await closeMonthSnapshot(prevMonth.mese, prevMonth.anno);
    
    if (closedSnapshot) {
      console.log(`✅ Snapshot ${prevMonth.meseNome} chiuso con successo`);
    }

    // 2. Azzera contatori post di tutte le collaborazioni
    console.log("🔄 Azzeramento contatori post e appuntamenti...");
    
    const result = await Collaborazione.updateMany(
      {},
      {
        $set: {
          post_ig_fb_fatti: 0,
          post_tiktok_fatti: 0,
          post_linkedin_fatti: 0,
          appuntamenti_fatti: 0
        }
      }
    );

    console.log(`✅ Azzerati contatori di ${result.modifiedCount} collaborazioni`);

    // 3. Il nuovo snapshot verrà creato automaticamente al primo aggiornamento
    const currentMonth = getCurrentMonth();
    console.log(`📸 Nuovo snapshot ${currentMonth.meseNome} verrà creato automaticamente`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Operazione primo giorno completata",
        closed_snapshot: prevMonth.meseNome,
        reset_count: result.modifiedCount,
        new_month: currentMonth.meseNome
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Errore operazione primo giorno:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}

// GET per test manuale
export async function GET(req) {
  return POST(req);
}
