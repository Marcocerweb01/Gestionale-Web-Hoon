import { Schema, model, models } from "mongoose";

const CUSTOMER_TYPES = ["privato", "team", "azienda"];
const DOCUMENT_TYPES = ["quote", "order_confirmation", "delivery_note"];
const QUOTE_STATUSES = ["bozza", "inviato", "accettato", "rifiutato", "scaduto", "convertito"];
const ORDER_STATUSES = ["bozza", "confermato", "ddt_generato", "annullato"];
const DDT_STATUSES = ["bozza", "emesso", "annullato"];

const MoneySchema = {
  type: Number,
  default: 0,
  min: 0
};

const AddressSchema = new Schema({
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  zip: { type: String, default: "" },
  province: { type: String, default: "" },
  country: { type: String, default: "Italia" }
}, { _id: false });

const HoonLabCustomerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: CUSTOMER_TYPES, required: true, default: "privato" },
  email: { type: String, default: "", trim: true, lowercase: true },
  phone: { type: String, default: "", trim: true },
  vatNumber: { type: String, default: "", trim: true },
  taxCode: { type: String, default: "", trim: true },
  billingAddress: { type: AddressSchema, default: () => ({}) },
  shippingAddress: { type: AddressSchema, default: () => ({}) },
  defaultPriceList: { type: Schema.Types.ObjectId, ref: "HoonLabPriceList", default: null },
  notes: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const HoonLabProductSchema = new Schema({
  sku: { type: String, default: "", trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  basePrice: MoneySchema,
  unit: { type: String, default: "pz" },
  category: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const HoonLabPriceListSchema = new Schema({
  name: { type: String, required: true, trim: true },
  customerType: { type: String, enum: [...CUSTOMER_TYPES, "custom"], default: "privato" },
  currency: { type: String, default: "EUR" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const HoonLabPriceListItemSchema = new Schema({
  priceList: { type: Schema.Types.ObjectId, ref: "HoonLabPriceList", required: true },
  product: { type: Schema.Types.ObjectId, ref: "HoonLabProduct", required: true },
  price: { type: Number, required: true, min: 0 },
  validFrom: { type: Date, required: true, default: Date.now },
  validTo: { type: Date, default: null },
  notes: { type: String, default: "" }
}, { timestamps: true });

HoonLabPriceListItemSchema.index({ priceList: 1, product: 1, validFrom: -1 });
HoonLabPriceListItemSchema.index({ priceList: 1, product: 1, validTo: 1 });

const CommercialLineSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "HoonLabProduct", default: null },
  productSnapshot: { type: Schema.Types.Mixed, default: {} },
  description: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 },
  unit: { type: String, default: "pz" },
  unitPrice: { type: Number, default: 0, min: 0 },
  manualUnitPrice: { type: Boolean, default: false },
  discountType: { type: String, enum: ["none", "percent", "fixed"], default: "none" },
  discountValue: MoneySchema,
  increaseType: { type: String, enum: ["none", "percent", "fixed"], default: "none" },
  increaseValue: MoneySchema,
  lineSubtotal: MoneySchema,
  lineDiscount: MoneySchema,
  lineIncrease: MoneySchema,
  lineTotal: MoneySchema,
  notes: { type: String, default: "" },
  sortOrder: { type: Number, default: 0 }
}, { _id: true });

const QuoteSchema = new Schema({
  number: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: "HoonLabCustomer", required: true },
  customerSnapshot: { type: Schema.Types.Mixed, required: true },
  priceList: { type: Schema.Types.ObjectId, ref: "HoonLabPriceList", default: null },
  priceListSnapshot: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: QUOTE_STATUSES, default: "bozza" },
  issueDate: { type: Date, default: Date.now },
  validUntil: { type: Date, default: null },
  lines: { type: [CommercialLineSchema], default: [] },
  quoteDiscountType: { type: String, enum: ["none", "percent", "fixed"], default: "none" },
  quoteDiscountValue: MoneySchema,
  quoteDiscountAmount: MoneySchema,
  subtotal: MoneySchema,
  discountTotal: MoneySchema,
  increaseTotal: MoneySchema,
  total: MoneySchema,
  notes: { type: String, default: "" },
  pdfUrl: { type: String, default: "" },
  rejectionReason: { type: String, default: "" },
  rejectedAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  convertedOrder: { type: Schema.Types.ObjectId, ref: "HoonLabOrderConfirmation", default: null }
}, { timestamps: true });

QuoteSchema.index({ customer: 1, status: 1 });
QuoteSchema.index({ issueDate: -1 });

