import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";


export async function GET(req, { params }) {
  try {
    await connectToDB();

    // Ottieni il collaboratoreId dai parametri dell'URL
    const resolvedParams = await params;
    const { clienteId } = resolvedParams;

    if (!clienteId) {
      return new Response(JSON.stringify({ message: "ID azienda mancante" }), { status: 400 });
    }

    // Recupera le collaborazioni del collaboratore specifico
    const collaborazioni = await Collaborazione.find({ azienda: clienteId })
      .populate("collaboratore").populate("azienda");

    // Trasforma i dati per il frontend
    const result = collaborazioni.map((collaborazione) => ({
      id: collaborazione._id,
      cliente: collaborazione.azienda?.etichetta || "N/A",
      collaboratorenome: collaborazione.collaboratore?.nome || "N/A",
      collaboratorecognome: collaborazione.collaboratore?.cognome || "N/A",
      collaboratoreId: collaborazione.collaboratore?._id || null,
      clienteId: collaborazione.azienda?._id || null,
      appuntamenti: collaborazione.numero_appuntamenti,
      postIg_fb: collaborazione.post_ig_fb,
      postTiktok: collaborazione.post_tiktok,
      postLinkedin: collaborazione.post_linkedin,
      feed: collaborazione._id,
      pagato: collaborazione.pagato,
      post_ig_fb_fatti: collaborazione.post_ig_fb_fatti,
      post_tiktok_fatti: collaborazione.post_tiktok_fatti,
      post_linkedin_fatti: collaborazione.post_linkedin_fatti,
      post_totali_previsti: collaborazione.post_totali_previsti,
      appuntamenti_totali_previsti: collaborazione.appuntamenti_totali_previsti,
      durata_contratto: collaborazione.durata_contratto,
      data_inizio_contratto: collaborazione.data_inizio_contratto,
      data_fine_contratto: collaborazione.data_fine_contratto,
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

