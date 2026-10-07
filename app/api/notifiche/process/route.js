import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import NotificationDelivery from "@/models/NotificationDelivery";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (session?.user?.role !== "amministratore" && (!process.env.CRON_SECRET || bearer !== process.env.CRON_SECRET)) return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  await connectToDB();
  const deliveries = await NotificationDelivery.find({ status: { $in: ["pending", "failed"] }, attempts: { $lt: 3 } }).sort({ createdAt: 1 }).limit(50);
  const results = [];
  for (const delivery of deliveries) {
    try {
      delivery.attempts += 1;
      if (delivery.channel === "email") await sendEmail(delivery);
      else await sendWhatsapp(delivery);
      delivery.status = "sent"; delivery.sentAt = new Date(); delivery.lastError = "";
    } catch (error) { delivery.status = "failed"; delivery.lastError = error.message; }
    await delivery.save(); results.push({ id: delivery._id, status: delivery.status });
  }
  return NextResponse.json({ processed: results.length, results });
}

async function sendEmail(item) {
  if (!process.env.EMAIL_PASS) throw new Error("EMAIL_PASS non configurata");
  const transporter = nodemailer.createTransport({ host: process.env.EMAIL_HOST || "smtp.gmail.com", port: Number(process.env.EMAIL_PORT || 587), secure: Number(process.env.EMAIL_PORT) === 465, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to: item.target, subject: item.subject, text: `${item.message}${item.link ? `\n\n${process.env.NEXTAUTH_URL || ""}${item.link}` : ""}` });
}

async function sendWhatsapp(item) {
  if (!process.env.OPENWA_BASE_URL || !process.env.OPENWA_API_KEY) throw new Error("OpenWA non configurato");
  const digits = item.target.replace(/\D/g, "");
  const response = await fetch(`${process.env.OPENWA_BASE_URL.replace(/\/$/, "")}/api/messages/sendText`, { method: "POST", headers: { "Content-Type": "application/json", "X-API-Key": process.env.OPENWA_API_KEY }, body: JSON.stringify({ to: `${digits}@c.us`, content: `${item.message}${item.link ? `\n${process.env.NEXTAUTH_URL || ""}${item.link}` : ""}` }) });
  if (!response.ok) throw new Error(`OpenWA HTTP ${response.status}`);
}
