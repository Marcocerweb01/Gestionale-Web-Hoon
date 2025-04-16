import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";

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