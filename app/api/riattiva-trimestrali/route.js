import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";

export async function POST(req) {
  try {
    await connectToDB();

    const collaborazioni = await Collaborazione.find({
      escludi_reset_trimestrale: { $ne: true },
    });

    const bulkOps = collaborazioni.map((collab) => {
      const postIg = collab.post_ig_fb || 0;
      const postTiktok = collab.post_tiktok || 0;
      const postLinkedin = collab.post_linkedin || 0;
      const appuntamenti = collab.numero_appuntamenti || 0;
      const postTotali = postIg + postTiktok + postLinkedin;

      return {
        updateOne: {
          filter: { _id: collab._id },
          update: {
            $set: {
              // Azzera contatori mensili fatti
              post_ig_fb_fatti: 0,
              post_tiktok_fatti: 0,
              post_linkedin_fatti: 0,
              appuntamenti_fatti: 0,
              // Azzera contatori trimestrali fatti
              valutazione_trimestrale_fatti: 0,
              appuntamenti_trimestrale_fatti: 0,
              instagram_trim_fatti: 0,
              tiktok_trim_fatti: 0,
              linkedin_trim_fatti: 0,
              // Setta i totali trimestrali = valori mensili pianificati (primo mese)
              valutazione_trimestrale_totali: postTotali,
              appuntamenti_trimestrale_totali: appuntamenti,
              instagram_trim_totali: postIg,
              tiktok_trim_totali: postTiktok,
              linkedin_trim_totali: postLinkedin,
            },
          },
        },
      };
    });

    const result = await Collaborazione.bulkWrite(bulkOps);

    return new Response(
      JSON.stringify({
        message: "Riattivazione trimestrali completata",
        collaborazioniTrovate: collaborazioni.length,
        modifiedCount: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nella riattivazione trimestrali:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server", error: error.message }),
      { status: 500 }
    );
  }
}
