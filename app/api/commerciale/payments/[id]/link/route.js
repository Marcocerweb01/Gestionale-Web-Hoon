import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import { createPublicToken } from "@/lib/commerciale/core";
import { PaymentPlan } from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Piano non valido" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  await connectToDB();
  const plan = await PaymentPlan.findById(id).populate("contract").populate("quote");
  if (!plan) return NextResponse.json({ error: "Piano non trovato" }, { status: 404 });
  if (plan.contract?.signatureStatus !== "signed" || plan.quote?.status !== "accepted") {
    return NextResponse.json({ error: "Preventivo accettato e contratto firmato sono obbligatori" }, { status: 409 });
  }

  const { token, hash } = createPublicToken();
  const expiresInDays = Math.min(90, Math.max(1, Number(body.expiresInDays) || 14));
  plan.publicTokenHash = hash;
  plan.publicTokenExpiresAt = new Date(Date.now() + expiresInDays * 86400000);
  plan.publicTokenRevokedAt = null;
  plan.status = "awaiting_authorization";
  plan.approvedAt ||= new Date();
  plan.approvedBy ||= auth.session.user.email;
  if (body.conditionsText) plan.conditionsText = String(body.conditionsText).slice(0, 15000);
  await plan.save();

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  return NextResponse.json({
    url: `${origin.replace(/\/$/, "")}/pagamenti/${token}`,
    expiresAt: plan.publicTokenExpiresAt,
  });
}

export async function DELETE(_req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Piano non valido" }, { status: 400 });
  await connectToDB();
  const plan = await PaymentPlan.findByIdAndUpdate(id, { $set: { publicTokenRevokedAt: new Date() } }, { new: true });
  return plan ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Piano non trovato" }, { status: 404 });
}

