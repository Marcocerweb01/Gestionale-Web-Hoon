import { connectToDB } from "@/utils/database"; // Connessione al database
import { Azienda } from "@/models/User.js"; // Modello Azienda (assicurati che il percorso sia corretto)

export async function POST(req) {
  try {
    // Connessione al database
    await connectToDB();

    // Aggiorna tutte le aziende aggiungendo il campo "etichetta" se non esiste
    const result = await Azienda.updateMany(
      {}, // Nessun filtro, aggiorna tutti i documenti
      { $set: { etichetta: "Default" } }, // Imposta il valore predefinito
      { upsert: false } // Non creare nuovi documenti
    );

    // Risposta con il numero di documenti aggiornati
    return new Response(
      JSON.stringify({
        message: `Aggiornati ${result.modifiedCount} documenti.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Errore durante l'aggiornamento:", error);

    // Risposta con errore
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
