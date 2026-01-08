import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
  try {
    await connectToDB();

    const { collaborazioneId } = params;

    if (!mongoose.Types.ObjectId.isValid(collaborazioneId)) {
      return new Response(JSON.stringify({ message: "ID collaborazione non valido" }), { status: 400 });
    }

    // Azzera solo i campi post_totali e appuntamenti_totali
    const updateData = {
      post_totali: 0,
      appuntamenti_totali: 0,
    };

    const collaborazione = await Collaborazione.findByIdAndUpdate(
      collaborazioneId, 
      updateData, 
      { new: true }
    );

    if (!collaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    console.log("✅ Totali generali azzerati per collaborazione:", collaborazioneId);

    return new Response(JSON.stringify({ 
      message: "Totali generali azzerati con successo",
      collaborazione 
    }), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'azzeramento dei totali:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}
