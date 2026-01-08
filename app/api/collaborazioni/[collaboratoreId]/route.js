import Collaborazione from "@/models/Collaborazioni";
import { Azienda } from "@/models/User";
import { connectToDB } from "@/utils/database";


export async function GET(req, { params }) {
  try {
    await connectToDB();

    // Ottieni il collaboratoreId dai parametri dell'URL
    const { collaboratoreId } = params;

    if (!collaboratoreId) {
      return new Response(JSON.stringify({ message: "ID collaboratore mancante" }), { status: 400 });
    }

    // Recupera le collaborazioni del collaboratore specifico
    const collaborazioni = await Collaborazione.find({ collaboratore: collaboratoreId })
      .populate("azienda");

    // Trasforma i dati per il frontend
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
      // Nuovi campi per gestione contratto
      post_totali: collaborazione.post_totali || 0,
      appuntamenti_totali: collaborazione.appuntamenti_totali || 0,
      durata_contratto: collaborazione.durata_contratto || null,
      data_inizio_contratto: collaborazione.data_inizio_contratto || null,
      data_fine_contratto: collaborazione.data_fine_contratto || null,
      // Campi per valutazione trimestrale
      valutazione_trimestrale_fatti: collaborazione.valutazione_trimestrale_fatti || 0,
      valutazione_trimestrale_totali: collaborazione.valutazione_trimestrale_totali || 0,
      // Campi per appuntamenti trimestrali
      appuntamenti_trimestrale_fatti: collaborazione.appuntamenti_trimestrale_fatti || 0,
      appuntamenti_trimestrale_totali: collaborazione.appuntamenti_trimestrale_totali || 0,
    }));

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero delle collaborazioni:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}

