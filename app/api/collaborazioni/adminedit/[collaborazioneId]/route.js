import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
import {
  getSocialCollaborationStatus,
  parseContractDate,
} from "@/utils/socialCollaborationStatus";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { collaborazioneId } = resolvedParams;
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

    const currentCollaboration = await Collaborazione.findById(collaborazioneId)
      .select("stato data_inizio_contratto data_fine_contratto")
      .lean();

    if (!currentCollaboration) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    const nextStartDate = data_inizio_contratto !== undefined
      ? parseContractDate(data_inizio_contratto)
      : currentCollaboration.data_inizio_contratto;
    const nextEndDate = data_fine_contratto !== undefined
      ? parseContractDate(data_fine_contratto)
      : currentCollaboration.data_fine_contratto;

    if (data_inizio_contratto !== undefined && !nextStartDate) {
      return new Response(
        JSON.stringify({ message: "La data di inizio contratto è obbligatoria" }),
        { status: 400 }
      );
    }

    if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
      return new Response(
        JSON.stringify({ message: "La data di fine contratto non può precedere la data di inizio" }),
        { status: 400 }
      );
    }

    const updateData = {
      ...(numero_appuntamenti !== undefined && { numero_appuntamenti: Number(numero_appuntamenti) }),
      ...(post_ig_fb !== undefined && { post_ig_fb: Number(post_ig_fb) }),
      ...(post_tiktok !== undefined && { post_tiktok: Number(post_tiktok) }),
      ...(post_linkedin !== undefined && { post_linkedin: Number(post_linkedin) }),
      ...(post_totali_previsti !== undefined && { post_totali_previsti: Number(post_totali_previsti) }),
      ...(appuntamenti_totali_previsti !== undefined && { appuntamenti_totali_previsti: Number(appuntamenti_totali_previsti) }),
      ...(durata_contratto !== undefined && { durata_contratto: durata_contratto || null }),
      ...(data_inizio_contratto !== undefined && { data_inizio_contratto: nextStartDate }),
      ...(data_fine_contratto !== undefined && { data_fine_contratto: nextEndDate }),
      ...((data_inizio_contratto !== undefined || currentCollaboration.stato === "pending") && {
        stato: getSocialCollaborationStatus(nextStartDate, currentCollaboration.stato),
      }),
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
