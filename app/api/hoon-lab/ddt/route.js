import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabCustomer, HoonLabDeliveryNote, HoonLabQuote } from "@/models/HoonLab";
import { getNextDocumentNumber, mapQuoteLinesToDeliveryLines, snapshotCustomer } from "@/lib/hoon-lab/documents";

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const customer = searchParams.get("customer");

    const notes = await HoonLabDeliveryNote.find({
      ...(status ? { status } : {}),
      ...(customer ? { customer } : {})
    })
      .populate("customer", "name type email")
      .populate("orderConfirmation", "number status")
      .populate("quote", "number status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Errore DDT Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento DDT" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    let customer;
    let quote = null;
    let lines = body.lines || [];

    if (body.quote) {
      quote = await HoonLabQuote.findById(body.quote);
      if (!quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 });
      if (!["accettato", "convertito"].includes(quote.status)) {
        return NextResponse.json({ error: "Il DDT da preventivo richiede stato accettato o convertito" }, { status: 409 });
      }
      customer = await HoonLabCustomer.findById(quote.customer);
      lines = lines.length ? lines : mapQuoteLinesToDeliveryLines(quote.lines);
    } else {
      if (!body.customer) return NextResponse.json({ error: "Cliente obbligatorio" }, { status: 400 });
      customer = await HoonLabCustomer.findById(body.customer);
    }

    if (!customer) return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });

    const customerSnapshot = quote?.customerSnapshot || snapshotCustomer(customer);
    const ddt = await HoonLabDeliveryNote.create({
      number: await getNextDocumentNumber("delivery_note", new Date()),
      quote: quote?._id || null,
      customer: customer._id,
      customerSnapshot,
      shippingAddressSnapshot: body.shippingAddress || customerSnapshot.shippingAddress || {},
      reason: body.reason || "Vendita",
      status: body.status || "emesso",
      issueDate: body.issueDate || new Date(),
      lines,
      notes: body.notes || ""
    });

    return NextResponse.json(ddt, { status: 201 });
  } catch (error) {
    console.error("Errore creazione DDT Hoon Lab:", error);
    return NextResponse.json({ error: "Errore creazione DDT" }, { status: 500 });
  }
}
