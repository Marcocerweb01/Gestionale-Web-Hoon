import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabDeliveryNote, HoonLabOrderConfirmation, HoonLabQuote } from "@/models/HoonLab";

const EXPORT_TYPES = ["quotes", "quote-lines", "orders", "ddt", "sold-products", "customers-report"];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("it-IT") : "";
}

function buildDateFilter(searchParams) {
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

function appendCommonFilters(searchParams) {
  const customer = searchParams.get("customer");
  const status = searchParams.get("status");
  const customerType = searchParams.get("customerType");

  return {
    ...(customer ? { customer } : {}),
    ...(status ? { status } : {}),
    ...(customerType ? { "customerSnapshot.type": customerType } : {})
  };
}

function setupSheet(workbook, name, columns) {
  const worksheet = workbook.addWorksheet(name);
  worksheet.columns = columns.map((column) => ({ header: column, key: column, width: Math.max(14, column.length + 4) }));
  worksheet.getRow(1).font = { bold: true };
  return worksheet;
}

export async function GET(req, { params }) {
  try {
    await connectToDB();
    const { type } = await params;
    const { searchParams } = new URL(req.url);

    if (!EXPORT_TYPES.includes(type)) {
      return NextResponse.json({ error: "Tipo export non valido" }, { status: 400 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Hoon Lab";
    workbook.created = new Date();
    const filter = { ...buildDateFilter(searchParams), ...appendCommonFilters(searchParams) };

    if (type === "quotes") {
      const sheet = setupSheet(workbook, "Preventivi", ["Numero", "Data", "Cliente", "Tipo cliente", "Stato", "Subtotale", "Sconti", "Aumenti", "Totale"]);
      const quotes = await HoonLabQuote.find(filter).sort({ issueDate: -1 }).lean();
      quotes.forEach((quote) => sheet.addRow({
        Numero: quote.number,
        Data: formatDate(quote.issueDate),
        Cliente: quote.customerSnapshot?.name || "",
        "Tipo cliente": quote.customerSnapshot?.type || "",
        Stato: quote.status,
        Subtotale: quote.subtotal,
        Sconti: quote.discountTotal,
        Aumenti: quote.increaseTotal,
        Totale: quote.total
      }));
    }

    if (type === "quote-lines") {
      const sheet = setupSheet(workbook, "Righe preventivo", ["Preventivo", "Data", "Cliente", "Prodotto", "Quantita", "Prezzo", "Sconto", "Aumento", "Totale", "Note"]);
      const quotes = await HoonLabQuote.find(filter).sort({ issueDate: -1 }).lean();
      quotes.forEach((quote) => (quote.lines || []).forEach((line) => sheet.addRow({
        Preventivo: quote.number,
        Data: formatDate(quote.issueDate),
        Cliente: quote.customerSnapshot?.name || "",
        Prodotto: line.description,
        Quantita: line.quantity,
        Prezzo: line.unitPrice,
        Sconto: line.lineDiscount,
        Aumento: line.lineIncrease,
        Totale: line.lineTotal,
        Note: line.notes
      })));
    }

    if (type === "orders") {
      const sheet = setupSheet(workbook, "Conferme ordine", ["Numero", "Data", "Cliente", "Tipo cliente", "Stato", "Preventivo", "Totale"]);
      const orders = await HoonLabOrderConfirmation.find(filter).populate("quote", "number").sort({ issueDate: -1 }).lean();
      orders.forEach((order) => sheet.addRow({
        Numero: order.number,
        Data: formatDate(order.issueDate),
        Cliente: order.customerSnapshot?.name || "",
        "Tipo cliente": order.customerSnapshot?.type || "",
        Stato: order.status,
        Preventivo: order.quote?.number || "",
        Totale: order.total
      }));
    }

    if (type === "ddt") {
      const sheet = setupSheet(workbook, "DDT", ["Numero", "Data", "Cliente", "Tipo cliente", "Stato", "Causale", "Righe", "Note"]);
      const notes = await HoonLabDeliveryNote.find(filter).sort({ issueDate: -1 }).lean();
      notes.forEach((note) => sheet.addRow({
        Numero: note.number,
        Data: formatDate(note.issueDate),
        Cliente: note.customerSnapshot?.name || "",
        "Tipo cliente": note.customerSnapshot?.type || "",
        Stato: note.status,
        Causale: note.reason,
        Righe: note.lines?.length || 0,
        Note: note.notes
      }));
    }

    if (type === "sold-products") {
      const sheet = setupSheet(workbook, "Prodotti venduti", ["Prodotto", "Quantita", "Totale"]);
      const orders = await HoonLabOrderConfirmation.find(filter).lean();
      const products = new Map();
      orders.forEach((order) => (order.lines || []).forEach((line) => {
        const key = line.productSnapshot?.name || line.description;
        const row = products.get(key) || { product: key, quantity: 0, total: 0 };
        row.quantity += Number(line.quantity || 0);
        row.total += Number(line.lineTotal || 0);
        products.set(key, row);
      }));
      Array.from(products.values()).sort((a, b) => b.total - a.total).forEach((row) => sheet.addRow({
        Prodotto: row.product,
        Quantita: row.quantity,
        Totale: row.total
      }));
    }

    if (type === "customers-report") {
      const sheet = setupSheet(workbook, "Report clienti", ["Cliente", "Tipo cliente", "Preventivi", "Valore preventivi", "Valore accettato"]);
      const quotes = await HoonLabQuote.find(filter).lean();
      const customers = new Map();
      quotes.forEach((quote) => {
        const key = quote.customer?.toString() || quote.customerSnapshot?.name || "n/a";
        const row = customers.get(key) || {
          customer: quote.customerSnapshot?.name || "",
          type: quote.customerSnapshot?.type || "",
          quotes: 0,
          total: 0,
          accepted: 0
        };
        row.quotes += 1;
        row.total += Number(quote.total || 0);
        if (["accettato", "convertito"].includes(quote.status)) row.accepted += Number(quote.total || 0);
        customers.set(key, row);
      });
      Array.from(customers.values()).sort((a, b) => b.accepted - a.accepted).forEach((row) => sheet.addRow({
        Cliente: row.customer,
        "Tipo cliente": row.type,
        Preventivi: row.quotes,
        "Valore preventivi": row.total,
        "Valore accettato": row.accepted
      }));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hoon-lab-${type}-${new Date().toISOString().slice(0, 10)}.xlsx"`
      }
    });
  } catch (error) {
    console.error("Errore export Hoon Lab:", error);
    return NextResponse.json({ error: "Errore export Excel" }, { status: 500 });
  }
}
