import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import { processNotificationDeliveries } from "@/lib/notification-delivery";

async function processDeliveries(req) {
  const session = await getServerSession(authOptions);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const isVercelCron = process.env.VERCEL === "1" && req.headers.get("x-vercel-cron") === "1";
  const hasCronSecret = Boolean(process.env.CRON_SECRET) && bearer === process.env.CRON_SECRET;
  if (session?.user?.role !== "amministratore" && !isVercelCron && !hasCronSecret) {
    return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  }
  await connectToDB();
  const results = await processNotificationDeliveries();
  return NextResponse.json({ processed: results.length, results });
}

export const GET = processDeliveries;
export const POST = processDeliveries;
