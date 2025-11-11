export const dynamic = "force-dynamic";

import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import { Collaboratore, Azienda } from "@/models/User";

export async function GET(req) {
  try {
    console.log("🚀 Inizio export JSON semplificato...");
    await connectToDB();

    // Recupera tutte le collaborazioni attive con populate
    const collaborazioni = await Collaborazione.find({ stato: "attiva" })
      .populate("collaboratore")
      .populate("azienda")
      .lean();

    // Prepara i dati semplificati
    const exportData = collaborazioni.map(c => ({
      collaboratore: `${c.collaboratore?.nome || c.collaboratoreNome || ''} ${c.collaboratore?.cognome || c.collaboratoreCognome || ''}`.trim(),
      cliente: c.azienda?.etichetta || c.aziendaRagioneSociale || 'N/A',
      appuntamenti_totali: c.numero_appuntamenti || 0,
      appuntamenti_fatti: c.appuntamenti_fatti || 0,
      post_ig_fb_totali: c.post_ig_fb || 0,
      post_ig_fb_fatti: c.post_ig_fb_fatti || 0,
      post_tiktok_totali: c.post_tiktok || 0,
      post_tiktok_fatti: c.post_tiktok_fatti || 0,
      post_linkedin_totali: c.post_linkedin || 0,
      post_linkedin_fatti: c.post_linkedin_fatti || 0,
    }));

    // Ordina per collaboratore
    exportData.sort((a, b) => a.collaboratore.localeCompare(b.collaboratore));

    console.log(`✅ Export completato: ${exportData.length} collaborazioni attive`);

    // Crea il JSON formattato
    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    // Genera nome file con data e ora
    const now = new Date();
    const filename = `collaborazioni_export_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.json`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ Errore export JSON:", error);
    return new Response(
      JSON.stringify({ 
        message: "Errore durante l'export", 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
