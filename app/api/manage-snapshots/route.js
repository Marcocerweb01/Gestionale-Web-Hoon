import { connectToDB } from "@/utils/database";
import SnapshotCollaborazioni from "@/models/SnapshotCollaborazioni";
import { getMonthName } from "@/utils/snapshotManager";

export async function GET(req) {
  try {
    await connectToDB();
    
    // Recupera tutti gli snapshot disponibili
    const snapshots = await SnapshotCollaborazioni.find({})
      .sort({ anno: -1, mese: -1 }); // Ordina per anno e mese decrescente
    
    const snapshotList = snapshots.map(snap => ({
      id: snap._id,
      mese: snap.mese,
      anno: snap.anno,
      meseNome: snap.meseNome,
      numeroCollaborazioni: snap.collaborazioni_snapshot.length,
      stato: snap.stato,
      dataCreazione: snap.data_creazione,
      dataAggiornamento: snap.data_aggiornamento,
      // URL per export diretto
      exportUrl: `/api/export_data?month=${snap.mese}&year=${snap.anno}`
    }));
    
    return new Response(
      JSON.stringify({
        success: true,
        snapshots: snapshotList,
        totalSnapshots: snapshots.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Errore nel recupero degli snapshot:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    
    const { action, month, year } = await req.json();
    
    if (action === "delete") {
      // Elimina uno snapshot (solo se non è attivo)
      if (month === undefined || year === undefined) {
        return new Response(
          JSON.stringify({ error: "Mese e anno sono richiesti" }),
          { status: 400 }
        );
      }
      
      // Non permettere eliminazione dello snapshot attivo (mese corrente)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      if (year === currentYear && month === currentMonth) {
        return new Response(
          JSON.stringify({ error: "Non puoi eliminare lo snapshot del mese corrente" }),
          { status: 400 }
        );
      }
      
      const deleted = await SnapshotCollaborazioni.findOneAndDelete({
        mese: month,
        anno: year
      });
      
      if (!deleted) {
        return new Response(
          JSON.stringify({ error: "Snapshot non trovato" }),
          { status: 404 }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Snapshot per ${getMonthName(month, year)} eliminato`
        }),
        { status: 200 }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Azione non riconosciuta. Usa 'delete'" }),
      { status: 400 }
    );
    
  } catch (error) {
    console.error("Errore nella gestione degli snapshot:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
