import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import {
  HoonLabDeliveryNote,
  HoonLabOrderConfirmation,
  HoonLabPdfTemplate,
  HoonLabQuote
} from "@/models/HoonLab";
import { renderPdfHtml } from "@/lib/hoon-lab/templates";

const MODEL_BY_TYPE = {
  quote: HoonLabQuote,
  order_confirmation: HoonLabOrderConfirmation,
  delivery_note: HoonLabDeliveryNote
};

export async function GET(req, { params }) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const { type, id } = await params;
    const Model = MODEL_BY_TYPE[type];

    if (!Model) return NextResponse.json({ error: "Tipo documento non valido" }, { status: 400 });

    const [document, template] = await Promise.all([
      Model.findById(id).lean(),
      HoonLabPdfTemplate.findOne({ type, active: true }).sort({ updatedAt: -1 }).lean()
    ]);

    if (!document) return NextResponse.json({ error: "Documento non trovato" }, { status: 404 });

    const html = renderPdfHtml({ type, document, template });
    const disposition = searchParams.get("download") === "1" ? "attachment" : "inline";
    const filename = String(document.number || "documento").replace(/[^\w.-]+/g, "_");

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `${disposition}; filename="${filename}.html"`
      }
    });
  } catch (error) {
    console.error("Errore PDF Hoon Lab:", error);
    return NextResponse.json({ error: "Errore generazione PDF" }, { status: 500 });
  }
}
