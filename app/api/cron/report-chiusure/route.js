import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { generaReportChiusura, shouldGenerateClosingReports } from "@/lib/report-chiusure";

function romeNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour));
}

export async function POST(req) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET || bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }
  const now = romeNow();
  const closing = shouldGenerateClosingReports(now);
  if (!closing.isLastDay || now.getHours() !== 23) {
    return NextResponse.json({ skipped: true, reason: "Non è l'ultima ora dell'ultimo giorno del mese (Europe/Rome)" });
  }
  await connectToDB();
  const mensile = await generaReportChiusura("mensile", now);
  const trimestrale = closing.isQuarterEnd ? await generaReportChiusura("trimestrale", now) : null;
  return NextResponse.json({ mensile: String(mensile.report._id), trimestrale: trimestrale ? String(trimestrale.report._id) : null });
}
