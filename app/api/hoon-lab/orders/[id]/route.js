import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HOON_LAB, HoonLabOrderConfirmation } from "@/models/HoonLab";

export async function PATCH(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json();
    const order = await HoonLabOrderConfirmation.findById(id);

    if (!order) return NextResponse.json({ error: "Ordine non trovato" }, { status: 404 });

    if (body.status !== undefined) {
      if (!HOON_LAB.ORDER_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Stato ordine non valido" }, { status: 400 });
      }
      order.status = body.status;
      order.statusChangedAt = new Date();
      if (body.status === "spedito" && !order.shippedAt) order.shippedAt = new Date();
      if (body.status === "consegnato" && !order.deliveredAt) order.deliveredAt = new Date();
    }

    if (body.paymentStatus !== undefined) {
      if (!HOON_LAB.PAYMENT_STATUSES.includes(body.paymentStatus)) {
        return NextResponse.json({ error: "Stato pagamento non valido" }, { status: 400 });
      }
      order.paymentStatus = body.paymentStatus;
    }

    if (body.paymentMethod !== undefined) {
      if (!HOON_LAB.PAYMENT_METHODS.includes(body.paymentMethod)) {
        return NextResponse.json({ error: "Metodo di pagamento non valido" }, { status: 400 });
      }
      order.paymentMethod = body.paymentMethod;
    }

    if (body.amountPaid !== undefined) order.amountPaid = Math.max(0, Number(body.amountPaid || 0));
    if (body.paymentNotes !== undefined) order.paymentNotes = String(body.paymentNotes || "").trim();

    if (order.paymentStatus === "pagato") order.amountPaid = Number(order.total || 0);
    if (order.paymentStatus === "non_pagato") order.amountPaid = 0;
    if (order.paymentStatus !== "non_pagato" && !order.paymentMethod) {
      return NextResponse.json({ error: "Seleziona come e stato effettuato il pagamento" }, { status: 400 });
    }
    if (order.paymentStatus === "acconto") {
      const total = Number(order.total || 0);
      const taxableAmount = Number(order.taxableAmount ?? total);
      if (Number(order.amountPaid || 0) <= 0 || Number(order.amountPaid || 0) > taxableAmount) {
        return NextResponse.json({ error: "L'acconto deve essere maggiore di zero e non puo superare l'imponibile IVA esclusa" }, { status: 400 });
      }
    }

    order.balanceDue = Math.max(0, Number(order.total || 0) - Number(order.amountPaid || 0));
    order.paidAt = order.paymentStatus === "pagato" ? (order.paidAt || new Date()) : null;
    await order.save();
    return NextResponse.json(order);
  } catch (error) {
    console.error("Errore aggiornamento ordine Hoon Lab:", error);
    return NextResponse.json({ error: error.message || "Errore aggiornamento ordine" }, { status: 500 });
  }
}
