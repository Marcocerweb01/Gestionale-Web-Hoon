import { connectToDB } from "@utils/database";
import NotaComm from "@models/Note-comm";

export async function GET(req, { params }) {
  try {
    console.log("Parametri ricevuti:", params);

    const { collaboratoreId } = params;
    const { searchParams } = new URL(req.url);

    // Recupera i parametri di query (se presenti)
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!collaboratoreId) {
      return new Response(
        JSON.stringify({ message: "ID collaborazione mancante" }),
        { status: 400 }
      );
    }

    await connectToDB();

    // Costruisci il filtro
    const filter = { autoreId: collaboratoreId };

    if (startDate || endDate) {
      filter.data = {};
      if (startDate) {
        filter.data.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.data.$lte = new Date(endDate);
      }
    }

    // Recupera le note filtrate
    const notes = await NotaComm.find(filter);
    return new Response(JSON.stringify(notes), { status: 200 });
  } catch (error) {
    console.error("Errore nel recupero delle note:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
