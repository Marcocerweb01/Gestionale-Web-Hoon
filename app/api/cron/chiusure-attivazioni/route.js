import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { processaEventiScaduti } from "@/lib/chiusure-attivazioni";

async function process(request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const isVercelCron = process.env.VERCEL === "1" && request.headers.get("x-vercel-cron") === "1";
  const hasCronSecret = Boolean(process.env.CRON_SECRET) && bearer === process.env.CRON_SECRET;
  if (!isVercelCron && !hasCronSecret) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await connectToDB();
  const result = await processaEventiScaduti();
  return NextResponse.json(result);
}

export const GET = process;
export const POST = process;
