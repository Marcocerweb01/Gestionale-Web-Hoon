export const dynamic = "force-dynamic";

import Pagamenti from "@/models/Pagamenti";
import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const meseAnno = searchParams.get("mese"); // Formato: YYYY-MM

    let startOfMonth, endOfMonth;

    if (meseAnno) {
      // Se viene passato un mese specifico, usa quello
      const [anno, mese] = meseAnno.split("-").map(Number);
      startOfMonth = new Date(anno, mese - 1, 1);
      endOfMonth = new Date(anno, mese, 0, 23, 59, 59, 999);
    } else {
      // Altrimenti usa il mese corrente
      const now = new Date();
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    }

    // Filtra i pagamenti per data_fattura nel periodo selezionato
    const pagamenti = await Pagamenti.find({
      data_fattura: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate("cliente");

    // Per ogni pagamento, trova la collaborazione attiva per ottenere il collaboratore
    const result = await Promise.all(
      pagamenti.map(async (p) => {
        let collaboratoreNome = "N/A";
        let collaboratoreId = null;
        
        if (p.cliente?._id) {
          // Cerca la collaborazione attiva per questa azienda
          const collaborazione = await Collaborazione.findOne({
            azienda: p.cliente._id,
            stato: "attiva"
          }).populate("collaboratore");
          
          if (collaborazione?.collaboratore) {
            collaboratoreNome = `${collaborazione.collaboratore.nome} ${collaborazione.collaboratore.cognome}`;
            collaboratoreId = collaborazione.collaboratore._id;
          }
        }

        return {
          id: p._id,
          cliente: p.cliente?.etichetta || "N/A",
          cliente_id: p.cliente?._id || null,
          ragione_sociale: p.cliente?.ragioneSociale || "N/A",
          collaboratore: collaboratoreNome,
          collaboratore_id: collaboratoreId,
          data_fattura: p.data_fattura,
          data_pagato: p.data_pagato,
          stato: p.stato,
        };
      })
    );

    const headers = new Headers({
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    const nuovoPagamento = await Pagamenti.create(body);

    return new Response(JSON.stringify(nuovoPagamento), {
      status: 201,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: error.message }),
      { status: 400 }
    );
  }
}