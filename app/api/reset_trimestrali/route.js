import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";

export async function PATCH(req) {
  try {
    await connectToDB();

    // Azzera tutti i campi trimestrali (escluse le collaborazioni con flag escludi_reset_trimestrale)
    const result = await Collaborazione.updateMany(
      { escludi_reset_trimestrale: { $ne: true } },
      {
        $set: {
          valutazione_trimestrale_fatti: 0,
          valutazione_trimestrale_totali: 0,
          appuntamenti_trimestrale_fatti: 0,
          appuntamenti_trimestrale_totali: 0,
          // Nuovi campi trimestrali per tipo
          instagram_trim_fatti: 0,
          instagram_trim_totali: 0,
          tiktok_trim_fatti: 0,
          tiktok_trim_totali: 0,
          linkedin_trim_fatti: 0,
          linkedin_trim_totali: 0,
        },
      }
    );

    return new Response(
      JSON.stringify({
        message: "Reset trimestrali eseguito",
        modifiedCount: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nel reset trimestrali:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
