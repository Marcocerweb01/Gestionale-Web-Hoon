import { connectToDB } from "@utils/database";
import NotaComm from "@models/Note-comm";

export async function GET(req, { params }) {
  try {
    console.log("Parametri ricevuti:", params);

    // Assicurati che collaboratoreId sia definito
    const { collaboratoreId } = params;
    console.log(collaboratoreId)
    if (!collaboratoreId) {
      console.error("ID collaborazione mancante");
      return new Response(
        JSON.stringify({ message: "ID collaborazione mancante" }),
        { status: 400 }
      );
    }

    await connectToDB();

    // Recupera tutte le note relative a questa collaborazione
    const notes = await NotaComm.find({ autoreId: collaboratoreId })
    console.log(notes)
    return new Response(JSON.stringify(notes), { status: 200 });
  } catch (error) {
    console.error("Errore nel recupero delle note:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
