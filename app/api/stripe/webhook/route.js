import { NextResponse } from "next/server";
import { getStripe } from "@/lib/commerciale/stripe";
import { PaymentPlan, PaymentTransaction, StripeWebhookEvent } from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";
import { notifyCommercialAdmin } from "@/lib/commerciale/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function planIdFromObject(object) {
  return object?.metadata?.paymentPlanId || object?.subscription_details?.metadata?.paymentPlanId || "";
}

export async function POST(req) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook non configurato" }, { status: 503 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Firma mancante" }, { status: 400 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: `Firma webhook non valida: ${error.message}` }, { status: 400 });
  }

  await connectToDB();
  try {
    try {
      await StripeWebhookEvent.create({
        eventId: event.id,
        type: event.type,
        stripeCreated: event.created,
        livemode: event.livemode,
      });
    } catch (error) {
      if (error?.code === 11000) return NextResponse.json({ received: true, duplicate: true });
      throw error;
    }

    const object = event.data.object;
    let plan = null;
    const planId = planIdFromObject(object);
    if (planId) plan = await PaymentPlan.findById(planId);
    if (!plan && object.customer) plan = await PaymentPlan.findOne({ stripeCustomerId: object.customer }).sort({ updatedAt: -1 });
    if (!plan && object.subscription) plan = await PaymentPlan.findOne({ stripeSubscriptionId: object.subscription });

    if (plan && event.created >= (plan.lastStripeEventCreated || 0)) {
      plan.lastStripeEventCreated = event.created;
      if (event.type === "checkout.session.completed") {
        plan.paymentMethodAuthorized = true;
        plan.stripeSubscriptionId = object.subscription || plan.stripeSubscriptionId;
        plan.status = object.payment_status === "paid" || object.mode === "setup" || object.mode === "subscription" ? "active" : "awaiting_authorization";
        if (
          object.mode === "setup" &&
          plan.type === "subscription" &&
          plan.firstPeriodAmount != null &&
          Number(plan.firstPeriodAmount) !== Number(plan.amount) &&
          !plan.stripeScheduleId
        ) {
          const stripe = getStripe();
          const setupIntent = await stripe.setupIntents.retrieve(object.setup_intent);
          const paymentMethod = setupIntent.payment_method;
          if (paymentMethod) {
            await stripe.customers.update(plan.stripeCustomerId, {
              invoice_settings: { default_payment_method: paymentMethod },
            });
          }
          const [promoPrice, standardPrice] = await Promise.all([
            stripe.prices.create({
              currency: plan.currency,
              unit_amount: Math.round(Number(plan.firstPeriodAmount) * 100),
              recurring: { interval: "month" },
              product_data: { name: `${plan.serviceName} - periodo iniziale` },
            }, { idempotencyKey: `hoon-price-promo-${plan._id}-${plan.firstPeriodAmount}` }),
            stripe.prices.create({
              currency: plan.currency,
              unit_amount: Math.round(Number(plan.amount) * 100),
              recurring: { interval: "month" },
              product_data: { name: plan.serviceName },
            }, { idempotencyKey: `hoon-price-standard-${plan._id}-${plan.amount}` }),
          ]);
          const schedule = await stripe.subscriptionSchedules.create({
            customer: plan.stripeCustomerId,
            start_date: "now",
            end_behavior: plan.autoRenewal ? "release" : "cancel",
            phases: [
              { items: [{ price: promoPrice.id, quantity: 1 }], iterations: Math.max(1, plan.firstPeriodMonths || 1), metadata: { paymentPlanId: String(plan._id) } },
              { items: [{ price: standardPrice.id, quantity: 1 }], metadata: { paymentPlanId: String(plan._id) } },
            ],
            metadata: { paymentPlanId: String(plan._id) },
          }, { idempotencyKey: `hoon-schedule-${plan._id}-${plan.conditionsVersion}` });
          plan.stripeScheduleId = schedule.id;
          plan.stripeSubscriptionId = schedule.subscription || plan.stripeSubscriptionId;
        }
      } else if (["payment_intent.succeeded", "invoice.paid"].includes(event.type)) {
        plan.status = "active";
        plan.paymentMethodAuthorized = true;
        plan.lastPaymentAt = new Date(event.created * 1000);
        plan.lastError = "";
        const installmentId = object.metadata?.installmentId;
        const installment = installmentId ? plan.installments.id(installmentId) : plan.installments.find((item) => item.status === "processing" || item.status === "scheduled");
        if (installment) { installment.status = "paid"; installment.paidAt = new Date(event.created * 1000); installment.stripePaymentIntentId = object.id; }
      } else if (["payment_intent.payment_failed", "invoice.payment_failed"].includes(event.type)) {
        plan.status = "past_due";
        plan.lastError = object.last_payment_error?.message || "Pagamento non riuscito";
      } else if (event.type === "customer.subscription.deleted") {
        plan.status = "cancelled";
      } else if (event.type === "customer.subscription.updated") {
        plan.stripeSubscriptionId = object.id;
        plan.status = ["active", "trialing"].includes(object.status) ? "active" : object.status === "past_due" ? "past_due" : plan.status;
      } else if (event.type === "subscription_schedule.updated") {
        plan.stripeScheduleId = object.id;
      }
      await plan.save();
      if (["payment_intent.succeeded", "invoice.paid"].includes(event.type)) {
        await notifyCommercialAdmin({ title: "Pagamento ricevuto", message: `${plan.serviceName}: Stripe ha confermato il pagamento.`, refId: `stripe-paid-${event.id}`, link: "/Commerciale" });
      }
      if (["payment_intent.payment_failed", "invoice.payment_failed"].includes(event.type)) {
        await notifyCommercialAdmin({ title: "Pagamento fallito", message: `${plan.serviceName}: verifica il pagamento non riuscito.`, refId: `stripe-failed-${event.id}`, link: "/Commerciale" });
      }
    }

    if (plan && ["payment_intent.succeeded", "payment_intent.payment_failed"].includes(event.type)) {
      await PaymentTransaction.findOneAndUpdate(
        { stripeObjectId: object.id },
        {
          $set: {
            paymentPlan: plan._id,
            organization: plan.organization,
            kind: "payment_intent",
            status: event.type === "payment_intent.succeeded" ? "paid" : "failed",
            amount: Number(object.amount_received || object.amount || 0) / 100,
            currency: object.currency || plan.currency,
            occurredAt: new Date(event.created * 1000),
            stripeEventId: event.id,
            failureMessage: object.last_payment_error?.message || "",
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
    }

    if (plan && ["invoice.paid", "invoice.payment_failed"].includes(event.type) && !object.payment_intent) {
      await PaymentTransaction.findOneAndUpdate(
        { stripeObjectId: object.id },
        {
          $set: {
            paymentPlan: plan._id,
            organization: plan.organization,
            kind: "invoice",
            status: event.type === "invoice.paid" ? "paid" : "failed",
            amount: Number(object.amount_paid || object.amount_due || 0) / 100,
            currency: object.currency || plan.currency,
            occurredAt: new Date(event.created * 1000),
            stripeEventId: event.id,
            failureMessage: event.type === "invoice.payment_failed" ? "Pagamento fattura non riuscito" : "",
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
    }

    await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { processedAt: new Date() } });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Errore webhook Stripe:", error);
    await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { error: error.message } }).catch(() => {});
    return NextResponse.json({ error: "Elaborazione webhook non riuscita" }, { status: 500 });
  }
}

