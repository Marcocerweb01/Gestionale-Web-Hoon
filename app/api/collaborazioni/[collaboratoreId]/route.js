import Collaborazione from "@/models/Collaborazioni";
import { Azienda } from "@/models/User";
import { connectToDB } from "@/utils/database";

// ✨ FORZA DYNAMIC RENDERING - NO CACHE
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req, { params }) {
  console.log("🔍 ========== API COLLABORAZIONI START ==========");
  
  // ✨ IMPORTANTE: In Next.js 15+, params è una Promise!
  const resolvedParams = await params;
  console.log("📦 Params object:", JSON.stringify(resolvedParams, null, 2));
  console.log("📦 Params keys:", Object.keys(resolvedParams));
  console.log("📦 Request URL:", req.url);
  
  try {
    await connectToDB();
    console.log("✅ Database connesso");

    // Ottieni il collaboratoreId dai parametri dell'URL
    const { collaboratoreId } = resolvedParams;
    console.log("🎯 collaboratoreId estratto:", collaboratoreId);
    console.log("🎯 Tipo di collaboratoreId:", typeof collaboratoreId);
    console.log("🎯 collaboratoreId length:", collaboratoreId?.length);

    if (!collaboratoreId || collaboratoreId === 'undefined' || collaboratoreId === 'null') {
      console.error("❌ ID collaboratore mancante o non valido!");
      console.error("❌ Params completo:", JSON.stringify(resolvedParams));
      return new Response(
        JSON.stringify({ 
          message: "ID collaboratore mancante o non valido",
          receivedParams: resolvedParams,
          receivedId: collaboratoreId
        }), 
        { status: 400 }
      );
    }
    
    console.log("✅ ID valido, procedo con la query...");
    console.log("🔍 Query: Collaborazione.find({ collaboratore:", collaboratoreId, "})");
    
    // Recupera le collaborazioni del collaboratore specifico
    const collaborazioni = await Collaborazione.find({ collaboratore: collaboratoreId })
      .populate("azienda");
    
    console.log("📊 Collaborazioni trovate:", collaborazioni.length);

    if (collaborazioni.length === 0) {
      console.log("⚠️ Nessuna collaborazione trovata per questo collaboratore");
    }

    // Trasforma i dati per il frontend
    const result = collaborazioni.map((collaborazione) => {
      console.log("📝 Mapping collaborazione:", collaborazione._id);
      if (!collaborazione.azienda) {
        console.warn("⚠️ ATTENZIONE: collaborazione senza azienda populate!", collaborazione._id);
      }
      return {
      id: collaborazione._id,
      cliente: collaborazione.azienda?.etichetta || 'N/A',
      clienteId: collaborazione.azienda?._id || null,
      appuntamenti: collaborazione.numero_appuntamenti,
      postIg_fb: collaborazione.post_ig_fb,
      postTiktok: collaborazione.post_tiktok,
      postLinkedin: collaborazione.post_linkedin,
      feed: collaborazione._id,
      pagato: collaborazione.pagato,
      post_ig_fb_fatti: collaborazione.post_ig_fb_fatti,
      post_tiktok_fatti: collaborazione.post_tiktok_fatti,
      post_linkedin_fatti: collaborazione.post_linkedin_fatti,
      // Campi per gestione contratto - FATTI (cumulativi, non si azzerano)
      post_totali: collaborazione.post_totali || 0,
      appuntamenti_totali: collaborazione.appuntamenti_totali || 0,
      // Campi per gestione contratto - PREVISTI (impostati manualmente)
      post_totali_previsti: collaborazione.post_totali_previsti || 0,
      appuntamenti_totali_previsti: collaborazione.appuntamenti_totali_previsti || 0,
      durata_contratto: collaborazione.durata_contratto || null,
      data_inizio_contratto: collaborazione.data_inizio_contratto || null,
      data_fine_contratto: collaborazione.data_fine_contratto || null,
      // Campi per valutazione trimestrale
      valutazione_trimestrale_fatti: collaborazione.valutazione_trimestrale_fatti || 0,
      valutazione_trimestrale_totali: collaborazione.valutazione_trimestrale_totali || 0,
      // Campi per valutazione trimestrale per tipo
      instagram_trim_fatti: collaborazione.instagram_trim_fatti || 0,
      instagram_trim_totali: collaborazione.instagram_trim_totali || 0,
      tiktok_trim_fatti: collaborazione.tiktok_trim_fatti || 0,
      tiktok_trim_totali: collaborazione.tiktok_trim_totali || 0,
      linkedin_trim_fatti: collaborazione.linkedin_trim_fatti || 0,
      linkedin_trim_totali: collaborazione.linkedin_trim_totali || 0,
      // Campi per appuntamenti trimestrali
      appuntamenti_trimestrale_fatti: collaborazione.appuntamenti_trimestrale_fatti || 0,
      appuntamenti_trimestrale_totali: collaborazione.appuntamenti_trimestrale_totali || 0,
    }
    });

    console.log("✅ Mapping completato, result length:", result.length);
    console.log("🔍 ========== API COLLABORAZIONI END (SUCCESS) ==========");
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("❌ ========== ERRORE API COLLABORAZIONI ==========");
    console.error("❌ Tipo errore:", error.constructor.name);
    console.error("❌ Messaggio:", error.message);
    console.error("❌ Stack trace:", error.stack);
    console.error("❌ Params al momento dell'errore:", JSON.stringify(resolvedParams));
    console.error("🔍 ========== API COLLABORAZIONI END (ERROR) ==========");
    return new Response(
      JSON.stringify({ 
        message: "Errore interno al server",
        error: error.message,
        type: error.constructor.name
      }),
      { status: 500 }
    );
  }
}

