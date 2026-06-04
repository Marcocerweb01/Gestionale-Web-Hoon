import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabQuote } from "@/models/HoonLab";
import { calculateDocumentTotals } from "@/lib/hoon-lab/calculations";

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
    if (quote.status === "convertito") {
      return NextResponse.json({ error: "Un preventivo convertito non puo essere modificato" }, { status: 409 });
    }

    if (body.status === "rifiutato" && !String(body.rejectionReason || quote.rejectionReason || "").trim()) {
      return NextResponse.json({ error: "Inserisci il motivo del rifiuto" }, { status: 400 });
    }

    if (body.lines || body.quoteDiscountType !== undefined || body.quoteDiscountValue !== undefined) {
      const quoteDiscountType = body.quoteDiscountType || quote.quoteDiscountType || "none";
      const quoteDiscountValue = Number(body.quoteDiscountValue ?? quote.quoteDiscountValue ?? 0);
      const totals = calculateDocumentTotals(body.lines || quote.lines, { quoteDiscountType, quoteDiscountValue });
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
