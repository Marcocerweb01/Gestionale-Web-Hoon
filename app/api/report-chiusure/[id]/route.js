import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { requireAdminSession } from "@/lib/adminAuth";
import ReportChiusura from "@/models/ReportChiusura";

export async function GET(req, { params }) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  await connectToDB();
  const { id } = await params;
  const report = await ReportChiusura.findById(id).select("-fileBuffer").lean();
  if (!report) return NextResponse.json({ error: "Report non trovato" }, { status: 404 });
  if (!report.visionatoAt) {
    await ReportChiusura.updateOne({ _id: id, visionatoAt: null }, {
      $set: { visionatoAt: new Date(), visionatoDa: auth.session.user.id },
    });
  }
  return NextResponse.json({ report });
}
