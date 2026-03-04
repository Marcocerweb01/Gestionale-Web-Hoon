import GoogleAds from "@/models/GoogleAds";
import { connectToDB } from "@/utils/database";
import { Azienda, Collaboratore } from "@/models/User";

// GET - Lista tutte le campagne Google Ads
export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const collaboratoreId = searchParams.get("collaboratoreId");
    const clienteId = searchParams.get("clienteId");

    let query = {};
    
    if (collaboratoreId) {
      query.collaboratore = collaboratoreId;
    }
    
    if (clienteId) {
      query.cliente = clienteId;
    }

    const campagne = await GoogleAds.find(query)
      .populate("cliente", "etichetta ragioneSociale email")
      .populate("collaboratore", "nome cognome email")
      .sort({ createdAt: -1 });

    return new Response(JSON.stringify(campagne), { status: 200 });
  } catch (error) {
    console.error("Errore nel recupero delle campagne Google Ads:", error);
    return new Response(
      JSON.stringify({ message: "Errore nel recupero dei dati", error: error.message }), 
      { status: 500 }
    );
  }
}

// POST - Crea nuova campagna Google Ads
export async function POST(req) {
  try {
    await connectToDB();

    const { clienteId, collaboratoreId, contattato, campagnaAvviata, campagnaTerminata, note } = await req.json();

    if (!clienteId || !collaboratoreId) {
      return new Response(
        JSON.stringify({ message: "Cliente e collaboratore sono obbligatori" }), 
        { status: 400 }
      );
    }

    // Recupera i dati di cliente e collaboratore
    const cliente = await Azienda.findById(clienteId);
    const collaboratore = await Collaboratore.findById(collaboratoreId);

    if (!cliente || !collaboratore) {
      return new Response(
        JSON.stringify({ message: "Cliente o collaboratore non trovati" }), 
        { status: 404 }
      );
    }

    // Verifica se esiste già una campagna per questo cliente-collaboratore
    const campagnaEsistente = await GoogleAds.findOne({ 
      cliente: clienteId, 
      collaboratore: collaboratoreId 
    });

    if (campagnaEsistente) {
      return new Response(
        JSON.stringify({ 
          message: "Esiste già una campagna Google Ads per questo cliente e collaboratore",
          campagna: campagnaEsistente
        }), 
        { status: 409 }
      );
    }

    // Crea la nuova campagna
    const nuovaCampagna = await GoogleAds.create({
      cliente: clienteId,
      collaboratore: collaboratoreId,
      clienteEtichetta: cliente.etichetta || cliente.ragioneSociale,
      collaboratoreNome: collaboratore.nome,
      collaboratoreCognome: collaboratore.cognome,
      contattato: contattato || false,
      campagnaAvviata: campagnaAvviata || false,
      campagnaTerminata: campagnaTerminata || false,
      note: note || "",
    });

    return new Response(JSON.stringify(nuovaCampagna), { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione della campagna Google Ads:", error);
    return new Response(
      JSON.stringify({ message: "Errore nella creazione", error: error.message }), 
      { status: 500 }
    );
  }
}
