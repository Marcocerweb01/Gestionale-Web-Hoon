import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabPdfTemplate } from "@/models/HoonLab";
import { DEFAULT_PDF_CSS, DEFAULT_PDF_TEMPLATES } from "@/lib/hoon-lab/templates";

export async function GET() {
  try {
    await connectToDB();
    const templates = await HoonLabPdfTemplate.find({}).sort({ type: 1, createdAt: -1 }).lean();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Errore template Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento template" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();

    if (!body.type || !body.name) {
      return NextResponse.json({ error: "Tipo e nome template obbligatori" }, { status: 400 });
    }

    const base = DEFAULT_PDF_TEMPLATES[body.type];
    const template = await HoonLabPdfTemplate.create({
      type: body.type,
      name: body.name,
      html: body.html || base?.html || "",
      css: body.css || DEFAULT_PDF_CSS,
      active: body.active !== false
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Errore creazione template Hoon Lab:", error);
    return NextResponse.json({ error: "Errore creazione template" }, { status: 500 });
  }
}
