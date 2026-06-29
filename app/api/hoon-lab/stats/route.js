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

function monthKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthName(monthIndex) {
  return new Intl.DateTimeFormat("it-IT", { month: "short" }).format(new Date(2026, monthIndex, 1));
}

function emptyPeriod(label, key = label) {
  return {
    key,
    label,
    quotes: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    quoteValue: 0,
    acceptedValue: 0,
    orderValue: 0,
    conversionRate: 0
  };
}

function applyQuoteToPeriod(period, quote) {
  const total = Number(quote.total || 0);
  period.quotes += 1;
  period.quoteValue += total;
  if (quote.status !== "bozza") period.sent += 1;
  if (["accettato", "convertito"].includes(quote.status)) {
    period.accepted += 1;
    period.acceptedValue += total;
  }
  if (quote.status === "rifiutato") period.rejected += 1;
}

function applyOrderToPeriod(period, order) {
  period.orderValue += Number(order.total || 0);
}

function finalizePeriod(period) {
  return {
    ...period,
    conversionRate: period.sent ? period.accepted / period.sent : 0,
    averageQuoteValue: period.quotes ? period.quoteValue / period.quotes : 0
  };
}

function buildMonthlyAnalytics(quotes, orders) {
  const now = new Date();
  const months = [];

  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = monthKey(date);
    const previousDate = new Date(date.getFullYear() - 1, date.getMonth(), 1);
    const previousKey = monthKey(previousDate);
    months.push({
      ...emptyPeriod(`${monthName(date.getMonth())} ${date.getFullYear()}`, key),
      previousKey,
      previousAcceptedValue: 0,
      previousQuoteValue: 0
    });
  }

  const byKey = new Map(months.map((period) => [period.key, period]));
  const previousByKey = new Map(months.map((period) => [period.previousKey, period]));

  quotes.forEach((quote) => {
    const key = monthKey(quote.issueDate || quote.createdAt);
    const period = byKey.get(key);
    if (period) applyQuoteToPeriod(period, quote);

    const previousPeriod = previousByKey.get(key);
    if (previousPeriod) {
      const total = Number(quote.total || 0);
      previousPeriod.previousQuoteValue += total;
      if (["accettato", "convertito"].includes(quote.status)) previousPeriod.previousAcceptedValue += total;
    }
  });

  orders.forEach((order) => {
    const period = byKey.get(monthKey(order.issueDate || order.createdAt));
    if (period) applyOrderToPeriod(period, order);
  });

  return months.map((period) => {
    const finalized = finalizePeriod(period);
    return {
      ...finalized,
      acceptedDelta: finalized.previousAcceptedValue
        ? (finalized.acceptedValue - finalized.previousAcceptedValue) / finalized.previousAcceptedValue
        : null,
      quoteDelta: finalized.previousQuoteValue
        ? (finalized.quoteValue - finalized.previousQuoteValue) / finalized.previousQuoteValue
        : null
    };
  });
}

function buildAnnualAnalytics(quotes, orders) {
  const years = new Map();
  const ensureYear = (year) => {
    if (!years.has(year)) years.set(year, emptyPeriod(String(year), String(year)));
    return years.get(year);
  };

  quotes.forEach((quote) => applyQuoteToPeriod(ensureYear(new Date(quote.issueDate || quote.createdAt).getFullYear()), quote));
  orders.forEach((order) => applyOrderToPeriod(ensureYear(new Date(order.issueDate || order.createdAt).getFullYear()), order));

  return Array.from(years.values())
    .map(finalizePeriod)
    .sort((a, b) => Number(a.key) - Number(b.key));
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

    const monthly = buildMonthlyAnalytics(quotes, orders);
    const annual = buildAnnualAnalytics(quotes, orders);
    const currentMonth = monthly[monthly.length - 1] || emptyPeriod("Mese corrente");
    const previousMonth = monthly[monthly.length - 2] || emptyPeriod("Mese precedente");
    const currentYear = annual[annual.length - 1] || emptyPeriod("Anno corrente");
    const previousYear = annual[annual.length - 2] || emptyPeriod("Anno precedente");

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
        .slice(0, 10),
      analytics: {
        monthly,
        annual,
        comparisons: {
          currentMonth,
          previousMonth,
          currentYear,
          previousYear
        }
      }
    });
  } catch (error) {
    console.error("Errore statistiche Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento statistiche" }, { status: 500 });
  }
}
