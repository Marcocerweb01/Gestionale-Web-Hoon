import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import {
  CommercialOrganization,
  CommercialOpportunity,
  CommercialQuote,
  Interview,
  ManualContract,
  PaymentPlan,
  CommercialCollaboration,
} from "@/models/Commerciale";
import { Azienda } from "@/models/User";
import { connectToDB } from "@/utils/database";

export async function POST(req, { params }) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const { action } = await params;
  const body = await req.json().catch(() => ({}));
  if (!mongoose.Types.ObjectId.isValid(body.opportunityId)) return NextResponse.json({ error: "Opportunità non valida" }, { status: 400 });
  await connectToDB();

  const opportunity = await CommercialOpportunity.findById(body.opportunityId).populate("organization");
  if (!opportunity) return NextResponse.json({ error: "Opportunità non trovata" }, { status: 404 });
  const organization = opportunity.organization;

  if (action === "convert-client") {
    if (!opportunity.acceptedQuote || opportunity.state !== "accettato") {
      return NextResponse.json({ error: "Serve un preventivo accettato prima della conversione" }, { status: 409 });
    }
    const clauses = [];
    if (organization.vatNumber) clauses.push({ partitaIva: organization.vatNumber });
    const email = organization.administrativeEmail || organization.people?.[0]?.email;
    if (email) clauses.push({ email: email.toLowerCase() });
    clauses.push({ ragioneSociale: organization.businessName });
    let client = await Azienda.findOne({ $or: clauses });
    if (!client) {
      client = await Azienda.create({
        ragioneSociale: organization.businessName,
        etichetta: organization.tradingName || organization.businessName,
        email: email || undefined,
        partitaIva: organization.vatNumber || undefined,
        indirizzo: [organization.address?.street, organization.address?.city].filter(Boolean).join(", "),
        status: "attivo",
      });
    }
    opportunity.convertedClient = client._id;
    opportunity.state = "in_onboarding";
    opportunity.stateChangedAt = new Date();
    opportunity.history.push({ state: "in_onboarding", at: new Date(), operatorEmail: auth.session.user.email, note: "Contatto collegato all'anagrafica cliente" });
    organization.legacyClientId = client._id;
    organization.clientStatus = "client";
    await Promise.all([opportunity.save(), organization.save()]);
    return NextResponse.json({ client, opportunity });
  }

  if (action === "activate-collaboration") {
    const [quote, contract, payment, interview] = await Promise.all([
      CommercialQuote.findOne({ _id: opportunity.acceptedQuote, status: "accepted" }).lean(),
      ManualContract.findOne({ opportunity: opportunity._id, signatureStatus: "signed" }).lean(),
      PaymentPlan.findOne({ opportunity: opportunity._id, status: "active", paymentMethodAuthorized: true }).lean(),
      Interview.findOne({ opportunity: opportunity._id }).sort({ updatedAt: -1 }).lean(),
    ]);
    if (!opportunity.convertedClient) return NextResponse.json({ error: "Converti prima il contatto in cliente" }, { status: 409 });
    if (!quote || !contract || !payment) return NextResponse.json({ error: "Servono preventivo accettato, contratto firmato e pagamenti autorizzati" }, { status: 409 });
    const version = quote.versions.find((item) => item.version === quote.acceptedVersion);
    const collaboration = await CommercialCollaboration.findOneAndUpdate(
      { opportunity: opportunity._id },
      {
        $setOnInsert: {
          opportunity: opportunity._id,
          organization: organization._id,
          legacyClient: opportunity.convertedClient,
          quote: quote._id,
          quoteVersion: quote.acceptedVersion,
          interview: interview?._id || null,
          contract: contract._id,
          paymentPlan: payment._id,
          services: version?.items || [],
          status: "active",
          activatedAt: new Date(),
          activatedBy: auth.session.user.email,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    opportunity.activatedCollaboration = collaboration._id;
    opportunity.state = "convertito";
    opportunity.stateChangedAt = new Date();
    opportunity.history.push({ state: "convertito", at: new Date(), operatorEmail: auth.session.user.email, note: "Collaborazione attivata" });
    await opportunity.save();
    return NextResponse.json({ collaboration, opportunity });
  }

  return NextResponse.json({ error: "Azione non valida" }, { status: 404 });
}

