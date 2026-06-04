import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import {
  HoonLabCustomer,
  HoonLabPriceList,
  HoonLabPriceListItem,
  HoonLabProduct,
  HoonLabQuote
} from "@/models/HoonLab";
import { calculateDocumentTotals } from "@/lib/hoon-lab/calculations";
import { getNextDocumentNumber, snapshotCustomer, snapshotPriceList, snapshotProduct } from "@/lib/hoon-lab/documents";

async function resolvePriceList(customer, requestedPriceList) {
  if (requestedPriceList) {
    return HoonLabPriceList.findById(requestedPriceList);
  }

  if (customer.defaultPriceList) {
    return HoonLabPriceList.findById(customer.defaultPriceList);
  }

  return HoonLabPriceList.findOne({ active: true, customerType: customer.type }).sort({ createdAt: -1 });
}

async function buildQuoteLines(lines = [], priceList) {
  const productIds = lines.map((line) => line.product).filter(Boolean);
  const products = await HoonLabProduct.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const activePrices = priceList
    ? await HoonLabPriceListItem.find({
        priceList: priceList._id,
        product: { $in: productIds },
        validFrom: { $lte: new Date() },
        $or: [{ validTo: null }, { validTo: { $gte: new Date() } }]
      }).sort({ validFrom: -1 }).lean()
    : [];

  const priceMap = new Map();
  activePrices.forEach((item) => {
    const key = item.product.toString();
    if (!priceMap.has(key)) priceMap.set(key, item.price);
  });

  return lines.map((line, index) => {
    const product = line.product ? productMap.get(line.product) : null;
    const listPrice = product ? priceMap.get(product._id.toString()) : undefined;
    const hasManualPrice = line.unitPrice !== undefined && line.unitPrice !== null && line.unitPrice !== "";
    if (!product) {
      throw new Error("Prodotto non trovato in una riga del preventivo");
    }

    if (!hasManualPrice && listPrice === undefined) {
      throw new Error(`Manca il prezzo di listino per il prodotto "${product.name}"`);
    }

    const referencePrice = listPrice ?? 0;
    const unitPrice = hasManualPrice ? Number(line.unitPrice) : Number(listPrice);

    return {
      product: product._id,
      productSnapshot: snapshotProduct(product),
      description: line.description || product.name || "Riga preventivo",
      quantity: Number(line.quantity || 1),
      unit: line.unit || product.unit || "pz",
      unitPrice,
      manualUnitPrice: Boolean(line.manualUnitPrice || (hasManualPrice && Number(referencePrice) !== unitPrice)),
      discountType: line.discountType || "none",
      discountValue: Number(line.discountValue || 0),
      increaseType: line.increaseType || "none",
      increaseValue: Number(line.increaseValue || 0),
      notes: line.notes || "",
      sortOrder: line.sortOrder ?? index
    };
  });
}

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
