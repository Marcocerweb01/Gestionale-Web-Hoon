import Fatturazione from "@/models/Fatturazione";
import { connectToDB } from "@/utils/database";

// GET - Recupera tutte le fatture di un collaboratore specifico
export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { collaboratoreId } = resolvedParams;

    if (!collaboratoreId) {
      return new Response(
        JSON.stringify({ message: "ID collaboratore mancante" }),
        { status: 400 }
      );
    }

    console.log(`Recupero fatture per collaboratore: ${collaboratoreId}`);

    const fatture = await Fatturazione.find({ collaboratore: collaboratoreId })
      .populate("collaboratore", "nome cognome email")
      .sort({ mese: -1 }); // Ordina per mese decrescente (più recente prima)

    console.log(`Trovate ${fatture.length} fatture per il collaboratore ${collaboratoreId}`);

    // Trasforma i dati per il frontend
    const result = fatture.map((fattura) => ({
      id: fattura._id.toString(),
      data: fattura.data,
      mese: fattura.mese,
      collaboratoreId: fattura.collaboratore?._id?.toString(),
      collaboratoreNome: fattura.collaboratore?.nome || "N/A",
      collaboratoreCognome: fattura.collaboratore?.cognome || "N/A",
      totale: fattura.totale,
      statoCollaboratore: fattura.statoCollaboratore,
      statoAmministratore: fattura.statoAmministratore,
      createdAt: fattura.createdAt,
      updatedAt: fattura.updatedAt,
    }));

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error("Errore durante il recupero delle fatture del collaboratore:", error);
    return new Response(
      JSON.stringify({ 
        message: "Errore interno al server",
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
