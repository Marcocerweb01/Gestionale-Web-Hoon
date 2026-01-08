import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";

export async function POST(req) {
  try {
    await connectToDB();

    // Recupera tutte le collaborazioni
    const collaborazioni = await Collaborazione.find({});
    console.log(`📊 Trovate ${collaborazioni.length} collaborazioni`);

    // Siamo al primo mese del trimestre (Gennaio)
    // I totali devono essere = valori mensili attuali
    // Poi ogni mese il reset farà $inc per accumulare

    // Aggiorna ogni collaborazione
    const bulkOps = collaborazioni.map(collab => {
      // Appuntamenti totali trimestrali = appuntamenti mensili (primo mese)
      const appuntamentiMensili = collab.numero_appuntamenti || 0;
      
      // Post totali trimestrali = post mensili (primo mese)
      const postMensili = (collab.post_ig_fb || 0) + (collab.post_tiktok || 0) + (collab.post_linkedin || 0);

      return {
        updateOne: {
          filter: { _id: collab._id },
          update: {
            $set: {
              appuntamenti_trimestrale_totali: appuntamentiMensili,
              valutazione_trimestrale_totali: postMensili,
            }
          }
        }
      };
    });

    // Esegui tutte le operazioni in bulk
    const result = await Collaborazione.bulkWrite(bulkOps);

    // Log dei primi 5 per verifica
    const verify = await Collaborazione.find({}).limit(5).select('aziendaRagioneSociale numero_appuntamenti appuntamenti_trimestrale_fatti appuntamenti_trimestrale_totali');
    console.log('\n📋 Verifica (primi 5):');
    verify.forEach(v => {
      console.log(`  ${v.aziendaRagioneSociale}: ${v.appuntamenti_trimestrale_fatti}/${v.appuntamenti_trimestrale_totali}`);
    });

    return new Response(
      JSON.stringify({
        message: `Allineamento completato - Totali settati ai valori mensili (primo mese trimestre)`,
        collaborazioniTrovate: collaborazioni.length,
        modifiedCount: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nell'allineamento:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server", error: error.message }),
      { status: 500 }
    );
  }
}
