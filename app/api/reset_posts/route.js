import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";

export async function PATCH(req) {
  try {
    await connectToDB();

    // Esegue l'update su tutte le collaborazioni: azzera i campi specificati
    const result = await Collaborazione.updateMany({}, {
      $set: {
        post_linkedin_fatti: 0,
        post_tiktok_fatti: 0,
        post_ig_fb_fatti: 0,
      },
    });

    return new Response(
      JSON.stringify({
        message: "Reset eseguito",
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
