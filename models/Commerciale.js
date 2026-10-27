import mongoose from "mongoose";
import { PIPELINE_STATES } from "@/lib/commerciale/core";

const { Schema, model, models } = mongoose;

const PersonSchema = new Schema({
  firstName: { type: String, default: "", trim: true },
  lastName: { type: String, default: "", trim: true },
  phone: { type: String, default: "", trim: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  role: { type: String, default: "", trim: true },
  primary: { type: Boolean, default: false },
}, { _id: true });

const AddressSchema = new Schema({
  street: { type: String, default: "" },
  city: { type: String, default: "" },
  province: { type: String, default: "" },
  postalCode: { type: String, default: "" },
  country: { type: String, default: "Italia" },
}, { _id: false });

const CommercialOrganizationSchema = new Schema({
  businessName: { type: String, required: true, trim: true },
  tradingName: { type: String, default: "", trim: true },
  logoUrl: { type: String, default: "" },
  sector: { type: String, default: "" },
  website: { type: String, default: "" },
  address: { type: AddressSchema, default: () => ({}) },
  vatNumber: { type: String, default: "", trim: true, uppercase: true },
  taxCode: { type: String, default: "", trim: true, uppercase: true },
  administrativeEmail: { type: String, default: "", trim: true, lowercase: true },
  pec: { type: String, default: "", trim: true, lowercase: true },
  sdiCode: { type: String, default: "", trim: true, uppercase: true },
  people: { type: [PersonSchema], default: [] },
  assignedCommercial: { type: String, default: "" },
  acquisitionSource: { type: String, default: "" },
  requestedServices: { type: [String], default: [] },
  indicativeBudget: { type: Number, default: null, min: 0 },
  notes: { type: String, default: "" },
  firstContactAt: { type: Date, default: Date.now },
  nextAppointmentAt: { type: Date, default: null },
  nextContactAt: { type: Date, default: null },
  clientStatus: { type: String, enum: ["prospect", "client"], default: "prospect", index: true },
  legacyClientId: { type: Schema.Types.ObjectId, ref: "Azienda", default: null },
  createdBy: { type: String, default: "" },
  updatedBy: { type: String, default: "" },
}, { timestamps: true });

CommercialOrganizationSchema.index({ businessName: "text", tradingName: "text", "people.email": "text" });
CommercialOrganizationSchema.index({ vatNumber: 1 }, { sparse: true });
CommercialOrganizationSchema.index({ "people.email": 1 });
CommercialOrganizationSchema.index({ "people.phone": 1 });

const HistorySchema = new Schema({
  state: { type: String, enum: PIPELINE_STATES, required: true },
  at: { type: Date, default: Date.now },
  operatorEmail: { type: String, default: "" },
  note: { type: String, default: "" },
}, { _id: true });

const CommercialOpportunitySchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: "CommercialOrganization", required: true, index: true },
  title: { type: String, required: true, trim: true },
  services: { type: [String], default: [] },
  assignedCommercial: { type: String, default: "" },
  estimatedValue: { type: Number, default: 0, min: 0 },
  acceptedValue: { type: Number, default: 0, min: 0 },
  state: { type: String, enum: PIPELINE_STATES, default: "nuovo_contatto", index: true },
  stateChangedAt: { type: Date, default: Date.now },
  nextAppointmentAt: { type: Date, default: null },
  nextContactAt: { type: Date, default: null },
  presentation: {
    at: { type: Date, default: null },
    outcome: { type: String, default: "" },
    notes: { type: String, default: "" },
    requestedChanges: { type: String, default: "" },
    nextAppointmentAt: { type: Date, default: null },
  },
  postponed: { reason: { type: String, default: "" }, resumeAt: { type: Date, default: null } },
  rejectionReason: { type: String, default: "" },
  acceptedQuote: { type: Schema.Types.ObjectId, ref: "CommercialQuote", default: null },
  acceptedQuoteVersion: { type: Number, default: null },
  convertedClient: { type: Schema.Types.ObjectId, ref: "Azienda", default: null },
  activatedCollaboration: { type: Schema.Types.ObjectId, ref: "CommercialCollaboration", default: null },
  history: { type: [HistorySchema], default: [] },
  archived: { type: Boolean, default: false, index: true },
}, { timestamps: true });

CommercialOpportunitySchema.index({ state: 1, assignedCommercial: 1, createdAt: -1 });

