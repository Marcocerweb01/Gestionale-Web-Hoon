import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import { calculateQuote, PIPELINE_STATES, sanitizeText } from "@/lib/commerciale/core";
import {
  CommercialOrganization,
  CommercialOpportunity,
  InterviewTemplate,
  Interview,
  QuoteTemplate,
  CommercialQuote,
  ManualContract,
  PaymentPlan,
} from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";
import { assertStripeTestMode, getStripe } from "@/lib/commerciale/stripe";
import { notifyCommercialAdmin } from "@/lib/commerciale/notifications";

export const dynamic = "force-dynamic";

const registry = {
  contacts: CommercialOrganization,
  opportunities: CommercialOpportunity,
  "interview-templates": InterviewTemplate,
  interviews: Interview,
  "quote-templates": QuoteTemplate,
  quotes: CommercialQuote,
  contracts: ManualContract,
  payments: PaymentPlan,
};

const blockedFields = new Set(["_id", "__v", "createdAt", "updatedAt", "stripeCustomerId", "stripeSubscriptionId", "stripeScheduleId", "publicTokenHash"]);

function safePatch(input) {
  return Object.fromEntries(Object.entries(input).filter(([key]) => !blockedFields.has(key)));
}

export async function GET(_req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const { resource, id } = await params;
  const Model = registry[resource];
  if (!Model || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Risorsa non valida" }, { status: 404 });
  await connectToDB();
  const record = await Model.findById(id).lean();
  return record ? NextResponse.json(record) : NextResponse.json({ error: "Record non trovato" }, { status: 404 });
}

export async function PATCH(req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const { resource, id } = await params;
  const Model = registry[resource];
  if (!Model || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Risorsa non valida" }, { status: 404 });
  const input = await req.json().catch(() => ({}));
  await connectToDB();

  try {
    if (resource === "opportunities" && input.action === "change_state") {
      if (!PIPELINE_STATES.includes(input.state)) return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
      if (input.state === "posticipato" && (!sanitizeText(input.reason) || !input.resumeAt)) {
        return NextResponse.json({ error: "Motivo e data di ripresa sono obbligatori" }, { status: 400 });
      }
      if (input.state === "rifiutato" && !sanitizeText(input.reason)) {
        return NextResponse.json({ error: "La motivazione del rifiuto è obbligatoria" }, { status: 400 });
      }
      const set = { state: input.state, stateChangedAt: new Date() };
      if (input.state === "posticipato") set.postponed = { reason: sanitizeText(input.reason), resumeAt: input.resumeAt };
      if (input.state === "rifiutato") set.rejectionReason = sanitizeText(input.reason);
      const updated = await CommercialOpportunity.findByIdAndUpdate(
        id,
        {
          $set: set,
          $push: { history: { state: input.state, at: new Date(), operatorEmail: auth.session.user.email, note: sanitizeText(input.note || input.reason) } },
        },
        { new: true, runValidators: true }
      ).populate("organization", "businessName tradingName");
      return NextResponse.json(updated);
    }

    if (resource === "quotes" && input.action === "save_version") {
      const quote = await CommercialQuote.findById(id);
      if (!quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 });
      const current = quote.versions.find((version) => version.version === quote.currentVersion);
      const pricing = calculateQuote(input.items || current?.items || []);
      const mustCreateVersion = current?.immutable || input.createNewVersion === true;
      if (mustCreateVersion) {
        const nextVersion = Math.max(0, ...quote.versions.map((version) => version.version)) + 1;
        quote.versions.push({
          version: nextVersion,
          createdBy: auth.session.user.email,
          reason: sanitizeText(input.reason || "Revisione"),
          pages: input.pages || current?.pages || [],
          items: pricing.items,
          totals: pricing.totals,
          projectDescription: sanitizeText(input.projectDescription ?? current?.projectDescription, 15000),
          paymentConditions: sanitizeText(input.paymentConditions ?? current?.paymentConditions, 10000),
        });
        quote.currentVersion = nextVersion;
        quote.status = "draft";
      } else {
        current.pages = input.pages || current.pages;
        current.items = pricing.items;
        current.totals = pricing.totals;
        current.projectDescription = sanitizeText(input.projectDescription ?? current.projectDescription, 15000);
        current.paymentConditions = sanitizeText(input.paymentConditions ?? current.paymentConditions, 10000);
      }
      await quote.save();
      return NextResponse.json(quote);
    }

    if (resource === "quotes" && input.action === "change_status") {
      const allowed = ["draft", "ready", "presented", "accepted", "rejected", "postponed", "archived"];
      if (!allowed.includes(input.status)) return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
      if (input.status === "rejected" && !sanitizeText(input.reason)) return NextResponse.json({ error: "Motivazione del rifiuto obbligatoria" }, { status: 400 });
      if (input.status === "postponed" && (!sanitizeText(input.reason) || !input.resumeAt)) return NextResponse.json({ error: "Motivo e data di ripresa obbligatori" }, { status: 400 });
      const quote = await CommercialQuote.findById(id);
      if (!quote) return NextResponse.json({ error: "Preventivo non trovato" }, { status: 404 });
      const version = quote.versions.find((item) => item.version === quote.currentVersion);
      if (["presented", "accepted"].includes(input.status) && version) {
        version.immutable = true;
        version.snapshotAt ||= new Date();
      }
      quote.status = input.status;
      if (input.status === "accepted") {
        quote.acceptedVersion = quote.currentVersion;
        quote.acceptedAt = new Date();
        await CommercialOpportunity.findByIdAndUpdate(quote.opportunity, {
          $set: { state: "accettato", stateChangedAt: new Date(), acceptedQuote: quote._id, acceptedQuoteVersion: quote.currentVersion, acceptedValue: version?.totals?.gross || 0 },
          $push: { history: { state: "accettato", at: new Date(), operatorEmail: auth.session.user.email, note: `Accettata versione ${quote.currentVersion}` } },
        });
        await notifyCommercialAdmin({ title: "Preventivo accettato", message: `${quote.number} versione ${quote.currentVersion} è stato accettato.`, refId: `quote-accepted-${quote._id}-${quote.currentVersion}`, link: "/Commerciale" });
      }
      if (input.status === "rejected") quote.rejectionReason = sanitizeText(input.reason);
      const opportunityState = {
        ready: "preventivo_pronto",
        presented: "preventivo_presentato",
        rejected: "rifiutato",
        postponed: "posticipato",
      }[input.status];
      if (opportunityState) {
        const extra = {};
        if (opportunityState === "rifiutato") extra.rejectionReason = sanitizeText(input.reason);
        if (opportunityState === "posticipato") extra.postponed = { reason: sanitizeText(input.reason), resumeAt: input.resumeAt };
        await CommercialOpportunity.findByIdAndUpdate(quote.opportunity, {
          $set: { state: opportunityState, stateChangedAt: new Date(), ...extra },
          $push: { history: { state: opportunityState, at: new Date(), operatorEmail: auth.session.user.email, note: sanitizeText(input.reason || `Preventivo ${input.status}`) } },
        });
      }
      await quote.save();
      return NextResponse.json(quote);
    }

    if (resource === "interviews" && input.status === "completed") {
      input.completedAt = new Date();
      await CommercialOpportunity.findByIdAndUpdate(input.opportunity, {
        $set: { state: "intervista_completata", stateChangedAt: new Date() },
        $push: { history: { state: "intervista_completata", at: new Date(), operatorEmail: auth.session.user.email, note: "Intervista completata" } },
      });
    }

    if (resource === "payments" && input.action === "confirm_installment") {
      const plan = await PaymentPlan.findById(id);
      const installment = plan?.installments?.id(input.installmentId);
      if (!plan || !installment) return NextResponse.json({ error: "Rata non trovata" }, { status: 404 });
      if (!plan.paymentMethodAuthorized || !plan.stripeCustomerId) return NextResponse.json({ error: "Metodo di pagamento non autorizzato" }, { status: 409 });
      if (!["waiting_milestone", "scheduled", "failed"].includes(installment.status)) return NextResponse.json({ error: "La rata non è addebitabile" }, { status: 409 });
      assertStripeTestMode();
      const stripe = getStripe();
      const customer = await stripe.customers.retrieve(plan.stripeCustomerId);
      const fallbackMethods = await stripe.paymentMethods.list({ customer: plan.stripeCustomerId, type: "card", limit: 1 });
      const paymentMethod = customer.deleted ? null : customer.invoice_settings?.default_payment_method || fallbackMethods.data[0]?.id;
      if (!paymentMethod) return NextResponse.json({ error: "Nessun metodo Stripe utilizzabile" }, { status: 409 });
      installment.status = "processing";
      installment.milestoneConfirmedAt = installment.dueType === "milestone" ? new Date() : installment.milestoneConfirmedAt;
      await plan.save();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(installment.amount) * 100),
        currency: plan.currency,
        customer: plan.stripeCustomerId,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        description: `${plan.serviceName} - ${installment.label || "rata"}`,
        metadata: { paymentPlanId: String(plan._id), installmentId: String(installment._id) },
      }, { idempotencyKey: `hoon-installment-${installment._id}` });
      installment.stripePaymentIntentId = paymentIntent.id;
      await plan.save();
      await notifyCommercialAdmin({ title: "Rata inviata a Stripe", message: `${installment.label || "Rata"}: richiesta di ${installment.amount} ${plan.currency.toUpperCase()} inviata.`, refId: `installment-${installment._id}`, link: "/Commerciale" });
      return NextResponse.json(plan);
    }

    const updated = await Model.findByIdAndUpdate(id, { $set: safePatch(input) }, { new: true, runValidators: true });
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: "Record non trovato" }, { status: 404 });
  } catch (error) {
    console.error(`Errore PATCH commerciale/${resource}/${id}:`, error);
    return NextResponse.json({ error: error.message || "Aggiornamento non riuscito" }, { status: 400 });
  }
}

export async function DELETE(_req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const { resource, id } = await params;
  const Model = registry[resource];
  if (!Model || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Risorsa non valida" }, { status: 404 });
  await connectToDB();
  if (resource === "contacts") {
    const hasRelations = await CommercialOpportunity.exists({ organization: id });
    if (hasRelations) return NextResponse.json({ error: "Il contatto ha opportunità collegate e non può essere eliminato" }, { status: 409 });
  }
  const deleted = await Model.findByIdAndDelete(id);
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Record non trovato" }, { status: 404 });
}

