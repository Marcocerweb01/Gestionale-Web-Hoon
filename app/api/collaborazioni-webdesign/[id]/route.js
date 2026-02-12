import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { id } = resolvedParams;

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
    const resolvedParams = await params;
    await connectToDB();

    const { id } = resolvedParams; // ID della collaborazione
    const body = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ message: "ID collaborazione mancante" }), { status: 400 });
    }

    const collaborazione = await CollaborazioneWebDesign.findById(id);

    if (!collaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    // Aggiorna i campi generici (note, problemi, ecc.)
    if (body.note !== undefined) {
      collaborazione.note = body.note;
    }

    if (body.problemi !== undefined) {
      collaborazione.problemi = body.problemi;
    }

    // Aggiorna i task
    if (body.tasks) {
      collaborazione.tasks = body.tasks;
    }

    // Salva le modifiche
    await collaborazione.save();

    return new Response(JSON.stringify({ message: "Collaborazione aggiornata con successo" }), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}