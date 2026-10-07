import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import CollaborazioneSeo from "@/models/CollaborazioneSeo";
import { isValidId } from "@/lib/eventi";
import { seoProgress } from "@/lib/seo-collaborations";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions); const { id } = await params;
  if (!session?.user || !isValidId(id)) return NextResponse.json({ message: "Richiesta non valida" }, { status: 400 });
  await connectToDB();
  const row = await CollaborazioneSeo.findById(id);
  if (!row) return NextResponse.json({ message: "Collaborazione SEO non trovata" }, { status: 404 });
  const allowed = session.user.role === "amministratore" || (session.user.role === "collaboratore" && String(row.seo) === String(session.user.id));
  if (!allowed) return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  const body = await req.json();
  if (Array.isArray(body.checklist)) row.checklist = row.checklist.map((item) => { const incoming = body.checklist.find((entry) => entry.key === item.key); return incoming ? { key: item.key, label: item.label, completata: Boolean(incoming.completata), note: String(incoming.note || "") } : item; });
  if (body.archiviata === true && seoProgress(row) !== 100) return NextResponse.json({ message: "Puoi archiviare solo una collaborazione completata al 100%" }, { status: 400 });
  if ("archiviata" in body) { row.archiviata = Boolean(body.archiviata); row.archiviataAt = row.archiviata ? new Date() : null; }
  await row.save();
  return NextResponse.json({ ...row.toObject(), percentuale: seoProgress(row) });
}
