import { connectToDB } from "@utils/database";
import Nota from "@models/Note";

export async function GET(req, { params }) {
  try {
    console.log("Parametri ricevuti:", params);

    // Assicurati che collaborazioneId sia definito
    const { collaborazioneId } = params;
    console.log(collaborazioneId)
    if (!collaborazioneId) {
      console.error("ID collaborazione mancante");
      return new Response(
        JSON.stringify({ message: "ID collaborazione mancante" }),
        { status: 400 }
      );
    }

    await connectToDB();

    // Recupera tutte le note relative a questa collaborazione
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Ultimo giorno del mese corrente (primo giorno del mese successivo - 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const notes = await Nota.countDocuments({ 
      collaborazione: collaborazioneId, 
      tipo: "appuntamento", 
      data_appuntamento: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth
      }  
    });
    console.log(`Appuntamenti per ${collaborazioneId}: ${notes} (dal ${firstDayOfMonth.toISOString()} al ${lastDayOfMonth.toISOString()})`);
    return new Response(JSON.stringify(notes), { status: 200 });
  } catch (error) {
    console.error("Errore nel recupero delle note:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
