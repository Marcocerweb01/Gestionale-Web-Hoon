import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import { CommercialFile } from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";

export const runtime = "nodejs";

export async function GET(_req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "File non valido" }, { status: 400 });
  await connectToDB();
  const file = await CommercialFile.findById(id).select("+data").lean();
  if (!file) return NextResponse.json({ error: "File non trovato" }, { status: 404 });
  return new Response(file.data, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

