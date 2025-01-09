import { Collaboratore } from "@/models/User"; // Assicurati che Collaboratore sia importato correttamente
import { connectToDB } from "@/utils/database";

export async function GET(req) {
  try {
    // Connessione al database
    await connectToDB();

    // Recupera tutti i collaboratori dal database
    const collaboratori = await Collaboratore.find();

    // Formatta i dati per il frontend
    const result = collaboratori.map((collaboratore) => ({
      id: collaboratore._id,
      nome: collaboratore.nome,
      cognome:collaboratore.cognome,
      email: collaboratore.email,
      subRole: collaboratore.subRole,
      partitaIva: collaboratore.partitaIva,
    }));

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero dei collaboratori:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
