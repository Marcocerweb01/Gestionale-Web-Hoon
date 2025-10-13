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

    // Filtra i pagamenti per data_fattura nel mese corrente
    const pagamenti = await Pagamenti.find({
      data_fattura: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate("cliente");

    const result = pagamenti.map((p) => ({
      id: p._id,
      cliente: p.cliente?.etichetta || "N/A", // <-- solo etichetta
      ragione_sociale:p.cliente?.ragioneSociale || "N/A", // <-- Ragione Sociale
      data_fattura: p.data_fattura,
      data_pagato: p.data_pagato,
      stato: p.stato,
    }));

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