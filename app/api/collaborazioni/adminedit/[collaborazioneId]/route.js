import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
  try {
    await connectToDB();

    const { collaborazioneId } = params;
    const { 
      numero_appuntamenti, 
      post_ig_fb, 
      post_tiktok, 
      post_linkedin,
      post_totali,
      appuntamenti_totali,
      durata_contratto,
      data_inizio_contratto,
      data_fine_contratto
    } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(collaborazioneId)) {
      return new Response(JSON.stringify({ message: "ID collaborazione non valido" }), { status: 400 });
    }

    const updateData = {
      ...(numero_appuntamenti !== undefined && { numero_appuntamenti: Number(numero_appuntamenti) }),
      ...(post_ig_fb !== undefined && { post_ig_fb: Number(post_ig_fb) }),
      ...(post_tiktok !== undefined && { post_tiktok: Number(post_tiktok) }),
      ...(post_linkedin !== undefined && { post_linkedin: Number(post_linkedin) }),
      ...(post_totali !== undefined && { post_totali: Number(post_totali) }),
      ...(appuntamenti_totali !== undefined && { appuntamenti_totali: Number(appuntamenti_totali) }),
      ...(durata_contratto !== undefined && { durata_contratto: durata_contratto || null }),
      ...(data_inizio_contratto !== undefined && { data_inizio_contratto: data_inizio_contratto ? new Date(data_inizio_contratto) : null }),
      ...(data_fine_contratto !== undefined && { data_fine_contratto: data_fine_contratto ? new Date(data_fine_contratto) : null }),
    };

    const collaborazione = await Collaborazione.findByIdAndUpdate(collaborazioneId, updateData, { new: true });

    if (!collaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    console.log("✅ Collaborazione aggiornata dall'admin");

    return new Response(JSON.stringify(collaborazione), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}