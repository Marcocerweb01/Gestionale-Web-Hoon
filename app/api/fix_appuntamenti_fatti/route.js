import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import Nota from "@/models/Note";

export async function POST(req) {
  try {
    await connectToDB();
    console.log("🔧 === INIZIO RICALCOLO APPUNTAMENTI_FATTI ===");

    // Date specifiche: 1 novembre 2025 - 11 novembre 2025
    const startDate = new Date(2025, 10, 1); // Mese 10 = novembre (0-indexed)
    const endDate = new Date(2025, 10, 11, 23, 59, 59, 999); // Fine giornata dell'11 novembre
    
    console.log(`📅 Periodo conteggio: dal ${startDate.toLocaleDateString('it-IT')} al ${endDate.toLocaleDateString('it-IT')}`);

    // Usa aggregazione per contare tutti gli appuntamenti in una query
    const appuntamentiCount = await Nota.aggregate([
      {
        $match: {
          tipo: "appuntamento",
          data_appuntamento: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: "$collaborazione",
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`📊 Trovati appuntamenti per ${appuntamentiCount.length} collaborazioni`);

    // Crea una mappa collaborazioneId -> count
    const countMap = new Map();
    appuntamentiCount.forEach(item => {
      if (item._id) {
        countMap.set(item._id.toString(), item.count);
        console.log(`📌 Collaborazione ${item._id}: ${item.count} appuntamenti`);
      }
    });

    // Aggiorna tutte le collaborazioni: metti il count se presente, altrimenti 0
    const tutteCollaborazioni = await Collaborazione.find({}).select('_id aziendaRagioneSociale').lean();
    console.log(`📊 Trovate ${tutteCollaborazioni.length} collaborazioni totali`);

    let aggiornate = 0;
    for (const collab of tutteCollaborazioni) {
      const count = countMap.get(collab._id.toString()) || 0;
      await Collaborazione.findByIdAndUpdate(
        collab._id,
        { $set: { appuntamenti_fatti: count } }
      );
      if (count > 0) {
        console.log(`✅ ${collab.aziendaRagioneSociale}: ${count} appuntamenti`);
      }
      aggiornate++;
    }

    console.log(`✅ Operazione completata: ${aggiornate} collaborazioni aggiornate`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Appuntamenti_fatti ricalcolati con successo",
        collaborazioni_processate: tutteCollaborazioni.length,
        collaborazioni_aggiornate: aggiornate,
        collaborazioni_con_appuntamenti: countMap.size,
        periodo: "1 novembre 2025 - 11 novembre 2025"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Errore nell'ricalcolo:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET per eseguire lo script manualmente
export async function GET(req) {
  return POST(req);
}
