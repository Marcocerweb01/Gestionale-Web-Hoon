import nodemailer from "nodemailer";
import NotificationDelivery from "@/models/NotificationDelivery";
import ReportChiusura from "@/models/ReportChiusura";

function createTransporter() {
  if (!process.env.EMAIL_PASS) return null;

  const port = Number(process.env.EMAIL_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function absoluteNotificationLink(path = "") {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return baseUrl ? `${baseUrl}${path.startsWith("/") ? path : `/${path}`}` : path;
}

function resendFrom() {
  return process.env.RESEND_FROM || "Gestionale Hoon <notifiche@hoonwebarea.it>";
}

async function emailAttachments(item) {
  if (!item.attachmentSnapshotId) return [];
  const report = await ReportChiusura.findById(item.attachmentSnapshotId).select("+fileBuffer fileNome").lean();
  if (!report?.fileBuffer) return [];
  return [{
    filename: item.attachmentFilename || report.fileNome || "report.xlsx",
    content: Buffer.from(report.fileBuffer).toString("base64"),
  }];
}

async function sendEmailWithResend(item, link) {
  const attachments = await emailAttachments(item);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom(),
      to: [item.target],
      subject: item.subject,
      text: `${item.message}${link ? `\n\nApri nel gestionale: ${link}` : ""}\n\nPuoi modificare queste email dal Centro notifiche.`,
      ...(attachments.length ? { attachments } : {}),
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Resend HTTP ${response.status}: ${result.message || result.name || "invio non riuscito"}`);
  }

  return result;
}

async function sendEmail(item) {
  const link = absoluteNotificationLink(item.link);
  if (process.env.RESEND_API_KEY) {
    return sendEmailWithResend(item, link);
  }

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error("Provider email non configurato: manca RESEND_API_KEY o EMAIL_PASS");
  }

  const attachments = (await emailAttachments(item)).map((attachment) => ({
    filename: attachment.filename,
    content: Buffer.from(attachment.content, "base64"),
  }));
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: item.target,
    subject: item.subject,
    text: `${item.message}${link ? `\n\nApri nel gestionale: ${link}` : ""}\n\nPuoi modificare queste email dal Centro notifiche.`,
    attachments,
  });
}

async function sendWhatsapp(item) {
  if (!process.env.OPENWA_BASE_URL || !process.env.OPENWA_API_KEY) {
    throw new Error("OpenWA non configurato");
  }

  const digits = item.target.replace(/\D/g, "");
  const link = absoluteNotificationLink(item.link);
  const response = await fetch(
    `${process.env.OPENWA_BASE_URL.replace(/\/$/, "")}/api/messages/sendText`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.OPENWA_API_KEY,
      },
      body: JSON.stringify({
        to: `${digits}@c.us`,
        content: `${item.message}${link ? `\n${link}` : ""}`,
      }),
    }
  );

  if (!response.ok) throw new Error(`OpenWA HTTP ${response.status}`);
}

export async function processNotificationDeliveries({ ids, limit = 50 } = {}) {
  const staleProcessingAt = new Date(Date.now() - 10 * 60 * 1000);
  const query = {
    $or: [
      { status: { $in: ["pending", "failed"] } },
      { status: "processing", processingAt: { $lte: staleProcessingAt } },
    ],
    attempts: { $lt: 3 },
  };
  if (ids?.length) query._id = { $in: ids };

  const results = [];

  for (let index = 0; index < limit; index += 1) {
    const delivery = await NotificationDelivery.findOneAndUpdate(
      query,
      {
        $set: { status: "processing", processingAt: new Date() },
        $inc: { attempts: 1 },
      },
      { sort: { createdAt: 1 }, new: true }
    );
    if (!delivery) break;

    try {
      if (delivery.channel === "email") await sendEmail(delivery);
      else await sendWhatsapp(delivery);
      delivery.status = "sent";
      delivery.sentAt = new Date();
      delivery.lastError = "";
    } catch (error) {
      delivery.status = "failed";
      delivery.lastError = error.message;
    }

    delivery.processingAt = null;
    await delivery.save();
    results.push({ id: delivery._id, status: delivery.status });
  }

  return results;
}
