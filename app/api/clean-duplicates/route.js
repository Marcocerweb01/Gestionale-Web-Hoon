export const dynamic = "force-dynamic";

import Pagamenti from "@/models/Pagamenti";
import { connectToDB } from "@/utils/database";

export async function POST() {
  try {
    await connectToDB();

    // Calcola inizio e fine del mese corrente
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Prendi tutti i pagamenti del mese
    const pagamenti = await Pagamenti.find({
      data_fattura: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();

    let removed = [];
    let errors = [];

    // Raggruppa per cliente
    const raggruppati = {};
    pagamenti.forEach(p => {
      const clienteId = p.cliente.toString();
      if (!raggruppati[clienteId]) {
        raggruppati[clienteId] = [];
      }
      raggruppati[clienteId].push(p);
    });

    // Per ogni cliente con duplicati, rimuovi quello più vecchio
    for (const clienteId of Object.keys(raggruppati)) {
      const records = raggruppati[clienteId];
      
      if (records.length > 1) {
        // Ordina per data di creazione (più vecchi prima)
        records.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Rimuovi tutti tranne l'ultimo (più recente)
        for (let i = 0; i < records.length - 1; i++) {
          const recordToDelete = records[i];
          try {
            await Pagamenti.findByIdAndDelete(recordToDelete._id);
            removed.push({
              id: recordToDelete._id.toString(),
              cliente: clienteId,
              data_fattura: recordToDelete.data_fattura,
              createdAt: recordToDelete.createdAt
            });
          } catch (error) {
            errors.push({
              id: recordToDelete._id.toString(),
              error: error.message
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Rimossi ${removed.length} duplicati`,
      removed: removed,
      errors: errors,
      totalOriginal: pagamenti.length,
      totalAfter: pagamenti.length - removed.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Errore durante la pulizia", 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
