import PDFDocument from "pdfkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const isVisibleColor = (value) => Boolean(value && value !== "transparent");
const euro = (value) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
const date = (value) => value ? new Intl.DateTimeFormat("it-IT").format(new Date(value)) : "";

export function resolveQuoteVariables(text, quote, version) {
  const organization = quote.organization || {};
  const primary = organization.people?.find((person) => person.primary) || organization.people?.[0] || {};
  const values = {
    azienda: organization.tradingName || organization.businessName || "",
    referente: [primary.firstName, primary.lastName].filter(Boolean).join(" "),
    logo_cliente: organization.logoUrl || "",
    data_preventivo: date(quote.issuedAt),
    numero_preventivo: quote.number,
    descrizione_progetto: version.projectDescription || "",
    servizi: version.items?.map((item) => `- ${item.service}${item.description ? ` - ${item.description}` : ""}: ${euro(item.gross)}`).join("\n") || "",
    prezzo_totale: euro(version.totals?.gross),
    iva: euro(version.totals?.vat),
    condizioni_pagamento: version.paymentConditions || "",
  };
  return String(text || "").replace(/{{\s*([a-z_]+)\s*}}/g, (_match, key) => values[key] ?? "");
}

const collectPdf = (doc) => new Promise((resolve, reject) => {
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => resolve(Buffer.concat(chunks)));
  doc.on("error", reject);
});

function drawPath(doc, block, x, y, width, height) {
  if (block.shapeType === "ellipse") return doc.ellipse(x + width / 2, y + height / 2, width / 2, height / 2);
  if (Number(block.borderRadius) > 0) return doc.roundedRect(x, y, width, height, Number(block.borderRadius));
  return doc.rect(x, y, width, height);
}

function paintBox(doc, block, x, y, width, height) {
  const hasFill = isVisibleColor(block.background);
  const hasStroke = Number(block.borderWidth) > 0 && isVisibleColor(block.borderColor);
  if (!hasFill && !hasStroke) return;
  drawPath(doc, block, x, y, width, height);
  if (hasStroke) doc.lineWidth(Number(block.borderWidth)).strokeColor(block.borderColor);
  if (hasFill && hasStroke) doc.fillAndStroke(block.background, block.borderColor);
  else if (hasFill) doc.fill(block.background);
  else doc.stroke(block.borderColor);
}

function pdfFont(block) {
  const family = String(block.fontFamily || "Helvetica").toLowerCase();
  const bold = Number(block.fontWeight) >= 700;
  if (family.includes("times") || family.includes("georgia")) return bold ? "Times-Bold" : "Times-Roman";
  if (family.includes("courier")) return bold ? "Courier-Bold" : "Courier";
  return bold ? "Helvetica-Bold" : "Helvetica";
}

function imageOptions(block, width, height) {
  if (block.objectFit === "fill") return { width, height };
  if (block.objectFit === "cover") return { cover: [width, height], align: "center", valign: "center" };
  return { fit: [width, height], align: "center", valign: "center" };
}

async function drawBlock(doc, block, quote, version) {
  const x = Number(block.x) || 0;
  const y = Number(block.y) || 0;
  const width = Math.max(1, Number(block.width) || 100);
  const height = Math.max(1, Number(block.height) || 30);
  doc.save().opacity(Math.max(0, Math.min(1, Number(block.opacity ?? 1))));
  if (Number(block.rotation)) doc.rotate(Number(block.rotation), { origin: [x + width / 2, y + height / 2] });

  if (block.type === "shape") {
    paintBox(doc, block, x, y, width, height);
  } else if (block.type === "image" && block.imageUrl) {
    try {
      const source = String(block.imageUrl).startsWith("data:image/")
        ? Buffer.from(String(block.imageUrl).split(",")[1], "base64")
        : await readLocalPublicImage(block.imageUrl);
      if (source) doc.image(source, x, y, imageOptions(block, width, height));
    } catch {}
  } else if (block.type === "text") {
    paintBox(doc, block, x, y, width, height);
    const fontSize = Math.max(6, Number(block.fontSize) || 18);
    const lineHeight = Math.max(0.5, Number(block.lineHeight) || 1.2);
    doc
      .fillColor(block.color || "#111111")
      .font(pdfFont(block))
      .fontSize(fontSize)
      .text(resolveQuoteVariables(block.text, quote, version), x + 4, y + 4, {
        width: Math.max(1, width - 8),
        height: Math.max(1, height - 8),
        align: block.align || "left",
        ellipsis: true,
        lineGap: Math.max(0, fontSize * (lineHeight - 1)),
        characterSpacing: Number(block.letterSpacing) || 0,
      });
  }
  doc.restore();
}

async function readLocalPublicImage(imageUrl) {
  if (!String(imageUrl || "").startsWith("/")) return null;
  const publicRoot = path.resolve(process.cwd(), "public");
  const candidate = path.resolve(publicRoot, String(imageUrl).replace(/^\/+/, ""));
  if (!candidate.startsWith(`${publicRoot}${path.sep}`)) return null;
  try {
    return await readFile(candidate);
  } catch {
    return null;
  }
}

export async function renderCommercialQuotePdf(quote, version) {
  const doc = new PDFDocument({
    autoFirstPage: false,
    size: "A4",
    margin: 0,
    info: { Title: `${quote.number} - ${quote.organization?.businessName || "Cliente"}`, Author: "Hoon Srl" },
  });
  const done = collectPdf(doc);
  for (const page of version.pages || []) {
    doc.addPage({ size: "A4", margin: 0 });
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(page.background || "#ffffff");
    const backgroundImage = await readLocalPublicImage(page.backgroundImage);
    if (backgroundImage) {
      doc.save().opacity(Math.max(0, Math.min(1, Number(page.backgroundImageOpacity ?? 1))));
      doc.image(backgroundImage, 0, 0, { width: PAGE_WIDTH, height: PAGE_HEIGHT });
      doc.restore();
    }
    for (const block of (page.blocks || []).filter((item) => item.referenceMode && item.modified)) {
      doc.save()
        .fillColor(block.sourceMaskColor || "#ffffff")
        .rect(
          Number(block.sourceX ?? block.x) || 0,
          Number(block.sourceY ?? block.y) || 0,
          Math.max(1, Number(block.sourceWidth ?? block.width) || 1),
          Math.max(1, Number(block.sourceHeight ?? block.height) || 1)
        )
        .fill()
        .restore();
    }
    for (const block of [...(page.blocks || [])].filter((item) => !item.referenceMode || item.modified).sort((a, b) => (a.layer || 0) - (b.layer || 0))) {
      await drawBlock(doc, block, quote, version);
    }
  }
  doc.end();
  return done;
}
