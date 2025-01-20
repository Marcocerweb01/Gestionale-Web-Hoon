import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
import mongoose from "mongoose";

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
      appuntamenti: collaborazione.numero_appuntamenti, // Esempio statico
      postIg_fb: collaborazione.post_ig_fb,
      postTiktok: collaborazione.post_tiktok,
      postLinkedin: collaborazione.post_linkedin, // Esempio statico
      feed: collaborazione._id, // Esempio statico
      pagato: "Sì", // Esempio statico
      post_ig_fb_fatti:collaborazione.post_ig_fb_fatti,
      post_tiktok_fatti:collaborazione.post_tiktok_fatti,
      post_linkedin_fatti:collaborazione.post_linkedin_fatti,
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

