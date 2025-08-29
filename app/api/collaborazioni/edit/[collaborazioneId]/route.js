import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
import { updateSnapshot } from "@/utils/snapshotManager";
import mongoose from "mongoose";

export async function PATCH(req, { params }) {
    try {
      await connectToDB();
  
      const { collaborazioneId } = params;
      console.log(params)
      const { post_ig_fb_fatti, post_tiktok_fatti, post_linkedin_fatti } = await req.json();
  
      if (!mongoose.Types.ObjectId.isValid(collaborazioneId)) {
        return new Response(JSON.stringify({ message: "ID collaborazione non valido" }), { status: 400 });
      }
  
      const updateData = {
        ...(post_ig_fb_fatti !== undefined && { post_ig_fb_fatti: Number(post_ig_fb_fatti) }),
        ...(post_tiktok_fatti !== undefined && { post_tiktok_fatti: Number(post_tiktok_fatti) }),
        ...(post_linkedin_fatti !== undefined && { post_linkedin_fatti: Number(post_linkedin_fatti) }),
      };
  
      const collaborazione = await Collaborazione.findByIdAndUpdate(collaborazioneId, updateData, { new: true });
  
      if (!collaborazione) {
        return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
      }

      // Aggiorna automaticamente lo snapshot quando vengono aggiornati i dati "fatti"
      try {
        await updateSnapshot();
        console.log("Snapshot aggiornato dopo modifica collaborazione");
      } catch (snapshotError) {
        console.error("Errore aggiornamento snapshot:", snapshotError);
        // Non interrompiamo l'operazione se lo snapshot fallisce
      }
  
      return new Response(JSON.stringify({ message: "Collaborazione aggiornata con successo", collaborazione }), { status: 200 });
    } catch (error) {
      console.error("Errore durante l'aggiornamento della collaborazione:", error);
      return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
    }
  }
  