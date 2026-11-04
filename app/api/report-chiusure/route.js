import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { requireAdminSession } from "@/lib/adminAuth";
import ReportChiusura from "@/models/ReportChiusura";
import { generaReportChiusura } from "@/lib/report-chiusure";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  await connectToDB();
  const reports = await ReportChiusura.find({})
    .select("-collaborazioniSnapshot -fileBuffer")
    .sort({ periodoFine: -1 })
    .lean();
  return NextResponse.json({ reports });
}

export async function POST(req) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  const { tipo } = await req.json().catch(() => ({}));
  if (!["mensile", "trimestrale"].includes(tipo)) {
    return NextResponse.json({ error: "Tipo report non valido" }, { status: 400 });
  }
  await connectToDB();
  const result = await generaReportChiusura(tipo);
  return NextResponse.json({ reportId: result.report._id, created: result.created });
}
