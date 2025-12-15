import { connectToDB } from "@/utils/database";
import { PagamentoNuovo } from "@/models/PagamentiNuovi";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

// GET - Recupera singolo pagamento
export const GET = async (request, { params }) => {
  try {
    await connectToDB();
    
    const pagamento = await PagamentoNuovo.findById(params.id);
    
    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json(pagamento, { status: 200 });
  } catch (error) {
    console.error("Errore GET pagamento:", error);
    return NextResponse.json(
      { error: "Errore nel recupero del pagamento" },
      { status: 500 }
    );
  }
};

// PATCH - Aggiorna pagamento
export const PATCH = async (request, { params }) => {
  try {
    await connectToDB();

    const body = await request.json();
    const pagamento = await PagamentoNuovo.findById(params.id);

    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento non trovato" },
        { status: 404 }
      );
    }

    // Aggiorna campi
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        pagamento[key] = body[key];
      }
    });

    // Se cambia la data, aggiorna mese e anno
    if (body.data_pagamento) {
      const data = new Date(body.data_pagamento);
      pagamento.mese = data.getMonth() + 1;
      pagamento.anno = data.getFullYear();
    }

    await pagamento.save();

    return NextResponse.json(pagamento, { status: 200 });
  } catch (error) {
    console.error("Errore PATCH pagamento:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento del pagamento" },
      { status: 500 }
    );
  }
};

// DELETE - Elimina pagamento
export const DELETE = async (request, { params }) => {
  try {
    await connectToDB();

    const pagamento = await PagamentoNuovo.findById(params.id);

    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento non trovato" },
        { status: 404 }
      );
    }

    // Se è un'entrata, elimina anche le uscite generate
    if (pagamento.tipo === "entrata" && pagamento.uscite_generate_ids?.length > 0) {
      // Elimina uscite collegate
      await PagamentoNuovo.deleteMany({
        _id: { $in: pagamento.uscite_generate_ids }
      });

      // Aggiorna totali collaboratori (sottrae gli importi)
      for (const collab of pagamento.collaboratori) {
        await Collaboratore.findByIdAndUpdate(
          collab.collaboratore_id,
          {
            $inc: {
              guadagno_da_hoon: -collab.importo_calcolato,
              tot_fatturato: -collab.importo_calcolato
            }
          }
        );
      }
    }

    // Se è un'uscita manuale verso collaboratore, aggiorna totali
    if (
      pagamento.tipo === "uscita" &&
      !pagamento.generata_da_entrata &&
      pagamento.destinatario_tipo === "collaboratore"
    ) {
      await Collaboratore.findByIdAndUpdate(
        pagamento.destinatario_id,
        {
          $inc: {
            totale_fatture_terzi: -pagamento.importo,
            tot_fatturato: -pagamento.importo
          }
        }
      );
    }

    await PagamentoNuovo.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: "Pagamento eliminato con successo" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore DELETE pagamento:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione del pagamento" },
      { status: 500 }
    );
  }
};
