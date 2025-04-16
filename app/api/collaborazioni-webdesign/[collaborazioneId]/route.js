import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    await connectToDB();

    const { collaborazioneId } = params;

    if (!collaborazioneId) {
      return new Response(JSON.stringify({ message: "ID collaborazione mancante" }), { status: 400 });
    }

    // Recupera la collaborazione dal database
    const collaborazione = await CollaborazioneWebDesign.findById(collaborazioneId)
      .populate("cliente", "etichetta") // Popola i dati del cliente
      .populate("webDesigner", "nome cognome"); // Popola i dati del web designer

    if (!collaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    // Restituisci i dati della collaborazione
    return new Response(JSON.stringify(collaborazione), { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectToDB();

    const { collaborazioneId } = params;
    const { faseIndex, completata } = await req.json();

    if (!collaborazioneId || faseIndex === undefined || completata === undefined) {
      return new Response(JSON.stringify({ message: "Dati mancanti" }), { status: 400 });
    }

    const collaborazione = await CollaborazioneWebDesign.findById(collaborazioneId);

    if (!collaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    // Aggiorna la fase specifica
    collaborazione.fasiProgetto[faseIndex].completata = completata;
    await collaborazione.save();

    return new Response(JSON.stringify({ message: "Fase aggiornata con successo" }), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della fase:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}