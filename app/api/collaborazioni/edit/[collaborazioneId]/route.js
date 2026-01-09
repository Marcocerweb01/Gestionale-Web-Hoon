import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
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

      // Recupera la collaborazione attuale per calcolare la differenza
      const currentCollab = await Collaborazione.findById(collaborazioneId);
      if (!currentCollab) {
        return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
      }

      // Calcola la differenza per TUTTI i tipi di post (per aggiornare il trimestrale)
      const oldPostIgFb = currentCollab.post_ig_fb_fatti || 0;
      const newPostIgFb = post_ig_fb_fatti !== undefined ? Number(post_ig_fb_fatti) : oldPostIgFb;
      const diffPostIgFb = newPostIgFb - oldPostIgFb;

      const oldPostTiktok = currentCollab.post_tiktok_fatti || 0;
      const newPostTiktok = post_tiktok_fatti !== undefined ? Number(post_tiktok_fatti) : oldPostTiktok;
      const diffPostTiktok = newPostTiktok - oldPostTiktok;

      const oldPostLinkedin = currentCollab.post_linkedin_fatti || 0;
      const newPostLinkedin = post_linkedin_fatti !== undefined ? Number(post_linkedin_fatti) : oldPostLinkedin;
      const diffPostLinkedin = newPostLinkedin - oldPostLinkedin;

      // Differenza totale per il trimestrale (somma di tutti i tipi di post)
      const diffTotalePosts = diffPostIgFb + diffPostTiktok + diffPostLinkedin;

      const updateData = {
        ...(post_ig_fb_fatti !== undefined && { post_ig_fb_fatti: Number(post_ig_fb_fatti) }),
        ...(post_tiktok_fatti !== undefined && { post_tiktok_fatti: Number(post_tiktok_fatti) }),
        ...(post_linkedin_fatti !== undefined && { post_linkedin_fatti: Number(post_linkedin_fatti) }),
      };

      // Se c'è una differenza nei post, aggiorna anche i trimestrali per tipo E post_totali
      let collaborazione;
      if (diffPostIgFb !== 0 || diffPostTiktok !== 0 || diffPostLinkedin !== 0) {
        collaborazione = await Collaborazione.findByIdAndUpdate(
          collaborazioneId, 
          {
            ...updateData,
            $inc: { 
              valutazione_trimestrale_fatti: diffTotalePosts, 
              post_totali: diffTotalePosts,
              // Incrementi separati per tipo
              instagram_trim_fatti: diffPostIgFb,
              tiktok_trim_fatti: diffPostTiktok,
              linkedin_trim_fatti: diffPostLinkedin
            }
          }, 
          { new: true }
        );
      } else {
        collaborazione = await Collaborazione.findByIdAndUpdate(collaborazioneId, updateData, { new: true });
      }

      console.log("✅ Collaborazione aggiornata con successo", diffTotalePosts !== 0 ? `(+${diffTotalePosts} trimestrale e totali, IG:${diffPostIgFb} TK:${diffPostTiktok} LI:${diffPostLinkedin})` : '');
  
      return new Response(JSON.stringify({ message: "Collaborazione aggiornata con successo", collaborazione }), { status: 200 });
    } catch (error) {
      console.error("Errore durante l'aggiornamento della collaborazione:", error);
      return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
    }
  }
  