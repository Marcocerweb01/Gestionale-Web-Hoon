import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    await connectToDB();

    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ message: "ID mancante" }), { status: 400 });
    }

    // Determina se l'ID è un userId o un collaborazioneId
    const isUserId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;

    if (isUserId) {
      // Recupera le collaborazioni associate al web designer (userId)
      const collaborazioni = await CollaborazioneWebDesign.find({ webDesigner: id })
        .populate("cliente", "etichetta")
        .populate("webDesigner", "nome cognome");

      if (!collaborazioni || collaborazioni.length === 0) {
        return new Response(JSON.stringify({ message: "Nessuna collaborazione trovata per questo utente" }), { status: 404 });
      }

      return new Response(JSON.stringify(collaborazioni), { status: 200 });
    } else {
      // Recupera una singola collaborazione (collaborazioneId)
      const collaborazione = await CollaborazioneWebDesign.findById(id)
        .populate("cliente", "etichetta")
        .populate("webDesigner", "nome cognome");

      if (!collaborazione) {
        return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
      }

      return new Response(JSON.stringify(collaborazione), { status: 200 });
    }
  } catch (error) {
    console.error("Errore durante il recupero:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectToDB();

    const { id } = params;
    const { faseIndex, completata } = await req.json();

    if (!id || faseIndex === undefined || completata === undefined) {
      return new Response(JSON.stringify({ message: "Dati mancanti" }), { status: 400 });
    }

    const collaborazione = await CollaborazioneWebDesign.findById(id);

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