import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import {
  HoonLabCustomer,
  HoonLabQuote
} from "@/models/HoonLab";
import { calculateDocumentTotals } from "@/lib/hoon-lab/calculations";
import { getNextDocumentNumber, snapshotCustomer, snapshotPriceList } from "@/lib/hoon-lab/documents";
import { buildQuoteLines, resolvePriceList } from "@/lib/hoon-lab/quote-lines";

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const customer = searchParams.get("customer");

    const filter = {
      ...(status ? { status } : {}),
      ...(customer ? { customer } : {})
    };

    const quotes = await HoonLabQuote.find(filter)
      .populate("customer", "name type email")
      .populate("priceList", "name customerType currency")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Errore preventivi Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento preventivi" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();

    if (!body.customer) {
      return NextResponse.json({ error: "Cliente obbligatorio" }, { status: 400 });
    }

    const customer = await HoonLabCustomer.findById(body.customer);
    if (!customer) {
      return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
    }

    const priceList = await resolvePriceList(customer, body.priceList);
    const lines = await buildQuoteLines(body.lines || [], priceList);
    const quoteDiscountType = body.quoteDiscountType || "none";
    const quoteDiscountValue = Number(body.quoteDiscountValue || 0);
    const totals = calculateDocumentTotals(lines, { quoteDiscountType, quoteDiscountValue });
    const number = await getNextDocumentNumber("quote", body.issueDate ? new Date(body.issueDate) : new Date());

    const quote = await HoonLabQuote.create({
      number,
      customer: customer._id,
      customerSnapshot: snapshotCustomer(customer),
      priceList: priceList?._id || null,
      priceListSnapshot: snapshotPriceList(priceList),
      status: body.status || "bozza",
      issueDate: body.issueDate || new Date(),
      validUntil: body.validUntil || null,
      lines: totals.lines,
      quoteDiscountType,
      quoteDiscountValue,
      quoteDiscountAmount: totals.quoteDiscountAmount,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      increaseTotal: totals.increaseTotal,
      total: totals.total,
      notes: body.notes || ""
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Errore creazione preventivo Hoon Lab:", error);
    return NextResponse.json({ error: error.message || "Errore creazione preventivo" }, { status: 500 });
  }
}
