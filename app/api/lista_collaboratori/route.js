import { Collaboratore } from "@/models/User"; // Assicurati che Collaboratore sia importato correttamente
import { connectToDB } from "@/utils/database";

export async function GET(req) {
  try {
    // Connessione al database
    await connectToDB();

    // ✨ Forza la riconnessione per evitare cache di connessione
    await connectToDB();

    // Recupera tutti i collaboratori dal database con una query fresh
    const collaboratori = await Collaboratore.find().lean(); // .lean() per performance

    // Formatta i dati per il frontend
    const result = collaboratori.map((collaboratore) => ({
      id: collaboratore._id,
      nome: collaboratore.nome,
      cognome:collaboratore.cognome,
      email: collaboratore.email,
      subRole: collaboratore.subRole,
      partitaIva: collaboratore.partitaIva,
      status: collaboratore.status || 'attivo', // ✨ Aggiungi il campo status
    }));
    
    console.log(`📊 Lista collaboratori recuperata: ${result.length} elementi`);
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Surrogate-Control": "no-store",
        "X-Timestamp": Date.now().toString(), // ✨ Timestamp per debug
      }
    });
  } catch (error) {
    console.error("Errore durante il recupero dei collaboratori:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
