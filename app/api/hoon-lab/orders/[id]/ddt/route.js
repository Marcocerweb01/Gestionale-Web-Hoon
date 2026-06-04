import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabDeliveryNote, HoonLabOrderConfirmation } from "@/models/HoonLab";
import { getNextDocumentNumber, mapQuoteLinesToDeliveryLines } from "@/lib/hoon-lab/documents";

export async function POST(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const order = await HoonLabOrderConfirmation.findById(id);

    if (!order) return NextResponse.json({ error: "Ordine non trovato" }, { status: 404 });
    if (order.status === "ddt_generato") {
      return NextResponse.json({ error: "DDT gia generato per questo ordine" }, { status: 409 });
    }

    const ddt = await HoonLabDeliveryNote.create({
      number: await getNextDocumentNumber("delivery_note", new Date()),
      orderConfirmation: order._id,
      quote: order.quote || null,
      customer: order.customer,
      customerSnapshot: order.customerSnapshot,
      shippingAddressSnapshot: body.shippingAddress || order.customerSnapshot?.shippingAddress || {},
      reason: body.reason || "Vendita",
      status: body.status || "bozza",
      issueDate: body.issueDate || new Date(),
      lines: body.lines?.length ? body.lines : mapQuoteLinesToDeliveryLines(order.lines),
      notes: body.notes || ""
    });

    order.status = "ddt_generato";
    await order.save();

    return NextResponse.json(ddt, { status: 201 });
  } catch (error) {
    console.error("Errore generazione DDT da ordine Hoon Lab:", error);
    return NextResponse.json({ error: "Errore generazione DDT" }, { status: 500 });
  }
}
