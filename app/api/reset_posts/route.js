import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";

export async function POST(req) {
  try {
    await connectToDB();

    // Aggiorna tutte le collaborazioni: azzera i campi specificati
    await Collaborazione.updateMany({}, {
      $set: {
        post_linkedin_fatti: 0,
        post_tiktok_fatti: 0,
        post_ig_fb_fatti: 0,
      }
    });

    return new Response(JSON.stringify({ message: "Reset eseguito" }), { status: 200 });
  } catch (error) {
    console.error("Errore nel reset:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}
