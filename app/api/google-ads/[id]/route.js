import GoogleAds from "@/models/GoogleAds";
import { connectToDB } from "@/utils/database";

// GET - Dettagli singola campagna
export async function GET(req, { params }) {
  try {
    await connectToDB();

    const { id } = await params;

    const campagna = await GoogleAds.findById(id)
      .populate("cliente", "etichetta ragioneSociale email partitaIva")
      .populate("collaboratore", "nome cognome email");

    if (!campagna) {
      return new Response(
        JSON.stringify({ message: "Campagna non trovata" }), 
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(campagna), { status: 200 });
  } catch (error) {
    console.error("Errore nel recupero della campagna:", error);
    return new Response(
      JSON.stringify({ message: "Errore nel recupero dei dati", error: error.message }), 
      { status: 500 }
    );
  }
}

// PATCH - Aggiorna campagna
export async function PATCH(req, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const updates = await req.json();

    const campiAggiornabili = ["contattato", "campagnaAvviata", "campagnaTerminata", "note"];
    const aggiornamenti = {};

    for (const campo of campiAggiornabili) {
      if (updates[campo] !== undefined) {
        aggiornamenti[campo] = updates[campo];
      }
    }

    if (Object.keys(aggiornamenti).length === 0) {
      return new Response(
        JSON.stringify({ message: "Nessun campo da aggiornare" }), 
        { status: 400 }
      );
    }

    const campagnaAggiornata = await GoogleAds.findByIdAndUpdate(
      id,
      aggiornamenti,
      { new: true, runValidators: true }
    )
      .populate("cliente", "etichetta ragioneSociale email")
      .populate("collaboratore", "nome cognome email");

    if (!campagnaAggiornata) {
      return new Response(
        JSON.stringify({ message: "Campagna non trovata" }), 
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(campagnaAggiornata), { status: 200 });
  } catch (error) {
    console.error("Errore nell'aggiornamento della campagna:", error);
    return new Response(
      JSON.stringify({ message: "Errore nell'aggiornamento", error: error.message }), 
      { status: 500 }
    );
  }
}

// DELETE - Elimina campagna
export async function DELETE(req, { params }) {
  try {
    await connectToDB();

    const { id } = await params;

    const campagna = await GoogleAds.findByIdAndDelete(id);

    if (!campagna) {
      return new Response(
        JSON.stringify({ message: "Campagna non trovata" }), 
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Campagna eliminata con successo" }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nell'eliminazione della campagna:", error);
    return new Response(
      JSON.stringify({ message: "Errore nell'eliminazione", error: error.message }), 
      { status: 500 }
    );
  }
}
