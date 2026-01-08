import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";

export async function PATCH(req) {
  try {
    await connectToDB();

    // 1. Recupera tutte le collaborazioni per calcolare i valori da accumulare
    const collaborazioni = await Collaborazione.find({});
    
    // 2. Per ogni collaborazione, aggiorna i contatori trimestrali
    const bulkOps = collaborazioni.map(collab => {
      // Prendi i post totali previsti questo mese (TUTTI i tipi di post)
      const postTotaliMese = (collab.post_ig_fb || 0) + (collab.post_tiktok || 0) + (collab.post_linkedin || 0);
      // Prendi gli appuntamenti previsti questo mese
      const appuntamentiMese = collab.numero_appuntamenti || 0;
      
      return {
        updateOne: {
          filter: { _id: collab._id },
          update: {
            // Somma ai totali trimestrali (i fatti NON si toccano)
            $inc: {
              valutazione_trimestrale_totali: postTotaliMese,
              appuntamenti_trimestrale_totali: appuntamentiMese,
            },
            // Azzera i contatori mensili
            $set: {
              post_linkedin_fatti: 0,
              post_tiktok_fatti: 0,
              post_ig_fb_fatti: 0,
              appuntamenti_fatti: 0,
            }
          }
        }
      };
    });

    // 3. Esegui tutte le operazioni in bulk
    const result = await Collaborazione.bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({
        message: "Reset eseguito - Totali trimestrali aggiornati",
        modifiedCount: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nel reset:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