const QuestionSchema = new Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ["text", "textarea", "select", "multiselect", "number", "date", "checkbox"], default: "text" },
  required: { type: Boolean, default: false },
  options: { type: [String], default: [] },
  section: { type: String, default: "Generale" },
  sortOrder: { type: Number, default: 0 },
}, { _id: true });

const InterviewTemplateSchema = new Schema({
  name: { type: String, required: true, trim: true },
  serviceType: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  questions: { type: [QuestionSchema], default: [] },
  sourceFile: { type: Schema.Types.ObjectId, ref: "CommercialFile", default: null },
  version: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const AnswerSchema = new Schema({
  questionKey: { type: String, required: true },
  value: { type: Schema.Types.Mixed, default: "" },
  confidence: { type: Number, min: 0, max: 1, default: 1 },
  confirmed: { type: Boolean, default: false },
  source: { type: String, enum: ["manual", "ai", "ocr"], default: "manual" },
}, { _id: true });

const InterviewSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: "CommercialOrganization", required: true, index: true },
  opportunity: { type: Schema.Types.ObjectId, ref: "CommercialOpportunity", required: true, index: true },
  template: { type: Schema.Types.ObjectId, ref: "InterviewTemplate", default: null },
  title: { type: String, required: true },
  status: { type: String, enum: ["draft", "to_confirm", "completed"], default: "draft" },
  answers: { type: [AnswerSchema], default: [] },
  notes: { type: String, default: "" },
  attachmentIds: [{ type: Schema.Types.ObjectId, ref: "CommercialFile" }],
  aiAnalysis: { type: Schema.Types.Mixed, default: null },
  aiAnalyzedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

const BlockSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ["text", "image", "shape"], default: "text" },
  text: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width: { type: Number, default: 200 },
  height: { type: Number, default: 50 },
  fontSize: { type: Number, default: 18 },
  fontWeight: { type: Number, default: 400 },
  color: { type: String, default: "#111111" },
  background: { type: String, default: "transparent" },
  align: { type: String, enum: ["left", "center", "right"], default: "left" },
  rotation: { type: Number, default: 0 },
  layer: { type: Number, default: 0 },
  shapeType: { type: String, enum: ["rectangle", "ellipse"], default: "rectangle" },
  borderColor: { type: String, default: "transparent" },
  borderWidth: { type: Number, default: 0, min: 0 },
  borderRadius: { type: Number, default: 0, min: 0 },
  opacity: { type: Number, default: 1, min: 0, max: 1 },
}, { _id: false });

const PageSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, default: "Pagina" },
  background: { type: String, default: "#ffffff" },
  backgroundImage: { type: String, default: "" },
  backgroundImageOpacity: { type: Number, default: 1, min: 0, max: 1 },
  includedByDefault: { type: Boolean, default: false },
  sourcePage: { type: Number, default: null },
  serviceKeys: { type: [String], default: [] },
  blocks: { type: [BlockSchema], default: [] },
}, { _id: false });

const QuoteItemSchema = new Schema({
  catalogKey: { type: String, default: "" },
  service: { type: String, required: true },
  description: { type: String, default: "" },
  quantity: { type: Number, default: 1, min: 0 },
  unitPrice: { type: Number, default: 0, min: 0 },
  standardPrice: { type: Number, default: 0, min: 0 },
  discountedPrice: { type: Number, default: 0, min: 0 },
  vatRate: { type: Number, default: 22, min: 0 },
  periodicity: { type: String, enum: ["one_off", "monthly", "annual", "custom"], default: "one_off" },
  durationMonths: { type: Number, default: null },
  initialPromotion: { type: String, default: "" },
  paymentConditions: { type: String, default: "" },
  renewal: { type: Boolean, default: false },
  net: { type: Number, default: 0 },
  vat: { type: Number, default: 0 },
  gross: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
}, { _id: true });

const QuoteVersionSchema = new Schema({
  version: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, default: "" },
  reason: { type: String, default: "" },
  immutable: { type: Boolean, default: false },
  pages: { type: [PageSchema], default: [] },
  items: { type: [QuoteItemSchema], default: [] },
  totals: {
    net: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },
  },
  projectDescription: { type: String, default: "" },
  paymentConditions: { type: String, default: "" },
  snapshotAt: { type: Date, default: null },
}, { _id: true });

const QuoteTemplateSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  pages: { type: [PageSchema], default: [] },
  active: { type: Boolean, default: true },
  sourceFile: { type: Schema.Types.ObjectId, ref: "CommercialFile", default: null },
  sourceVersion: { type: Number, default: 0 },
  serviceCatalog: { type: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    defaultPrice: { type: Number, default: 0, min: 0 },
    vatRate: { type: Number, default: 22, min: 0 },
  }], default: [] },
}, { timestamps: true });

