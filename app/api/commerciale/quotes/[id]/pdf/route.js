import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import { renderCommercialQuotePdf } from "@/lib/commerciale/quotePdf";
import { CommercialQuote } from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";

export const runtime = "nodejs";

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

  const buffer = await renderCommercialQuotePdf(quote, version);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.number}-v${requestedVersion}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

