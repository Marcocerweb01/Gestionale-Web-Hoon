import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabOrderConfirmation, HoonLabQuote } from "@/models/HoonLab";

function dateFilter(searchParams) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from && !to) return {};
  return {
    issueDate: {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {})
    }
  };
}

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const baseFilter = dateFilter(searchParams);
    const customer = searchParams.get("customer");
    const customerType = searchParams.get("customerType");

    const quoteFilter = {
      ...baseFilter,
      ...(customer ? { customer } : {}),
      ...(customerType ? { "customerSnapshot.type": customerType } : {})
    };

    const quotes = await HoonLabQuote.find(quoteFilter).lean();
    const acceptedQuotes = quotes.filter((quote) => ["accettato", "convertito"].includes(quote.status));
    const sentOrFinalQuotes = quotes.filter((quote) => quote.status !== "bozza");

    const topCustomersMap = new Map();
    acceptedQuotes.forEach((quote) => {
      const key = quote.customerSnapshot?.name || "Cliente senza nome";
      topCustomersMap.set(key, (topCustomersMap.get(key) || 0) + Number(quote.total || 0));
    });

    const orderFilter = {
      ...baseFilter,
      ...(customer ? { customer } : {}),
      ...(customerType ? { "customerSnapshot.type": customerType } : {})
    };
    const orders = await HoonLabOrderConfirmation.find(orderFilter).lean();
    const productMap = new Map();

    orders.forEach((order) => {
      (order.lines || []).forEach((line) => {
        const key = line.productSnapshot?.name || line.description;
        const current = productMap.get(key) || { name: key, quantity: 0, total: 0 };
        current.quantity += Number(line.quantity || 0);
        current.total += Number(line.lineTotal || 0);
        productMap.set(key, current);
      });
    });

    const totalQuotesValue = quotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0);
    const acceptedValue = acceptedQuotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0);

    return NextResponse.json({
      quotesCreated: quotes.length,
      quotesTotalValue: totalQuotesValue,
      acceptedQuotesValue: acceptedValue,
      conversionRate: sentOrFinalQuotes.length ? acceptedQuotes.length / sentOrFinalQuotes.length : 0,
      averageQuoteValue: quotes.length ? totalQuotesValue / quotes.length : 0,
      totalDiscounts: quotes.reduce((sum, quote) => sum + Number(quote.discountTotal || 0), 0),
      totalIncreases: quotes.reduce((sum, quote) => sum + Number(quote.increaseTotal || 0), 0),
      topProducts: Array.from(productMap.values()).sort((a, b) => b.total - a.total).slice(0, 10),
      topCustomers: Array.from(topCustomersMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
    });
  } catch (error) {
    console.error("Errore statistiche Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento statistiche" }, { status: 500 });
  }
}
