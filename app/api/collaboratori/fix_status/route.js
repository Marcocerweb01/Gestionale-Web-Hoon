import { Collaboratore } from "@/models/User";
import { connectToDB } from "@/utils/database";

export async function POST(req) {
  try {
    await connectToDB();

    // Aggiorna TUTTI i collaboratori che non hanno status o hanno status "non_attivo"
    // Impostandoli come "attivo"
    const result = await Collaboratore.updateMany(
      {
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: "non_attivo" }
        ]
      },
      {
        $set: { status: "attivo" }
      }
    );

    console.log(`✅ Aggiornati ${result.modifiedCount} collaboratori a status "attivo"`);

    // Conta quanti collaboratori attivi ci sono ora
    const collaboratoriAttivi = await Collaboratore.countDocuments({ status: "attivo" });

    return new Response(
      JSON.stringify({
        message: "Status collaboratori aggiornato",
        collaboratori_modificati: result.modifiedCount,
        collaboratori_attivi_totali: collaboratoriAttivi
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore durante l'aggiornamento dello status:", error);
    return new Response(
      JSON.stringify({ 
        message: "Errore interno al server",
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
