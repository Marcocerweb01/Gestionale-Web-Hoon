import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";

export async function POST(req) {
  try {
    await connectToDB();

    // Recupera tutte le collaborazioni
    const collaborazioni = await Collaborazione.find({});
    console.log(`📊 Trovate ${collaborazioni.length} collaborazioni`);

    // Aggiorna ogni collaborazione con i valori iniziali
    const bulkOps = collaborazioni.map(collab => {
      // Calcola i valori basandosi su TUTTI i tipi di post
      const postFatti = (collab.post_ig_fb_fatti || 0) + (collab.post_tiktok_fatti || 0) + (collab.post_linkedin_fatti || 0);
      const postTotali = (collab.post_ig_fb || 0) + (collab.post_tiktok || 0) + (collab.post_linkedin || 0);
      
      // Calcola appuntamenti - fatti restano quelli attuali, totali sono quelli mensili previsti
      const appuntamentiFatti = collab.appuntamenti_fatti || 0;
      const appuntamentiTotali = collab.numero_appuntamenti || 0;

      return {
        updateOne: {
          filter: { _id: collab._id },
          update: {
            $set: {
              valutazione_trimestrale_fatti: postFatti,
              valutazione_trimestrale_totali: postTotali,
              appuntamenti_trimestrale_fatti: appuntamentiFatti,
              appuntamenti_trimestrale_totali: appuntamentiTotali,
            }
          }
        }
      };
    });

    // Esegui tutte le operazioni in bulk
    const result = await Collaborazione.bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({
        message: "Inizializzazione valutazione trimestrale completata (post + appuntamenti)",
        collaborazioniTrovate: collaborazioni.length,
        modifiedCount: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nell'inizializzazione:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server", error: error.message }),
      { status: 500 }
    );
  }
}
