import { NextResponse } from "next/server";
import { updateSnapshot, getSnapshot, getCurrentMonth } from "@/utils/snapshotManager";

// GET - Recupera lo snapshot corrente
export async function GET() {
  try {
    const currentMonth = getCurrentMonth();
    const snapshot = await getSnapshot(currentMonth.mese, currentMonth.anno);
    
    if (!snapshot) {
      return NextResponse.json({
        success: false,
        message: `Nessuno snapshot trovato per ${currentMonth.meseNome}`
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        mese: snapshot.meseNome,
        numeroCollaborazioni: snapshot.collaborazioni_snapshot.length,
        ultimoAggiornamento: snapshot.data_ultimo_aggiornamento,
        stato: snapshot.stato,
        collaborazioni: snapshot.collaborazioni_snapshot.map(collab => ({
          collaboratore: collab.collaboratore,
          cliente: collab.cliente,
          appuntamenti: `${collab.appuntamenti_fatti}/${collab.appuntamenti_totali}`,
          postIG: collab.post_ig_fb,
          postTikTok: collab.post_tiktok,
          postLinkedIn: collab.post_linkedin,
          ultimoAggiornamento: collab.ultimo_aggiornamento
        }))
      }
    });
  } catch (error) {
    console.error("Errore nel recupero dello snapshot:", error);
    return NextResponse.json({
      success: false,
      message: "Errore interno del server"
    }, { status: 500 });
  }
}

// POST - Aggiorna lo snapshot
export async function POST(request) {
  try {
    const body = await request.json();
    const { collaborazione_id } = body;
    
    const snapshot = await updateSnapshot(collaborazione_id);
    
    return NextResponse.json({
      success: true,
      message: collaborazione_id 
        ? "Collaborazione aggiornata nello snapshot"
        : "Tutto lo snapshot aggiornato",
      data: {
        mese: snapshot.meseNome,
        numeroCollaborazioni: snapshot.collaborazioni_snapshot.length,
        ultimoAggiornamento: snapshot.data_ultimo_aggiornamento
      }
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento dello snapshot:", error);
    return NextResponse.json({
      success: false,
      message: "Errore interno del server"
    }, { status: 500 });
  }
}
