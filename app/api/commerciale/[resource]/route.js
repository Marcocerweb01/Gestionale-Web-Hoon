import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import {
  buildDefaultQuotePages,
  calculateQuote,
  DEFAULT_INTERVIEW_TEMPLATES,
  DEFAULT_QUOTE_TEMPLATES,
  HOON_GENERAL_QUOTE_TEMPLATE,
  HOON_QUOTE_SERVICE_CATALOG,
  HOON_TEMPLATE_SOURCE_VERSION,
  normalizeEmail,
  normalizePhone,
  sanitizeText,
  selectQuoteTemplatePages,
  shouldUpgradeHoonQuoteTemplate,
} from "@/lib/commerciale/core";
import {
  CommercialOrganization,
  CommercialOpportunity,
  InterviewTemplate,
  Interview,
  QuoteTemplate,
  CommercialQuote,
  ManualContract,
  PaymentPlan,
  CommercialCollaboration,
  PaymentTransaction,
} from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";
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
  collaborations: CommercialCollaboration,
  transactions: PaymentTransaction,
};

const populate = {
  contacts: [],
  opportunities: [{ path: "organization", select: "businessName tradingName people requestedServices" }],
  "interview-templates": [{ path: "sourceFile", select: "filename mimeType size" }],
  interviews: [
    { path: "organization", select: "businessName tradingName" },
    { path: "opportunity", select: "title state" },
    { path: "template", select: "name serviceType questions" },
    { path: "attachmentIds", select: "filename mimeType size purpose" },
  ],
  "quote-templates": [{ path: "sourceFile", select: "filename mimeType size" }],
  quotes: [
    { path: "organization", select: "businessName tradingName people address vatNumber taxCode" },
    { path: "opportunity", select: "title state services" },
    { path: "interview", select: "title status aiAnalysis" },
    { path: "template", select: "name" },
  ],
  contracts: [
    { path: "organization", select: "businessName tradingName" },
    { path: "opportunity", select: "title state" },
    { path: "quote", select: "number status acceptedVersion currentVersion" },
    { path: "document", select: "filename mimeType size" },
  ],
  payments: [
    { path: "organization", select: "businessName tradingName administrativeEmail people" },
    { path: "opportunity", select: "title state" },
    { path: "quote", select: "number status acceptedVersion" },
    { path: "contract", select: "signatureStatus startsAt endsAt" },
  ],
  collaborations: [
    { path: "organization", select: "businessName tradingName" },
    { path: "quote", select: "number" },
    { path: "contract", select: "signatureStatus" },
    { path: "paymentPlan", select: "status serviceName amount" },
  ],
  transactions: [
    { path: "organization", select: "businessName tradingName" },
    { path: "paymentPlan", select: "serviceName type status" },
  ],
};

async function seedTemplates() {
  const currentMaster = await QuoteTemplate.findOne({ name: HOON_GENERAL_QUOTE_TEMPLATE }).select("sourceVersion").lean();
  if (!currentMaster || shouldUpgradeHoonQuoteTemplate(currentMaster.sourceVersion)) {
    await QuoteTemplate.updateOne(
      { name: HOON_GENERAL_QUOTE_TEMPLATE },
      {
        $set: {
          name: HOON_GENERAL_QUOTE_TEMPLATE,
          description: "Master fedele al preventivo generale Hoon: seleziona i servizi e genera solo le pagine collegate.",
          pages: buildDefaultQuotePages(HOON_GENERAL_QUOTE_TEMPLATE),
          serviceCatalog: HOON_QUOTE_SERVICE_CATALOG,
          sourceVersion: HOON_TEMPLATE_SOURCE_VERSION,
          active: true,
        },
      },
      { upsert: true }
    );
  }

  await Promise.all(
    DEFAULT_QUOTE_TEMPLATES.filter((name) => name !== HOON_GENERAL_QUOTE_TEMPLATE).map((name) =>
      QuoteTemplate.updateOne(
        { name },
        {
          $setOnInsert: {
            name,
            description: `Template Hoon nativo per ${name}`,
            pages: buildDefaultQuotePages(name),
            active: true,
          },
        },
        { upsert: true }
      )
    )
  );

  const baseQuestions = [
    { key: "azienda", label: "Presenta brevemente l'azienda", type: "textarea", required: true, section: "Azienda", sortOrder: 0 },
    { key: "obiettivi", label: "Quali obiettivi volete raggiungere?", type: "textarea", required: true, section: "Obiettivi", sortOrder: 1 },
    { key: "pubblico", label: "Qual è il pubblico di riferimento?", type: "textarea", required: true, section: "Strategia", sortOrder: 2 },
    { key: "criticita", label: "Quali criticità state affrontando?", type: "textarea", section: "Strategia", sortOrder: 3 },
    { key: "budget", label: "Budget indicativo", type: "number", section: "Progetto", sortOrder: 4 },
    { key: "tempistiche", label: "Tempistiche desiderate", type: "text", section: "Progetto", sortOrder: 5 },
  ];

  await Promise.all(
    DEFAULT_INTERVIEW_TEMPLATES.map((name) =>
      InterviewTemplate.updateOne(
        { name },
        {
          $setOnInsert: {
            name,
            serviceType: name,
            description: `Intervista digitale ${name}`,
            questions: baseQuestions,
            active: true,
          },
        },
        { upsert: true }
      )
    )
  );
}

