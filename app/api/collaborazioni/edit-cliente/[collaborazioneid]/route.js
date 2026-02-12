import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import {Collaboratore} from "@/models/User";

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();
    console.log("Connesso al database");
  
    const { collaborazioneid } = resolvedParams;
    const { collaboratoreId } = await req.json();

    console.log("Collaborazione ID:", collaborazioneid);
    console.log("Collaboratore ID:", collaboratoreId);

    // Recupera i dettagli del collaboratore
    const collaboratore = await Collaboratore.findById(collaboratoreId);
    if (!collaboratore) {
      console.log("Collaboratore non trovato");
      return new Response(JSON.stringify({ message: "Collaboratore non trovato" }), { status: 404 });
    }

    console.log("Collaboratore trovato:", collaboratore);

    // Aggiorna la collaborazione
    const updatedCollaborazione = await Collaborazione.findByIdAndUpdate(
      collaborazioneid,
      {
        collaboratore: collaboratoreId,
        collaboratoreNome: collaboratore.nome,
        collaboratoreCognome: collaboratore.cognome,
      },
      { new: true }
    );

    if (!updatedCollaborazione) {
      console.log("Collaborazione non trovata");
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    console.log("Collaborazione aggiornata:", updatedCollaborazione);

    return new Response(JSON.stringify(updatedCollaborazione), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}