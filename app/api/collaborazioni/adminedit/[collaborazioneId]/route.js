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
      post_totali_previsti,
      appuntamenti_totali_previsti,
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
      ...(post_totali_previsti !== undefined && { post_totali_previsti: Number(post_totali_previsti) }),
      ...(appuntamenti_totali_previsti !== undefined && { appuntamenti_totali_previsti: Number(appuntamenti_totali_previsti) }),
      ...(durata_contratto !== undefined && { durata_contratto: durata_contratto || null }),
      ...(data_inizio_contratto !== undefined && { data_inizio_contratto: data_inizio_contratto ? new Date(data_inizio_contratto) : null }),
      ...(data_fine_contratto !== undefined && { data_fine_contratto: data_fine_contratto ? new Date(data_fine_contratto) : null }),
    };

    console.log("📝 ADMIN EDIT - UpdateData:", JSON.stringify(updateData));
    console.log("📝 ADMIN EDIT - post_totali_previsti ricevuto:", post_totali_previsti, "tipo:", typeof post_totali_previsti);

    // Usa $set esplicitamente per forzare l'aggiornamento
    const collaborazione = await Collaborazione.findByIdAndUpdate(
      collaborazioneId, 
      { $set: updateData }, 
      { new: true, runValidators: false }
    );
    
    console.log("📝 ADMIN EDIT - Dopo salvataggio, post_totali_previsti:", collaborazione.post_totali_previsti);
    console.log("📝 ADMIN EDIT - Collaborazione salvata:", JSON.stringify(collaborazione.toObject()));

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