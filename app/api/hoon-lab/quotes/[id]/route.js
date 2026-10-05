import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabCustomer, HoonLabQuote } from "@/models/HoonLab";
import { calculateDocumentTotals } from "@/lib/hoon-lab/calculations";
import { snapshotCustomer, snapshotPriceList } from "@/lib/hoon-lab/documents";
import { buildQuoteLines, resolvePriceList } from "@/lib/hoon-lab/quote-lines";

const EDITABLE_STATUSES = ["bozza", "inviato"];

export async function GET(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const quote = await HoonLabQuote.findById(id)
      .populate("customer", "name type email")
      .populate("priceList", "name customerType currency")
      .lean();

    if (!quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 });
    return NextResponse.json(quote);
  } catch (error) {
    console.error("Errore dettaglio preventivo Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento preventivo" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json();
    const quote = await HoonLabQuote.findById(id);

    if (!quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 });
    if (!EDITABLE_STATUSES.includes(quote.status)) {
      return NextResponse.json({ error: "Il preventivo non puo piu essere modificato dopo l'accettazione" }, { status: 409 });
    }

    if (body.status === "rifiutato" && !String(body.rejectionReason || quote.rejectionReason || "").trim()) {
      return NextResponse.json({ error: "Inserisci il motivo del rifiuto" }, { status: 400 });
    }

    let customer = null;
    if (body.customer !== undefined) {
      customer = await HoonLabCustomer.findById(body.customer);
      if (!customer) return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
      quote.customer = customer._id;
      quote.customerSnapshot = snapshotCustomer(customer);
    } else {
      customer = await HoonLabCustomer.findById(quote.customer);
    }

    let priceList = null;
    if (body.priceList !== undefined || body.lines) {
      priceList = await resolvePriceList(customer, body.priceList !== undefined ? body.priceList : quote.priceList);
      quote.priceList = priceList?._id || null;
      quote.priceListSnapshot = snapshotPriceList(priceList);
    }

    if (body.lines || body.quoteDiscountType !== undefined || body.quoteDiscountValue !== undefined) {
      const quoteDiscountType = body.quoteDiscountType || quote.quoteDiscountType || "none";
      const quoteDiscountValue = Number(body.quoteDiscountValue ?? quote.quoteDiscountValue ?? 0);
      const normalizedLines = body.lines
        ? await buildQuoteLines(body.lines, priceList)
        : quote.lines;
      const totals = calculateDocumentTotals(normalizedLines, { quoteDiscountType, quoteDiscountValue });
      quote.lines = totals.lines;
      quote.quoteDiscountType = quoteDiscountType;
      quote.quoteDiscountValue = quoteDiscountValue;
      quote.quoteDiscountAmount = totals.quoteDiscountAmount;
      quote.subtotal = totals.subtotal;
      quote.discountTotal = totals.discountTotal;
      quote.increaseTotal = totals.increaseTotal;
      quote.total = totals.total;
    }

    ["status", "validUntil", "issueDate", "notes", "quoteDiscountType", "quoteDiscountValue"].forEach((field) => {
      if (body[field] !== undefined) quote[field] = body[field];
    });

    if (body.rejectionReason !== undefined) {
      quote.rejectionReason = String(body.rejectionReason || "").trim();
    }

    if (body.status === "rifiutato") {
      quote.rejectedAt = new Date();
      quote.acceptedAt = null;
    }

    if (body.status === "accettato") {
      quote.acceptedAt = new Date();
      quote.rejectedAt = null;
      quote.rejectionReason = "";
    }

    await quote.save();
    return NextResponse.json(quote);
  } catch (error) {
    console.error("Errore update preventivo Hoon Lab:", error);
    return NextResponse.json({ error: "Errore aggiornamento preventivo" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const quote = await HoonLabQuote.findById(id);

    if (!quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 });
    if (!EDITABLE_STATUSES.includes(quote.status) || quote.convertedOrder) {
      return NextResponse.json({ error: "Il preventivo non puo piu essere eliminato dopo l'accettazione" }, { status: 409 });
    }

    await quote.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione preventivo Hoon Lab:", error);
    return NextResponse.json({ error: "Errore eliminazione preventivo" }, { status: 500 });
  }
}
