import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import { CommercialFile } from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedPurposes = new Set(["interview_source", "interview_attachment", "quote_source", "contract"]);
const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]);

export async function POST(req) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;

  const form = await req.formData();
  const file = form.get("file");
  const purpose = String(form.get("purpose") || "");
  if (!(file instanceof File) || !allowedPurposes.has(purpose)) {
    return NextResponse.json({ error: "File o destinazione non validi" }, { status: 400 });
  }
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Sono ammessi PDF, JPG, PNG e HEIC" }, { status: 415 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "Il file supera il limite di 12 MB" }, { status: 413 });
  }

  await connectToDB();
  const saved = await CommercialFile.create({
    filename: String(file.name || "documento").replace(/[\r\n]/g, " ").slice(0, 255),
    mimeType: file.type,
    size: file.size,
    purpose,
    data: Buffer.from(await file.arrayBuffer()),
    uploadedBy: auth.session.user.email,
  });
  return NextResponse.json({
    _id: saved._id,
    filename: saved.filename,
    mimeType: saved.mimeType,
    size: saved.size,
    purpose: saved.purpose,
  }, { status: 201 });
}

