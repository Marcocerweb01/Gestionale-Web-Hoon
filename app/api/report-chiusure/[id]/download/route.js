import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { requireAdminSession } from "@/lib/adminAuth";
import ReportChiusura from "@/models/ReportChiusura";

export async function GET(req, { params }) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  await connectToDB();
  const { id } = await params;
  const report = await ReportChiusura.findById(id).select("+fileBuffer fileNome fileMimeType").lean();
  if (!report?.fileBuffer) return NextResponse.json({ error: "File non disponibile" }, { status: 404 });
  await ReportChiusura.updateOne({ _id: id, visionatoAt: null }, {
    $set: { visionatoAt: new Date(), visionatoDa: auth.session.user.id },
  });
  return new Response(Buffer.from(report.fileBuffer), {
    headers: {
      "Content-Type": report.fileMimeType,
      "Content-Disposition": `attachment; filename="${report.fileNome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
