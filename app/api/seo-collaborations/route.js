import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import CollaborazioneSeo from "@/models/CollaborazioneSeo";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  const isAdmin = session.user.role === "amministratore";
  const isSeo = session.user.role === "collaboratore" && (session.user.subRoles || []).some((role) => role.toLowerCase() === "seo");
  if (!isAdmin && !isSeo) return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  await connectToDB();
  const { searchParams } = new URL(req.url);
  const query = { archiviata: searchParams.get("archived") === "true" };
  if (isAdmin && searchParams.get("collaborator")) query.seo = searchParams.get("collaborator");
  if (!isAdmin) query.seo = session.user.id;
  const rows = await CollaborazioneSeo.find(query).populate("seo", "nome cognome").populate("webDesigner", "nome cognome").sort({ updatedAt: -1 }).lean();
  return NextResponse.json(rows.map((row) => ({ ...row, percentuale: row.checklist.length ? Math.round(row.checklist.filter((item) => item.completata).length / row.checklist.length * 100) : 0 })));
}
