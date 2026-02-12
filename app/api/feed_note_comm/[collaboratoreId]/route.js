import { connectToDB } from "@utils/database";
import NotaComm from "@models/Note-comm";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    console.log("Parametri ricevuti:", resolvedParams);

    const { collaboratoreId } = resolvedParams;
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
        filter.data.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0)); // Imposta a mezzanotte
      }
      if (endDate) {
        filter.data.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999)); // Imposta alla fine del giorno
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
