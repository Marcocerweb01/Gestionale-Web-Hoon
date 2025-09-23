import { connectToDB } from "@/utils/database";
import Nota from "@/models/Note";
import Collaborazione from "@/models/Collaborazioni";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();

    // Ottieni tutte le note di tipo appuntamento
    const allAppuntamenti = await Nota.find({ tipo: "appuntamento" })
      .populate('collaborazione', 'collaboratoreNome collaboratoreCognome aziendaRagioneSociale')
      .sort({ data_appuntamento: -1 });

    // Calcola appuntamenti per il mese corrente
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const appuntamentiMeseCorrente = await Nota.find({
      tipo: "appuntamento",
      data_appuntamento: { 
        $gte: firstDay, 
        $lte: lastDay 
      }
    }).populate('collaborazione', 'collaboratoreNome collaboratoreCognome aziendaRagioneSociale');

    // Conta appuntamenti per collaborazione nel mese corrente
    const conteggioPerCollab = {};
    for (const app of appuntamentiMeseCorrente) {
      const id = app.collaborazione._id.toString();
      conteggioPerCollab[id] = (conteggioPerCollab[id] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        totale_appuntamenti_db: allAppuntamenti.length,
        appuntamenti_mese_corrente: appuntamentiMeseCorrente.length,
        mese_range: {
          da: firstDay.toISOString(),
          a: lastDay.toISOString()
        },
        dettagli_mese_corrente: appuntamentiMeseCorrente.map(app => ({
          id: app._id,
          data: app.data_appuntamento,
          collaboratore: `${app.collaborazione?.collaboratoreNome || ''} ${app.collaborazione?.collaboratoreCognome || ''}`.trim(),
          azienda: app.collaborazione?.aziendaRagioneSociale || '',
          nota: app.note?.substring(0, 100) + (app.note?.length > 100 ? '...' : '')
        })),
        conteggio_per_collaborazione: conteggioPerCollab,
        sample_appuntamenti: allAppuntamenti.slice(0, 5).map(app => ({
          id: app._id,
          data: app.data_appuntamento,
          collaboratore: `${app.collaborazione?.collaboratoreNome || ''} ${app.collaborazione?.collaboratoreCognome || ''}`.trim(),
          azienda: app.collaborazione?.aziendaRagioneSociale || ''
        }))
      }
    });

  } catch (error) {
    console.error("Errore debug appuntamenti:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
