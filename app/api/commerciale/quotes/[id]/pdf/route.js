import mongoose from "mongoose";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import { CommercialQuote } from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";

export const runtime = "nodejs";

const euro = (value) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
const date = (value) => value ? new Intl.DateTimeFormat("it-IT").format(new Date(value)) : "";

function resolveVariables(text, quote, version) {
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

function collectPdf(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function GET(req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Preventivo non valido" }, { status: 400 });
  await connectToDB();
  const quote = await CommercialQuote.findById(id).populate("organization").lean();
  if (!quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 });
  const requestedVersion = Number(new URL(req.url).searchParams.get("version")) || quote.currentVersion;
  const version = quote.versions.find((item) => item.version === requestedVersion);
  if (!version) return NextResponse.json({ error: "Versione non trovata" }, { status: 404 });

  const doc = new PDFDocument({ autoFirstPage: false, size: "A4", margin: 0, info: { Title: `${quote.number} - ${quote.organization?.businessName || "Cliente"}`, Author: "Hoon Srl" } });
  const done = collectPdf(doc);
  for (const page of version.pages || []) {
    doc.addPage({ size: "A4", margin: 0 });
    doc.rect(0, 0, 595.28, 841.89).fill(page.background || "#ffffff");
    for (const block of [...(page.blocks || [])].sort((a, b) => (a.layer || 0) - (b.layer || 0))) {
      const x = Number(block.x) || 0;
      const y = Number(block.y) || 0;
      const width = Math.max(1, Number(block.width) || 100);
      const height = Math.max(1, Number(block.height) || 30);
      if (block.type === "shape") {
        doc.save().fillColor(block.background || "#111111").rect(x, y, width, height).fill().restore();
      } else if (block.type === "image" && String(block.imageUrl || "").startsWith("data:image/")) {
        try {
          const raw = String(block.imageUrl).split(",")[1];
          doc.image(Buffer.from(raw, "base64"), x, y, { fit: [width, height], align: "center", valign: "center" });
        } catch {}
      } else if (block.type === "text") {
        if (block.background && block.background !== "transparent") doc.save().fillColor(block.background).rect(x, y, width, height).fill().restore();
        doc
          .save()
          .fillColor(block.color || "#111111")
          .font(block.fontWeight >= 700 ? "Helvetica-Bold" : "Helvetica")
          .fontSize(Math.max(6, Number(block.fontSize) || 18))
          .text(resolveVariables(block.text, quote, version), x + 4, y + 4, { width: width - 8, height: height - 8, align: block.align || "left", ellipsis: true })
          .restore();
      }
    }
  }
  doc.end();
  const buffer = await done;
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.number}-v${requestedVersion}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