export async function GET(req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;

  const { resource } = await params;
  const Model = registry[resource];
  if (!Model) return NextResponse.json({ error: "Risorsa non valida" }, { status: 404 });
  await connectToDB();
  if (resource === "quote-templates" || resource === "interview-templates") await seedTemplates();

  const { searchParams } = new URL(req.url);
  const filter = {};
  if (searchParams.get("organization")) filter.organization = searchParams.get("organization");
  if (searchParams.get("opportunity")) filter.opportunity = searchParams.get("opportunity");
  if (searchParams.get("state")) filter.state = searchParams.get("state");
  if (searchParams.get("status")) filter.status = searchParams.get("status");
  if (searchParams.get("active") === "true") filter.active = true;

  let query = Model.find(filter).sort({ updatedAt: -1 }).limit(500);
  for (const item of populate[resource] || []) query = query.populate(item);
  const records = await query.lean();
  return NextResponse.json(records);
}

export async function POST(req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;

  const { resource } = await params;
  const Model = registry[resource];
  if (!Model) return NextResponse.json({ error: "Risorsa non valida" }, { status: 404 });
  if (["transactions", "collaborations"].includes(resource)) {
    return NextResponse.json({ error: "Risorsa di sola lettura" }, { status: 405 });
  }
  const input = await req.json().catch(() => ({}));
  await connectToDB();

  try {
    let payload = input;

    if (resource === "contacts") {
      const primary = input.people?.[0] || {};
      const businessName = sanitizeText(input.businessName, 200);
      if (!businessName) return NextResponse.json({ error: "Ragione sociale obbligatoria" }, { status: 400 });

      const vatNumber = sanitizeText(input.vatNumber, 40).toUpperCase();
      const email = normalizeEmail(primary.email);
      const phone = normalizePhone(primary.phone);
      const duplicateClauses = [{ businessName: new RegExp(`^${businessName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }];
      if (vatNumber) duplicateClauses.push({ vatNumber });
      if (email) duplicateClauses.push({ "people.email": email });
      if (phone) duplicateClauses.push({ "people.phone": phone });
      const duplicate = await CommercialOrganization.findOne({ $or: duplicateClauses }).select("businessName vatNumber people").lean();
      if (duplicate && !input.confirmDuplicate) {
        return NextResponse.json({ error: "Possibile contatto duplicato", duplicate }, { status: 409 });
      }

      payload = {
        ...input,
        businessName,
        tradingName: sanitizeText(input.tradingName, 200),
        vatNumber,
        taxCode: sanitizeText(input.taxCode, 40).toUpperCase(),
        administrativeEmail: normalizeEmail(input.administrativeEmail),
        people: (input.people || []).map((person) => ({
          ...person,
          firstName: sanitizeText(person.firstName, 100),
          lastName: sanitizeText(person.lastName, 100),
          email: normalizeEmail(person.email),
          phone: normalizePhone(person.phone),
        })),
        createdBy: auth.session.user.email,
        updatedBy: auth.session.user.email,
      };
      delete payload.confirmDuplicate;
    }

    if (resource === "opportunities") {
      if (!input.organization || !sanitizeText(input.title, 200)) {
        return NextResponse.json({ error: "Contatto e titolo sono obbligatori" }, { status: 400 });
      }
      payload = {
        ...input,
        title: sanitizeText(input.title, 200),
        state: "nuovo_contatto",
        stateChangedAt: new Date(),
        history: [{ state: "nuovo_contatto", at: new Date(), operatorEmail: auth.session.user.email, note: "Opportunità creata" }],
      };
    }

    if (resource === "quotes") {
      const template = input.template ? await QuoteTemplate.findById(input.template).lean() : null;
      const pricing = calculateQuote(input.items || []);
      const number = `PREV-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
      const templatePages = template?.pages || buildDefaultQuotePages(template?.name);
      const selectedPages = template && Array.isArray(input.serviceKeys) && input.serviceKeys.length
        ? selectQuoteTemplatePages(templatePages, input.serviceKeys)
        : templatePages;
      payload = {
        number,
        organization: input.organization,
        opportunity: input.opportunity,
        interview: input.interview || null,
        template: input.template || null,
        responsible: auth.session.user.email,
        validUntil: input.validUntil || null,
        status: "draft",
        currentVersion: 1,
        versions: [{
          version: 1,
          createdBy: auth.session.user.email,
          reason: "Versione iniziale",
          pages: input.pages || selectedPages,
          items: pricing.items,
          totals: pricing.totals,
          projectDescription: sanitizeText(input.projectDescription, 15000),
          paymentConditions: sanitizeText(input.paymentConditions, 10000),
        }],
      };
      await CommercialOpportunity.findByIdAndUpdate(input.opportunity, {
        $set: { state: "preventivo_in_preparazione", stateChangedAt: new Date() },
        $push: { history: { state: "preventivo_in_preparazione", at: new Date(), operatorEmail: auth.session.user.email, note: "Preventivo creato" } },
      });
    }

    if (resource === "interviews") {
      payload = { ...input, status: input.status || "draft" };
      await CommercialOpportunity.findByIdAndUpdate(input.opportunity, {
        $set: { state: "intervista_pianificata", stateChangedAt: new Date() },
        $push: { history: { state: "intervista_pianificata", at: new Date(), operatorEmail: auth.session.user.email, note: "Intervista creata" } },
      });
    }

    if (resource === "quote-templates") {
      payload = {
        name: sanitizeText(input.name, 200),
        description: sanitizeText(input.description, 2000),
        pages: input.pages?.length ? input.pages : buildDefaultQuotePages(input.name),
        serviceCatalog: Array.isArray(input.serviceCatalog) ? input.serviceCatalog : [],
        sourceVersion: Number(input.sourceVersion) || 0,
        active: input.active !== false,
      };
    }

    if (resource === "payments") {
      const contract = await ManualContract.findById(input.contract).lean();
      const quote = await CommercialQuote.findById(input.quote).lean();
      if (!contract || contract.signatureStatus !== "signed") {
        return NextResponse.json({ error: "Il contratto deve risultare firmato" }, { status: 409 });
      }
      if (!quote || quote.status !== "accepted" || quote.acceptedVersion !== Number(input.quoteVersion)) {
        return NextResponse.json({ error: "Il piano deve usare la versione accettata del preventivo" }, { status: 409 });
      }
      payload = { ...input, status: "draft" };
    }

    const created = await Model.create(payload);
    if (resource === "contacts") {
      await notifyCommercialAdmin({ title: "Nuovo contatto commerciale", message: `${created.businessName} è stato aggiunto al CRM.`, refId: `contact-${created._id}`, link: "/Commerciale" });
    }
    if (resource === "contracts" && created.signatureStatus === "signed") {
      await notifyCommercialAdmin({ title: "Contratto firmato da verificare", message: `Il contratto ${created._id} risulta firmato.`, refId: `contract-signed-${created._id}`, link: "/Commerciale" });
    }
    let query = Model.findById(created._id);
    for (const item of populate[resource] || []) query = query.populate(item);
    return NextResponse.json(await query.lean(), { status: 201 });
  } catch (error) {
    console.error(`Errore POST commerciale/${resource}:`, error);
    if (error?.code === 11000) return NextResponse.json({ error: "Dato già esistente" }, { status: 409 });
    return NextResponse.json({ error: error.message || "Errore di salvataggio" }, { status: 400 });
  }
}

