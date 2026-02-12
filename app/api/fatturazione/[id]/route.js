import Fatturazione from "@/models/Fatturazione";
import { connectToDB } from "@/utils/database";

// GET - Recupera una singola fattura
export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { id } = resolvedParams;

    if (!id) {
      return new Response(
        JSON.stringify({ message: "ID fattura mancante" }),
        { status: 400 }
      );
    }

    const fattura = await Fatturazione.findById(id)
      .populate("collaboratore", "nome cognome email");

    if (!fattura) {
      return new Response(
        JSON.stringify({ message: "Fattura non trovata" }),
        { status: 404 }
      );
    }

    const result = {
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
    };

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Errore durante il recupero della fattura:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna una fattura
export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { id } = resolvedParams;
    const body = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ message: "ID fattura mancante" }),
        { status: 400 }
      );
    }

    console.log(`Aggiornamento fattura ${id}:`, body);

    // Prepara i campi da aggiornare
    const updates = {};
    
    if (body.totale !== undefined) updates.totale = body.totale;
    if (body.statoCollaboratore) updates.statoCollaboratore = body.statoCollaboratore;
    if (body.statoAmministratore) updates.statoAmministratore = body.statoAmministratore;

    // Aggiorna la fattura
    const fatturaAggiornata = await Fatturazione.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("collaboratore", "nome cognome email");

    if (!fatturaAggiornata) {
      return new Response(
        JSON.stringify({ message: "Fattura non trovata" }),
        { status: 404 }
      );
    }

    console.log(`✅ Fattura ${id} aggiornata con successo`);

    const result = {
      id: fatturaAggiornata._id.toString(),
      data: fatturaAggiornata.data,
      mese: fatturaAggiornata.mese,
      collaboratoreId: fatturaAggiornata.collaboratore?._id?.toString(),
      collaboratoreNome: fatturaAggiornata.collaboratore?.nome || "N/A",
      collaboratoreCognome: fatturaAggiornata.collaboratore?.cognome || "N/A",
      totale: fatturaAggiornata.totale,
      statoCollaboratore: fatturaAggiornata.statoCollaboratore,
      statoAmministratore: fatturaAggiornata.statoAmministratore,
      updatedAt: fatturaAggiornata.updatedAt,
    };

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della fattura:", error);
    return new Response(
      JSON.stringify({ 
        message: "Errore interno al server",
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
