import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

const DEFAULT_SETTINGS = {
  companyName: "Hoon Srl",
  companyHeader: "Hoon Srl\nVia Buon Pastore 9 d\n01100 Viterbo (VT)\nTel. 3760361046 / Fax\nwww.hoonlab.it / info@hoonlab.it\nP.IVA 02338800564 - Cod. Fiscale 02338800564",
  quoteNoteTitle: "NOTA PREVENTIVO",
  quoteNote: "Per l’avvio dell’ordine è richiesto un acconto pari al 50% dell’importo totale. Il restante 50% dovrà essere saldato prima della consegna della merce"
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("it-IT").format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function safeText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function customerRows(customer = {}) {
  const address = customer.billingAddress?.address || "";

  if (customer.type === "privato") {
    return [
      ["Nome e cognome", customer.name],
      ["Via", address],
      ["Codice fiscale", customer.taxCode]
    ];
  }

  if (customer.type === "team") {
    return [
      ["Nome", customer.name],
      ["Partita IVA", customer.vatNumber]
    ];
  }

  return [
    ["Ragione sociale", customer.name],
    ["Via", address],
    ["Partita IVA", customer.vatNumber]
  ];
}

function collectPdf(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function drawLogo(doc) {
  const logoPath = path.join(process.cwd(), "public", "Hoon_lab_black.png");
  if (fs.existsSync(logoPath)) {
    const logo = fs.readFileSync(logoPath).toString("base64");
    doc.image(`data:image/png;base64,${logo}`, 44, 36, { width: 170 });
    return;
  }

  doc.fontSize(18).font("Helvetica-Bold").text("Hoon Lab", 44, 44);
}

function drawCompanyHeader(doc, settings) {
  doc
    .font("Helvetica")
    .fontSize(7.6)
    .fillColor("#222")
    .text(settings.companyHeader || DEFAULT_SETTINGS.companyHeader, 44, 82, {
      width: 245,
      lineGap: 1.1
    });
}

function drawTitle(doc, type, document) {
  const labels = {
    quote: "Preventivo",
    order_confirmation: "Conferma d'ordine",
    delivery_note: "Documento di trasporto"
  };

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#555")
    .text(labels[type] || "Documento", 350, 42, { width: 200, align: "right" });
  doc
    .fontSize(22)
    .fillColor("#111")
    .text(safeText(document.number), 350, 58, { width: 200, align: "right" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#333")
    .text(`Data: ${formatDate(document.issueDate)}`, 350, 84, { width: 200, align: "right" });
}

function drawHeader(doc, type, document, settings) {
  drawLogo(doc);
  drawCompanyHeader(doc, settings);
  drawTitle(doc, type, document);
  doc.moveTo(44, 140).lineTo(551, 140).lineWidth(1.4).strokeColor("#111").stroke();
}

function drawInfoBox(doc, x, y, width, title, rows) {
  doc.roundedRect(x, y, width, 108, 4).lineWidth(0.8).strokeColor("#111").stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111").text(title.toUpperCase(), x + 12, y + 12);

  let currentY = y + 32;
  rows.forEach(([label, value]) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#555").text(label, x + 12, currentY, { width: 92 });
    doc.font("Helvetica").fontSize(9).fillColor("#111").text(safeText(value), x + 108, currentY, { width: width - 120 });
    currentY += 17;
  });
}

function drawCell(doc, text, x, y, width, height, options = {}) {
  doc.rect(x, y, width, height).lineWidth(0.5).strokeColor("#111").stroke();
  doc
    .font(options.bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(options.size || 8.5)
    .fillColor(options.color || "#111")
    .text(safeText(text, ""), x + 5, y + 7, {
      width: width - 10,
      align: options.align || "left",
      lineGap: 1
    });
}

function ensureSpace(doc, y, needed = 80) {
  if (y + needed <= 800) return y;
  doc.addPage();
  return 44;
}

function drawRowsTable(doc, document, withPrices, startY) {
  const columns = withPrices
    ? [
      ["Descrizione", 246],
      ["Qta", 52],
      ["Prezzo unit.", 92],
      ["Totale", 92]
    ]
    : [
      ["Prodotto", 270],
      ["Qta", 58],
      ["Unita", 70],
      ["Note", 84]
    ];
  const tableX = 56;
  let y = startY;

  doc.rect(tableX, y, 482, 24).fillColor("#111").fill();
  let x = tableX;
  columns.forEach(([label, width]) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#fff").text(label.toUpperCase(), x + 5, y + 8, {
      width: width - 10,
      align: label === "Descrizione" || label === "Prodotto" || label === "Note" ? "left" : "right"
    });
    x += width;
  });
  y += 24;

  (document.lines || []).forEach((line) => {
    y = ensureSpace(doc, y, 58);
    const description = [
      line.productSnapshot?.sku ? `${line.productSnapshot.sku}` : "",
      line.description || "",
      line.notes ? `Note: ${line.notes}` : ""
    ].filter(Boolean).join("\n");
    const rowHeight = Math.max(42, doc.heightOfString(description, { width: columns[0][1] - 10 }) + 18);
    x = tableX;

    if (withPrices) {
      drawCell(doc, description, x, y, columns[0][1], rowHeight);
      x += columns[0][1];
      drawCell(doc, line.quantity || 0, x, y, columns[1][1], rowHeight, { align: "right" });
      x += columns[1][1];
      drawCell(doc, formatCurrency(line.unitPrice), x, y, columns[2][1], rowHeight, { align: "right" });
      x += columns[2][1];
      drawCell(doc, formatCurrency(line.lineTotal), x, y, columns[3][1], rowHeight, { align: "right", bold: true });
    } else {
      drawCell(doc, description, x, y, columns[0][1], rowHeight);
      x += columns[0][1];
      drawCell(doc, line.quantity || 0, x, y, columns[1][1], rowHeight, { align: "right" });
      x += columns[1][1];
      drawCell(doc, line.unit || "pz", x, y, columns[2][1], rowHeight);
      x += columns[2][1];
      drawCell(doc, line.notes || "", x, y, columns[3][1], rowHeight);
    }

    y += rowHeight;
  });

  return y + 18;
}

function drawTotals(doc, document, y) {
  y = ensureSpace(doc, y, 110);
  const x = 338;
  const rows = [
    ["Subtotale", formatCurrency(document.subtotal)],
    ["Sconti", formatCurrency(document.discountTotal)],
    ["Aumenti", formatCurrency(document.increaseTotal)],
    ["Totale", formatCurrency(document.total)]
  ];

  rows.forEach(([label, value], index) => {
    const isTotal = index === rows.length - 1;
    if (isTotal) doc.rect(x, y, 200, 24).fillColor("#111").fill();
    drawCell(doc, label, x, y, 96, 24, { bold: true, color: isTotal ? "#fff" : "#111" });
    drawCell(doc, value, x + 96, y, 104, 24, { align: "right", bold: true, color: isTotal ? "#fff" : "#111" });
    y += 24;
  });

  return y + 18;
}

function drawNoteBox(doc, title, notes, y, minHeight = 54) {
  if (!notes) return y;
  const textHeight = doc.heightOfString(notes, { width: 458, lineGap: 1.4 });
  const boxHeight = Math.max(minHeight, textHeight + 22);
  y = ensureSpace(doc, y, boxHeight + 34);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#111").text(title, 56, y);
  doc.roundedRect(56, y + 16, 482, boxHeight, 4).lineWidth(0.7).strokeColor("#111").stroke();
  doc.font("Helvetica").fontSize(8.8).fillColor("#111").text(notes, 68, y + 28, {
    width: 458,
    lineGap: 1.4
  });
  return y + boxHeight + 30;
}

export async function renderHoonLabPdf({ type, document, settings = DEFAULT_SETTINGS }) {
  const pdfSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const doc = new PDFDocument({
    size: "A4",
    margin: 44,
    bufferPages: true,
    info: {
      Title: safeText(document.number, "Documento Hoon Lab"),
      Author: pdfSettings.companyName || "Hoon Lab"
    }
  });
  const withPrices = type !== "delivery_note";

  drawHeader(doc, type, document, pdfSettings);
  drawInfoBox(doc, 56, 166, 236, "Cliente", customerRows(document.customerSnapshot || {}));

  const detailRows = type === "delivery_note"
    ? [
      ["Numero", document.number],
      ["Data", formatDate(document.issueDate)],
      ["Causale", document.reason],
      ["Destinazione", document.shippingAddressSnapshot?.address || document.customerSnapshot?.shippingAddress?.address || document.customerSnapshot?.billingAddress?.address]
    ]
    : [
      ["Numero", document.number],
      ["Data", formatDate(document.issueDate)],
      ["Valido fino al", formatDate(document.validUntil)],
      ["Totale", formatCurrency(document.total)]
    ];

  drawInfoBox(doc, 312, 166, 226, type === "delivery_note" ? "Dettagli DDT" : "Dettagli documento", detailRows);

  let y = drawRowsTable(doc, document, withPrices, 300);
  if (withPrices) y = drawTotals(doc, document, y);
  if (type === "quote") {
    y = drawNoteBox(doc, pdfSettings.quoteNoteTitle || "NOTA PREVENTIVO", pdfSettings.quoteNote, y, 62);
  }
  drawNoteBox(doc, "NOTE", document.notes, y);

  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i += 1) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(8).fillColor("#777").text(`Pagina ${i + 1} di ${pageCount}`, 44, 786, {
      width: 507,
      align: "center"
    });
  }

  return collectPdf(doc);
}
