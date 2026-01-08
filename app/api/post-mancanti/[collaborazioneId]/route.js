import { connectToDB } from "@utils/database";
import Nota from "@models/Note";

export async function GET(req, { params }) {
  try {
    const { collaborazioneId } = params;
    
    if (!collaborazioneId) {
      return new Response(
        JSON.stringify({ message: "ID collaborazione mancante" }),
        { status: 400 }
      );
    }

    await connectToDB();

    // Conta le note di tipo "post_mancante" del mese corrente
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const count = await Nota.countDocuments({ 
      collaborazione: collaborazioneId, 
      tipo: "post_mancante", 
      data: {
        $gte: firstDayOfMonth,
        $lte: today
      }  
    });
    
    return new Response(JSON.stringify(count), { status: 200 });
  } catch (error) {
    console.error("Errore nel recupero dei post mancanti:", error);
    return new Response(
      JSON.stringify({ message: "Errore nel recupero dei post mancanti" }),
      { status: 500 }
    );
  }
}
