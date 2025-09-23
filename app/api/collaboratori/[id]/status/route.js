import { connectToDB } from "@/utils/database";
import { Collaboratore } from "@/models/User";

// API per attivare/disattivare rapidamente un collaboratore
export async function PATCH(req, { params }) {
  try {
    await connectToDB();

    const { id } = params; // ID del collaboratore
    const { action } = await req.json(); // "activate" o "deactivate"

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID collaboratore richiesto" }),
        { status: 400 }
      );
    }

    if (!action || !["activate", "deactivate"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Action deve essere 'activate' o 'deactivate'" }),
        { status: 400 }
      );
    }

    // Trova il collaboratore
    const collaboratore = await Collaboratore.findById(id);
    if (!collaboratore) {
      return new Response(
        JSON.stringify({ error: "Collaboratore non trovato" }),
        { status: 404 }
      );
    }

    // Aggiorna lo status
    const newStatus = action === "activate" ? "attivo" : "non_attivo";
    
    const updatedCollaboratore = await Collaboratore.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true, runValidators: true }
    );

    console.log(`🔄 Collaboratore ${collaboratore.nome} ${collaboratore.cognome} ${action === "activate" ? "attivato" : "disattivato"}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Collaboratore ${action === "activate" ? "attivato" : "disattivato"} con successo`,
        collaboratore: {
          id: updatedCollaboratore._id,
          nome: updatedCollaboratore.nome,
          cognome: updatedCollaboratore.cognome,
          email: updatedCollaboratore.email,
          status: updatedCollaboratore.status
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Errore toggle status collaboratore:", error);
    return new Response(
      JSON.stringify({ error: "Errore interno del server" }),
      { status: 500 }
    );
  }
}

// GET per verificare lo status attuale
export async function GET(req, { params }) {
  try {
    await connectToDB();

    const { id } = params;

    const collaboratore = await Collaboratore.findById(id).select('nome cognome email status');
    if (!collaboratore) {
      return new Response(
        JSON.stringify({ error: "Collaboratore non trovato" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        collaboratore: {
          id: collaboratore._id,
          nome: collaboratore.nome,
          cognome: collaboratore.cognome,
          email: collaboratore.email,
          status: collaboratore.status || "attivo"
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Errore recupero status collaboratore:", error);
    return new Response(
      JSON.stringify({ error: "Errore interno del server" }),
      { status: 500 }
    );
  }
}