const OrderConfirmationSchema = new Schema({
  number: { type: String, required: true, unique: true },
  quote: { type: Schema.Types.ObjectId, ref: "HoonLabQuote", default: null },
  customer: { type: Schema.Types.ObjectId, ref: "HoonLabCustomer", required: true },
  customerSnapshot: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ORDER_STATUSES, default: "confermato" },
  issueDate: { type: Date, default: Date.now },
  lines: { type: [CommercialLineSchema], default: [] },
  quoteDiscountType: { type: String, enum: ["none", "percent", "fixed"], default: "none" },
  quoteDiscountValue: MoneySchema,
  quoteDiscountAmount: MoneySchema,
  subtotal: MoneySchema,
  discountTotal: MoneySchema,
  increaseTotal: MoneySchema,
  total: MoneySchema,
  notes: { type: String, default: "" },
  pdfUrl: { type: String, default: "" }
}, { timestamps: true });

OrderConfirmationSchema.index({ customer: 1, status: 1 });
OrderConfirmationSchema.index({ issueDate: -1 });

const DeliveryNoteLineSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "HoonLabProduct", default: null },
  productSnapshot: { type: Schema.Types.Mixed, default: {} },
  description: { type: String, required: true },
  quantity: { type: Number, default: 1, min: 0 },
  unit: { type: String, default: "pz" },
  notes: { type: String, default: "" },
  sortOrder: { type: Number, default: 0 }
}, { _id: true });

const DeliveryNoteSchema = new Schema({
  number: { type: String, required: true, unique: true },
  quote: { type: Schema.Types.ObjectId, ref: "HoonLabQuote", default: null },
  orderConfirmation: { type: Schema.Types.ObjectId, ref: "HoonLabOrderConfirmation", default: null },
  customer: { type: Schema.Types.ObjectId, ref: "HoonLabCustomer", required: true },
  customerSnapshot: { type: Schema.Types.Mixed, required: true },
  shippingAddressSnapshot: { type: Schema.Types.Mixed, default: {} },
  reason: { type: String, default: "Vendita" },
  status: { type: String, enum: DDT_STATUSES, default: "bozza" },
  issueDate: { type: Date, default: Date.now },
  lines: { type: [DeliveryNoteLineSchema], default: [] },
  notes: { type: String, default: "" },
  pdfUrl: { type: String, default: "" }
}, { timestamps: true });

DeliveryNoteSchema.index({ customer: 1, status: 1 });
DeliveryNoteSchema.index({ issueDate: -1 });

const PdfTemplateSchema = new Schema({
  type: { type: String, enum: DOCUMENT_TYPES, required: true },
  name: { type: String, required: true },
  html: { type: String, required: true },
  css: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const DocumentSequenceSchema = new Schema({
  documentType: { type: String, enum: DOCUMENT_TYPES, required: true },
  year: { type: Number, required: true },
  prefix: { type: String, required: true },
  nextNumber: { type: Number, required: true, default: 1 }
}, { timestamps: true });

DocumentSequenceSchema.index({ documentType: 1, year: 1 }, { unique: true });

export const HoonLabCustomer = models.HoonLabCustomer || model("HoonLabCustomer", HoonLabCustomerSchema);
export const HoonLabProduct = models.HoonLabProduct || model("HoonLabProduct", HoonLabProductSchema);
export const HoonLabPriceList = models.HoonLabPriceList || model("HoonLabPriceList", HoonLabPriceListSchema);
export const HoonLabPriceListItem = models.HoonLabPriceListItem || model("HoonLabPriceListItem", HoonLabPriceListItemSchema);
export const HoonLabQuote = models.HoonLabQuote || model("HoonLabQuote", QuoteSchema);
export const HoonLabOrderConfirmation = models.HoonLabOrderConfirmation || model("HoonLabOrderConfirmation", OrderConfirmationSchema);
export const HoonLabDeliveryNote = models.HoonLabDeliveryNote || model("HoonLabDeliveryNote", DeliveryNoteSchema);
export const HoonLabPdfTemplate = models.HoonLabPdfTemplate || model("HoonLabPdfTemplate", PdfTemplateSchema);
export const HoonLabDocumentSequence = models.HoonLabDocumentSequence || model("HoonLabDocumentSequence", DocumentSequenceSchema);

export const HOON_LAB = {
  CUSTOMER_TYPES,
  DOCUMENT_TYPES,
  QUOTE_STATUSES,
  ORDER_STATUSES,
  DDT_STATUSES
};