const CommercialQuoteSchema = new Schema({
  number: { type: String, required: true, unique: true },
  organization: { type: Schema.Types.ObjectId, ref: "CommercialOrganization", required: true, index: true },
  opportunity: { type: Schema.Types.ObjectId, ref: "CommercialOpportunity", required: true, index: true },
  interview: { type: Schema.Types.ObjectId, ref: "Interview", default: null },
  template: { type: Schema.Types.ObjectId, ref: "QuoteTemplate", default: null },
  responsible: { type: String, default: "" },
  issuedAt: { type: Date, default: Date.now },
  validUntil: { type: Date, default: null },
  status: { type: String, enum: ["draft", "ready", "presented", "accepted", "rejected", "postponed", "archived"], default: "draft", index: true },
  currentVersion: { type: Number, default: 1 },
  versions: { type: [QuoteVersionSchema], default: [] },
  acceptedVersion: { type: Number, default: null },
  acceptedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: "" },
}, { timestamps: true });

const ManualContractSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: "CommercialOrganization", required: true, index: true },
  opportunity: { type: Schema.Types.ObjectId, ref: "CommercialOpportunity", required: true },
  quote: { type: Schema.Types.ObjectId, ref: "CommercialQuote", required: true },
  quoteVersion: { type: Number, required: true },
  collaborationType: { type: String, default: "" },
  contractDate: { type: Date, default: null },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
  autoRenewal: { type: Boolean, default: false },
  signatureStatus: { type: String, enum: ["to_prepare", "sent", "signed", "cancelled"], default: "to_prepare", index: true },
  notes: { type: String, default: "" },
  document: { type: Schema.Types.ObjectId, ref: "CommercialFile", default: null },
  uploadedAt: { type: Date, default: null },
}, { timestamps: true });

const InstallmentSchema = new Schema({
  label: { type: String, default: "" },
  amount: { type: Number, required: true, min: 0 },
  percentage: { type: Number, default: null, min: 0, max: 100 },
  dueType: { type: String, enum: ["date", "days_after_signature", "milestone"], default: "date" },
  dueAt: { type: Date, default: null },
  daysAfterSignature: { type: Number, default: null },
  milestone: { type: String, default: "" },
  milestoneConfirmedAt: { type: Date, default: null },
  status: { type: String, enum: ["scheduled", "waiting_milestone", "processing", "paid", "failed", "cancelled"], default: "scheduled" },
  stripePaymentIntentId: { type: String, default: "" },
  paidAt: { type: Date, default: null },
}, { _id: true });

const ScheduledPriceSchema = new Schema({
  amount: { type: Number, required: true, min: 0 },
  effectiveAt: { type: Date, required: true },
  proration: { type: Boolean, default: false },
  appliedAt: { type: Date, default: null },
}, { _id: true });

const PaymentPlanSchema = new Schema({
  organization: { type: Schema.Types.ObjectId, ref: "CommercialOrganization", required: true, index: true },
  opportunity: { type: Schema.Types.ObjectId, ref: "CommercialOpportunity", required: true },
  quote: { type: Schema.Types.ObjectId, ref: "CommercialQuote", required: true },
  quoteVersion: { type: Number, required: true },
  contract: { type: Schema.Types.ObjectId, ref: "ManualContract", required: true },
  type: { type: String, enum: ["subscription", "installments", "renewal"], required: true },
  status: { type: String, enum: ["draft", "approved", "awaiting_authorization", "active", "past_due", "completed", "cancelled"], default: "draft", index: true },
  currency: { type: String, default: "eur" },
  serviceName: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  vatRate: { type: Number, default: 22, min: 0 },
  billingDay: { type: Number, default: null, min: 1, max: 28 },
  startsAt: { type: Date, default: null },
  durationMonths: { type: Number, default: null },
  autoRenewal: { type: Boolean, default: false },
  firstPeriodAmount: { type: Number, default: null, min: 0 },
  firstPeriodMonths: { type: Number, default: null, min: 1 },
  scheduledPrices: { type: [ScheduledPriceSchema], default: [] },
  installments: { type: [InstallmentSchema], default: [] },
  renewal: {
    firstChargeAfterMonths: { type: Number, default: 11 },
    intervalMonths: { type: Number, default: 12 },
    technicalExpiryAt: { type: Date, default: null },
    provider: { type: String, default: "" },
    technicallyRenewedAt: { type: Date, default: null },
  },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: String, default: "" },
  publicTokenHash: { type: String, default: "", index: true },
  publicTokenExpiresAt: { type: Date, default: null },
  publicTokenRevokedAt: { type: Date, default: null },
  conditionsVersion: { type: String, default: "1" },
  conditionsText: { type: String, default: "" },
  conditionsAcceptedAt: { type: Date, default: null },
  conditionsAcceptedIp: { type: String, default: "" },
  stripeCustomerId: { type: String, default: "", index: true },
  stripeCheckoutSessionId: { type: String, default: "" },
  stripeSubscriptionId: { type: String, default: "" },
  stripeScheduleId: { type: String, default: "" },
  paymentMethodAuthorized: { type: Boolean, default: false },
  lastStripeEventCreated: { type: Number, default: 0 },
  lastPaymentAt: { type: Date, default: null },
  lastError: { type: String, default: "" },
}, { timestamps: true });

