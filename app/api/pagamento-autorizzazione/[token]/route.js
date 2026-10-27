import { NextResponse } from "next/server";
import { hashPublicToken } from "@/lib/commerciale/core";
import { assertStripeTestMode, getStripe } from "@/lib/commerciale/stripe";
import { PaymentPlan } from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const addMonths = (value, months) => {
  const result = new Date(value || Date.now());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
};

async function findPlan(token) {
  if (!token || token.length < 32 || token.length > 200) return null;
  return PaymentPlan.findOne({
    publicTokenHash: hashPublicToken(token),
    publicTokenRevokedAt: null,
    publicTokenExpiresAt: { $gt: new Date() },
  })
    .populate("organization", "businessName tradingName administrativeEmail people")
    .populate("quote", "number versions acceptedVersion")
    .populate("contract", "signatureStatus startsAt endsAt")
    .lean();
}

function publicPayload(plan) {
  const version = plan.quote?.versions?.find((item) => item.version === plan.quoteVersion);
  return {
    id: plan._id,
    company: plan.organization?.tradingName || plan.organization?.businessName,
    quoteNumber: plan.quote?.number,
    serviceName: plan.serviceName,
    type: plan.type,
    amount: plan.amount,
    vatRate: plan.vatRate,
    currency: plan.currency,
    startsAt: plan.startsAt,
    durationMonths: plan.durationMonths,
    billingDay: plan.billingDay,
    autoRenewal: plan.autoRenewal,
    firstPeriodAmount: plan.firstPeriodAmount,
    firstPeriodMonths: plan.firstPeriodMonths,
    installments: plan.installments,
    renewal: plan.renewal,
    conditionsVersion: plan.conditionsVersion,
    conditionsText: plan.conditionsText,
    services: version?.items?.map((item) => ({ service: item.service, description: item.description, quantity: item.quantity, gross: item.gross, periodicity: item.periodicity })) || [],
    status: plan.status,
    expiresAt: plan.publicTokenExpiresAt,
  };
}

export async function GET(_req, { params }) {
  await connectToDB();
  const { token } = await params;
  const plan = await findPlan(token);
  if (!plan) return NextResponse.json({ error: "Link non valido, revocato o scaduto" }, { status: 404 });
  return NextResponse.json(publicPayload(plan), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req, { params }) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.accepted !== true) return NextResponse.json({ error: "Devi accettare le condizioni economiche" }, { status: 400 });
  await connectToDB();
  const plan = await findPlan(token);
  if (!plan) return NextResponse.json({ error: "Link non valido, revocato o scaduto" }, { status: 404 });

  try {
    assertStripeTestMode();
    const stripe = getStripe();
    const primary = plan.organization?.people?.find((person) => person.primary) || plan.organization?.people?.[0] || {};
    const email = plan.organization?.administrativeEmail || primary.email || undefined;
    let customerId = plan.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: plan.organization?.businessName,
        email,
        metadata: { commercialOrganizationId: String(plan.organization?._id), paymentPlanId: String(plan._id) },
      }, { idempotencyKey: `hoon-customer-${plan.organization?._id}` });
      customerId = customer.id;
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const unitAmount = Math.round(Number(plan.amount) * 100);
    const common = {
      customer: customerId,
      success_url: `${origin.replace(/\/$/, "")}/pagamenti/${token}?esito=ricevuto`,
      cancel_url: `${origin.replace(/\/$/, "")}/pagamenti/${token}?esito=annullato`,
      locale: "it",
      consent_collection: { terms_of_service: "required" },
      metadata: { paymentPlanId: String(plan._id), conditionsVersion: plan.conditionsVersion },
    };
    let sessionParams;

    if (plan.type === "subscription") {
      const firstAmount = plan.firstPeriodAmount != null ? Math.round(Number(plan.firstPeriodAmount) * 100) : unitAmount;
      if (firstAmount !== unitAmount && plan.firstPeriodMonths) {
        sessionParams = {
          ...common,
          mode: "setup",
          setup_intent_data: { metadata: { paymentPlanId: String(plan._id), createSubscriptionSchedule: "true" } },
        };
      } else {
        sessionParams = {
          ...common,
          mode: "subscription",
          line_items: [{ price_data: { currency: plan.currency, unit_amount: firstAmount, recurring: { interval: "month" }, product_data: { name: plan.serviceName } }, quantity: 1 }],
          subscription_data: { metadata: { paymentPlanId: String(plan._id) } },
        };
      }
    } else if (plan.type === "renewal") {
      const firstChargeAt = addMonths(plan.startsAt || Date.now(), plan.renewal?.firstChargeAfterMonths || 11);
      sessionParams = {
        ...common,
        mode: "subscription",
        payment_method_collection: "always",
        line_items: [{ price_data: { currency: plan.currency, unit_amount: unitAmount, recurring: { interval: "year" }, product_data: { name: plan.serviceName } }, quantity: 1 }],
        subscription_data: { trial_end: Math.max(Math.floor(Date.now() / 1000) + 3600, Math.floor(firstChargeAt.getTime() / 1000)), metadata: { paymentPlanId: String(plan._id) } },
      };
    } else {
      const first = plan.installments?.find((item) => item.status === "scheduled" && item.dueType !== "milestone");
      if (first) {
        sessionParams = {
          ...common,
          mode: "payment",
          line_items: [{ price_data: { currency: plan.currency, unit_amount: Math.round(Number(first.amount) * 100), product_data: { name: `${plan.serviceName} - ${first.label || "Prima rata"}` } }, quantity: 1 }],
          payment_intent_data: { setup_future_usage: "off_session", metadata: { paymentPlanId: String(plan._id), installmentId: String(first._id) } },
        };
      } else {
        sessionParams = { ...common, mode: "setup", setup_intent_data: { metadata: { paymentPlanId: String(plan._id) } } };
      }
    }

    const checkout = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey: `hoon-checkout-${plan._id}-${plan.conditionsVersion}-${plan.publicTokenHash.slice(0, 10)}` });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
    await PaymentPlan.findByIdAndUpdate(plan._id, {
      $set: {
        stripeCustomerId: customerId,
        stripeCheckoutSessionId: checkout.id,
        conditionsAcceptedAt: new Date(),
        conditionsAcceptedIp: ip.slice(0, 100),
      },
    });
    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("Errore creazione Stripe Checkout:", error);
    return NextResponse.json({ error: error.message || "Impossibile aprire Stripe" }, { status: 502 });
  }
}

