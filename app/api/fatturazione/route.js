import Fatturazione from "@/models/Fatturazione";
import { Collaboratore } from "@/models/User"; // Importa per registrare il modello
import { connectToDB } from "@/utils/database";

// GET - Recupera tutte le fatture con filtri opzionali
export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const mese = searchParams.get("mese"); // Filtro per mese specifico
    const collaboratoreId = searchParams.get("collaboratoreId"); // Filtro per collaboratore

    // Costruisci il filtro dinamicamente
    const filtro = {};
    if (mese) filtro.mese = mese;
    if (collaboratoreId) filtro.collaboratore = collaboratoreId;

    const fatture = await Fatturazione.find(filtro)
      .populate("collaboratore", "nome cognome email")
      .sort({ mese: -1, createdAt: -1 }); // Ordina per mese decrescente

    // Trasforma i dati per il frontend
    const result = fatture.map((fattura) => ({
      id: fattura._id.toString(),
      data: fattura.data,
      mese: fattura.mese,
      collaboratoreId: fattura.collaboratore?._id?.toString(),
      collaboratoreNome: fattura.collaboratore?.nome || "N/A",
      collaboratoreCognome: fattura.collaboratore?.cognome || "N/A",
      collaboratoreEmail: fattura.collaboratore?.email || "N/A",
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
    console.error("Errore durante il recupero delle fatture:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
