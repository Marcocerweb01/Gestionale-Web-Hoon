 
import { connectToDB } from "@/utils/database"; // Importa la connessione al DB
import { Azienda } from "@/models/User.js"; // Importa il modello di Azienda


export async function POST(req) {
 

  try {
    // Connessione al database
    await connectToDB();

    // Aggiorna tutte le aziende aggiungendo il campo "etichetta" se non esiste
    const result = await Azienda.updateMany(
      {}, // Nessun filtro, aggiorna tutti i documenti
      { $set: { etichetta: "Default" } }, // Imposta il valore predefinito
      { upsert: false } // Non creare nuovi documenti, aggiorna solo quelli esistenti
    );

    return res.status(200).json({
      message: `Aggiornati ${result.modifiedCount} documenti.`,
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento:", error);
    return res.status(500).json({ message: "Errore interno al server" });
  }
}
