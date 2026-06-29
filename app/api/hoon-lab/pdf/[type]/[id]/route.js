import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import {
  HoonLabDeliveryNote,
  HoonLabOrderConfirmation,
  HoonLabQuote,
  HoonLabSettings
} from "@/models/HoonLab";
import { renderHoonLabPdf } from "@/lib/hoon-lab/pdf";

export const runtime = "nodejs";

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

    const [document, settings] = await Promise.all([
      Model.findById(id).lean(),
      HoonLabSettings.findOne({ key: "default" }).lean()
    ]);

    if (!document) return NextResponse.json({ error: "Documento non trovato" }, { status: 404 });

    const pdf = await renderHoonLabPdf({ type, document, settings });
    const disposition = searchParams.get("download") === "1" ? "attachment" : "inline";
    const filename = String(document.number || "documento").replace(/[^\w.-]+/g, "_");

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}.pdf"`
      }
    });
  } catch (error) {
    console.error("Errore PDF Hoon Lab:", error);
    return NextResponse.json({ error: "Errore generazione PDF" }, { status: 500 });
  }
}
