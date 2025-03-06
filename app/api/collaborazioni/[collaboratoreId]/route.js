import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";

export async function GET(req, { params }) {
  try {
    await connectToDB();
    console.log("Connessione al database stabilita");

    const { collaboratoreId } = params;

    if (!collaboratoreId) {
      return new Response(JSON.stringify({ message: "ID collaboratore mancante" }), { status: 400 });
    }

    console.log(`Recupero collaborazioni per collaboratoreId: ${collaboratoreId}`);
    const collaborazioni = await Collaborazione.find({ collaboratore: collaboratoreId })
      .populate("azienda");

    const result = collaborazioni.map((collaborazione) => ({
      id: collaborazione._id,
      cliente: collaborazione.azienda.etichetta,
      clienteId: collaborazione.azienda._id,
      appuntamenti: collaborazione.numero_appuntamenti,
      postIg_fb: collaborazione.post_ig_fb,
      postTiktok: collaborazione.post_tiktok,
      postLinkedin: collaborazione.post_linkedin,
      feed: collaborazione._id,
      pagato: collaborazione.pagato,
      post_ig_fb_fatti: collaborazione.post_ig_fb_fatti,
      post_tiktok_fatti: collaborazione.post_tiktok_fatti,
      post_linkedin_fatti: collaborazione.post_linkedin_fatti,
    }));

    console.log("Collaborazioni recuperate con successo");
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero delle collaborazioni:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}

