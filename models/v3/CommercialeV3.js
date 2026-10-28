import { Schema, model, models } from "mongoose";

const TimelineStepSchema = new Schema({
  completato: { type: Boolean, default: false },
  dataCompletamento: { type: Date, default: null },
}, { _id: false });

const LeadCommercialeV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  commercialeId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  referente: { type: String, default: "", trim: true },
  telefonoPrincipale: { type: String, required: true, trim: true },
  telefonoSecondario: { type: String, default: "", trim: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  indirizzo: { type: String, default: "", trim: true },
  citta: { type: String, default: "", trim: true },
  timeline: {
    contatto: { type: TimelineStepSchema, default: () => ({}) },
    appuntamento: { type: TimelineStepSchema, default: () => ({}) },
    preventivo: { type: TimelineStepSchema, default: () => ({}) },
    contratto: { type: TimelineStepSchema, default: () => ({}) },
  },
  stato: {
    type: String,
    enum: ["in_lavorazione", "non_interessato", "da_richiamare", "completato"],
    default: "in_lavorazione",
    index: true,
  },
  statoCambiatoAt: { type: Date, default: null },
  richiamoAt: { type: Date, default: null, index: true },
  nonInteressato: {
    completato: { type: Boolean, default: false },
    dataCompletamento: { type: Date, default: null },
    nota: { type: String, default: "" },
  },
  daRicontattare: {
    completato: { type: Boolean, default: false },
    dataCompletamento: { type: Date, default: null },
    dataRicontatto: { type: Date, default: null },
    nota: { type: String, default: "" },
  },
  notaGenerale: { type: String, default: "" },
  archiviato: { type: Boolean, default: false, index: true },
  archiviatoAt: { type: Date, default: null },
  legacyRef: {
    model: { type: String, enum: ["LeadCommerciale", ""], default: "" },
    id: { type: Schema.Types.ObjectId, default: null },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

LeadCommercialeV3Schema.index({ agenziaId: 1, commercialeId: 1, stato: 1, archiviato: 1 });
LeadCommercialeV3Schema.index(
  { agenziaId: 1, "legacyRef.model": 1, "legacyRef.id": 1 },
  { unique: true, partialFilterExpression: { "legacyRef.id": { $type: "objectId" } } }
);

export default models.LeadCommercialeV3 || model("LeadCommercialeV3", LeadCommercialeV3Schema);
