export const dynamic = "force-dynamic";

import Pagamenti from "@/models/Pagamenti";
import { connectToDB } from "@/utils/database";

export async function GET() {
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

    // Prendi tutti i pagamenti del mese senza populate per ora
    const pagamenti = await Pagamenti.find({
      data_fattura: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();

    // Raggruppa per cliente per trovare duplicati
    const raggruppati = {};
    pagamenti.forEach(p => {
      const clienteNome = p.cliente?.etichetta || "N/A";
      if (!raggruppati[clienteNome]) {
        raggruppati[clienteNome] = [];
      }
      raggruppati[clienteNome].push({
        id: p._id.toString(),
        data_fattura: p.data_fattura,
        data_pagato: p.data_pagato,
        stato: p.stato,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      });
    });

    // Trova solo i clienti con più di un pagamento
    const duplicati = {};
    Object.keys(raggruppati).forEach(cliente => {
      if (raggruppati[cliente].length > 1) {
        duplicati[cliente] = raggruppati[cliente];
      }
    });

    return new Response(JSON.stringify({
      totalePagamenti: pagamenti.length,
      clientiUnici: Object.keys(raggruppati).length,
      clientiConDuplicati: Object.keys(duplicati).length,
      duplicati: duplicati
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Errore interno al server", error: error.message }),
      { status: 500 }
    );
  }
}