PaymentPlanSchema.index({ publicTokenHash: 1, publicTokenExpiresAt: 1 });

const StripeWebhookEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  stripeCreated: { type: Number, required: true },
  livemode: { type: Boolean, default: false },
  processedAt: { type: Date, default: null },
  error: { type: String, default: "" },
}, { timestamps: true });

const PaymentTransactionSchema = new Schema({
  paymentPlan: { type: Schema.Types.ObjectId, ref: "PaymentPlan", required: true, index: true },
  organization: { type: Schema.Types.ObjectId, ref: "CommercialOrganization", required: true, index: true },
  stripeObjectId: { type: String, required: true, unique: true },
  kind: { type: String, enum: ["payment_intent", "invoice"], required: true },
  status: { type: String, enum: ["paid", "failed", "processing", "refunded"], required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "eur" },
  occurredAt: { type: Date, required: true, index: true },
  stripeEventId: { type: String, required: true },
  failureMessage: { type: String, default: "" },
}, { timestamps: true });

const CommercialFileSchema = new Schema({
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  purpose: { type: String, enum: ["interview_source", "interview_attachment", "quote_source", "contract"], required: true },
  data: { type: Buffer, required: true, select: false },
  uploadedBy: { type: String, default: "" },
}, { timestamps: true });

const CommercialCollaborationSchema = new Schema({
  opportunity: { type: Schema.Types.ObjectId, ref: "CommercialOpportunity", required: true, unique: true },
  organization: { type: Schema.Types.ObjectId, ref: "CommercialOrganization", required: true },
  legacyClient: { type: Schema.Types.ObjectId, ref: "Azienda", required: true },
  quote: { type: Schema.Types.ObjectId, ref: "CommercialQuote", required: true },
  quoteVersion: { type: Number, required: true },
  interview: { type: Schema.Types.ObjectId, ref: "Interview", default: null },
  contract: { type: Schema.Types.ObjectId, ref: "ManualContract", required: true },
  paymentPlan: { type: Schema.Types.ObjectId, ref: "PaymentPlan", required: true },
  services: { type: [QuoteItemSchema], default: [] },
  status: { type: String, enum: ["active", "paused", "ended"], default: "active" },
  activatedAt: { type: Date, default: Date.now },
  activatedBy: { type: String, default: "" },
}, { timestamps: true });

export const CommercialOrganization = models.CommercialOrganization || model("CommercialOrganization", CommercialOrganizationSchema);
export const CommercialOpportunity = models.CommercialOpportunity || model("CommercialOpportunity", CommercialOpportunitySchema);
export const InterviewTemplate = models.InterviewTemplate || model("InterviewTemplate", InterviewTemplateSchema);
export const Interview = models.Interview || model("Interview", InterviewSchema);
export const QuoteTemplate = models.QuoteTemplate || model("QuoteTemplate", QuoteTemplateSchema);
export const CommercialQuote = models.CommercialQuote || model("CommercialQuote", CommercialQuoteSchema);
export const ManualContract = models.ManualContract || model("ManualContract", ManualContractSchema);
export const PaymentPlan = models.PaymentPlan || model("PaymentPlan", PaymentPlanSchema);
export const StripeWebhookEvent = models.StripeWebhookEvent || model("StripeWebhookEvent", StripeWebhookEventSchema);
export const PaymentTransaction = models.PaymentTransaction || model("PaymentTransaction", PaymentTransactionSchema);
export const CommercialFile = models.CommercialFile || model("CommercialFile", CommercialFileSchema);
export const CommercialCollaboration = models.CommercialCollaboration || model("CommercialCollaboration", CommercialCollaborationSchema);

