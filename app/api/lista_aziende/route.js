import { Azienda } from "@/models/User"; // Assicurati che Collaboratore sia importato correttamente
import { connectToDB } from "@/utils/database";

export async function GET(req) {
  try {
    // Connessione al database
    await connectToDB();

    // Recupera tutti i collaboratori dal database
    const aziende = await Azienda.find();

    // Formatta i dati per il frontend
    const result = aziende.map((azienda) => ({
      id: azienda._id,
      nome: azienda.nome,
      etichetta: azienda.etichetta,
      email: azienda.email,
      partitaIva: azienda.partitaIva,
    }));

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero delle aziende:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
