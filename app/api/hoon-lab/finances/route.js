import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabFinanceEntry, HoonLabQuote } from "@/models/HoonLab";

function atStartOfDay(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function atEndOfDay(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function defaultRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), 0, 1),
    to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  };
}

function previousRange(from, to) {
  const duration = to.getTime() - from.getTime() + 1;
  const previousTo = new Date(from.getTime() - 1);
  return { from: new Date(previousTo.getTime() - duration + 1), to: previousTo };
}

function isInside(date, from, to) {
  const time = new Date(date).getTime();
  return time >= from.getTime() && time <= to.getTime();
}

function recurringOccurrences(entry, from, to) {
  const start = new Date(entry.date);
  const end = entry.recurrenceEnd ? atEndOfDay(entry.recurrenceEnd) : to;
  const occurrences = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonth = new Date(Math.min(end.getTime(), to.getTime()));
  lastMonth.setDate(1);

  while (cursor <= lastMonth) {
    const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const occurrence = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(start.getDate(), lastDay), 12);
    if (occurrence >= start && occurrence <= end && isInside(occurrence, from, to)) {
      occurrences.push({
        _id: `${entry._id}:${occurrence.toISOString().slice(0, 7)}`,
        sourceId: entry._id,
        source: "manual",
        type: entry.type,
        description: entry.description,
        category: entry.category,
        amount: Number(entry.amount || 0),
        date: occurrence,
        recurring: true,
        recurrence: "monthly",
        recurrenceEnd: entry.recurrenceEnd,
        notes: entry.notes
      });
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return occurrences;
}

function quoteEntry(quote) {
  return {
    _id: `quote:${quote._id}`,
    sourceId: quote._id,
    source: "quote",
    type: "income",
    description: `Preventivo ${quote.number} - ${quote.customerSnapshot?.name || "Cliente"}`,
    category: "Preventivi accettati",
    amount: Number(quote.total || 0),
    date: quote.acceptedAt || quote.updatedAt || quote.issueDate,
    recurring: false,
    quoteNumber: quote.number
  };
}

function manualEntry(entry) {
  return {
    _id: entry._id,
    sourceId: entry._id,
    source: "manual",
    type: entry.type,
    description: entry.description,
    category: entry.category,
    amount: Number(entry.amount || 0),
    date: entry.date,
    recurring: false,
    recurrence: entry.recurrence,
    recurrenceEnd: entry.recurrenceEnd,
    notes: entry.notes
  };
}

function rangeEntries(quotes, manualEntries, from, to) {
  const accepted = quotes
    .map(quoteEntry)
    .filter((entry) => isInside(entry.date, from, to));

  const manual = manualEntries.flatMap((entry) => {
    if (entry.recurring && entry.recurrence === "monthly") return recurringOccurrences(entry, from, to);
    return isInside(entry.date, from, to) ? [manualEntry(entry)] : [];
  });

  return [...accepted, ...manual].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function summarize(entries) {
  const income = entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  return { income, expenses, balance: income - expenses, entries: entries.length };
}

function series(entries, from, to, group) {
  const buckets = new Map();
  let cursor = group === "year"
    ? new Date(from.getFullYear(), 0, 1)
    : new Date(from.getFullYear(), from.getMonth(), 1);

  while (cursor <= to) {
    const key = group === "year"
      ? String(cursor.getFullYear())
      : `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const label = group === "year"
      ? key
      : new Intl.DateTimeFormat("it-IT", { month: "short", year: "2-digit" }).format(cursor);
    buckets.set(key, { key, label, income: 0, expenses: 0, balance: 0 });
    cursor = group === "year"
      ? new Date(cursor.getFullYear() + 1, 0, 1)
      : new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const key = group === "year"
      ? String(date.getFullYear())
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) return;
    if (entry.type === "income") bucket.income += entry.amount;
    if (entry.type === "expense") bucket.expenses += entry.amount;
    bucket.balance = bucket.income - bucket.expenses;
  });

  return Array.from(buckets.values());
}

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const fallback = defaultRange();
    const from = searchParams.get("from") ? atStartOfDay(searchParams.get("from")) : fallback.from;
    const to = searchParams.get("to") ? atEndOfDay(searchParams.get("to")) : fallback.to;
    const group = searchParams.get("group") === "year" ? "year" : "month";
    if (from > to) return NextResponse.json({ error: "Intervallo date non valido" }, { status: 400 });

    const previous = previousRange(from, to);
    const earliest = previous.from < from ? previous.from : from;
    const [quotes, manualEntries] = await Promise.all([
      HoonLabQuote.find({ status: { $in: ["accettato", "convertito"] } }).lean(),
      HoonLabFinanceEntry.find({
        active: true,
        date: { $lte: to },
        $or: [{ recurrenceEnd: null }, { recurrenceEnd: { $gte: earliest } }]
      }).sort({ date: -1 }).lean()
    ]);

    const currentEntries = rangeEntries(quotes, manualEntries, from, to);
    const previousEntries = rangeEntries(quotes, manualEntries, previous.from, previous.to);
    const currentSummary = summarize(currentEntries);
    const previousSummary = summarize(previousEntries);

    return NextResponse.json({
      range: { from, to, group },
      current: {
        entries: currentEntries,
        summary: currentSummary,
        series: series(currentEntries, from, to, group)
      },
      previous: {
        range: previous,
        summary: previousSummary
      }
    });
  } catch (error) {
    console.error("Errore finanze Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento entrate e uscite" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    const type = body.type === "income" ? "income" : "expense";
    const description = String(body.description || "").trim();
    const amount = Number(body.amount);

    if (!description) return NextResponse.json({ error: "Descrizione obbligatoria" }, { status: 400 });
    if (!Number.isFinite(amount) || amount < 0) return NextResponse.json({ error: "Importo non valido" }, { status: 400 });
    if (body.recurring && type !== "expense") {
      return NextResponse.json({ error: "Solo le uscite possono essere ricorrenti" }, { status: 400 });
    }

    const entry = await HoonLabFinanceEntry.create({
      type,
      description,
      category: body.category || "",
      amount,
      date: body.date || new Date(),
      recurring: Boolean(body.recurring),
      recurrence: body.recurring ? "monthly" : "",
      recurrenceEnd: body.recurring && body.recurrenceEnd ? body.recurrenceEnd : null,
      notes: body.notes || ""
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Errore creazione movimento Hoon Lab:", error);
    return NextResponse.json({ error: error.message || "Errore creazione movimento" }, { status: 500 });
  }
}
