import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
import { updateSnapshot } from "@/utils/snapshotManager";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
  try {
    await connectToDB();

    const { collaborazioneId } = params;
    const { numero_appuntamenti, post_ig_fb, post_tiktok, post_linkedin } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(collaborazioneId)) {
      return new Response(JSON.stringify({ message: "ID collaborazione non valido" }), { status: 400 });
    }

    const updateData = {
      ...(numero_appuntamenti !== undefined && { numero_appuntamenti: Number(numero_appuntamenti) }),
      ...(post_ig_fb !== undefined && { post_ig_fb: Number(post_ig_fb) }),
      ...(post_tiktok !== undefined && { post_tiktok: Number(post_tiktok) }),
      ...(post_linkedin !== undefined && { post_linkedin: Number(post_linkedin) }),
    };

    const collaborazione = await Collaborazione.findByIdAndUpdate(collaborazioneId, updateData, { new: true });

    if (!collaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    // Aggiorna automaticamente lo snapshot quando vengono modificate le collaborazioni
    try {
      await updateSnapshot();
      console.log("Snapshot aggiornato dopo modifica admin collaborazione");
    } catch (snapshotError) {
      console.error("Errore aggiornamento snapshot:", snapshotError);
      // Non interrompiamo l'operazione se lo snapshot fallisce
    }

    return new Response(JSON.stringify(collaborazione), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}