import Collaborazione from "@/models/Collaborazioni";
import { Azienda, Collaboratore } from "@/models/User";
import { connectToDB } from "@/utils/database";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectToDB();

    const { aziendaId, collaboratoreId, numero_appuntamenti, post_ig_fb, post_tiktok, post_linkedin, note } = await req.json();

    // Verifica e conversione degli ID
    if (!mongoose.Types.ObjectId.isValid(aziendaId) || !mongoose.Types.ObjectId.isValid(collaboratoreId)) {
      return new Response(JSON.stringify({ message: "ID non validi" }), { status: 400 });
    }

    // Ottieni i dati dell'azienda
    const azienda = await Azienda.findById(aziendaId);
    console.log("Dati azienda:", azienda);

    if (!azienda) {
      return new Response(JSON.stringify({ message: "Azienda non trovata" }), { status: 404 });
    }

    // Ottieni i dati del collaboratore
    const collaboratore = await Collaboratore.findById(collaboratoreId);
    console.log("Dati collaboratore:", collaboratore);

    if (!collaboratore) {
      return new Response(JSON.stringify({ message: "Collaboratore non trovato" }), { status: 404 });
    }

    // Crea collaborazione con dati duplicati
    const nuovaCollaborazione = await Collaborazione.create({
        azienda: aziendaId,
        collaboratore: collaboratoreId,
        aziendaRagioneSociale: azienda.ragioneSociale,
        collaboratoreNome: collaboratore.nome,
        collaboratoreCognome: collaboratore.cognome,
        numero_appuntamenti,
        post_ig_fb,
        post_tiktok,
        post_linkedin,
        note,
        post_ig_fb_fatti:0,
        post_tiktok_fatti:0,
        post_linkedin_fatti:0,

      });
      

    console.log("Collaborazione creata:", nuovaCollaborazione);

    return new Response(JSON.stringify({ message: "Collaborazione creata con successo", collaborazione: nuovaCollaborazione }), {
      status: 201,
    });
  } catch (error) {
    console.error("Errore durante la creazione della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}
