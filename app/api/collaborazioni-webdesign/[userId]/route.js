import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";

export async function GET(req, { params }) {
  try {
    await connectToDB();

    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ message: "ID utente mancante" }), { status: 400 });
    }

    // Recupera le collaborazioni associate al web designer (userId)
    const collaborazioni = await CollaborazioneWebDesign.find({ webDesigner: userId })
      .populate("cliente", "etichetta") // Popola i dati del cliente
      .populate("webDesigner", "nome cognome"); // Popola i dati del web designer

    if (!collaborazioni || collaborazioni.length === 0) {
      return new Response(JSON.stringify({ message: "Nessuna collaborazione trovata per questo utente" }), { status: 404 });
    }

    // Restituisci le collaborazioni
    return new Response(JSON.stringify(collaborazioni), { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero delle collaborazioni:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}