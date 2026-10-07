import { Schema, model, models } from "mongoose";

const SeoTaskSchema = new Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  completata: { type: Boolean, default: false },
  note: { type: String, default: "" },
}, { _id: false });

const CollaborazioneSeoSchema = new Schema({
  sourceType: { type: String, enum: ["webdesign", "webdesign-v2"], required: true },
  sourceId: { type: Schema.Types.ObjectId, required: true },
  cliente: { type: Schema.Types.ObjectId, ref: "Azienda", required: true },
  webDesigner: { type: Schema.Types.ObjectId, ref: "Collaboratore", required: true },
  seo: { type: Schema.Types.ObjectId, ref: "Collaboratore", required: true, index: true },
  aziendaRagioneSociale: { type: String, required: true },
  checklist: { type: [SeoTaskSchema], default: [] },
  archiviata: { type: Boolean, default: false, index: true },
  archiviataAt: { type: Date, default: null },
}, { timestamps: true });

CollaborazioneSeoSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

export default models.CollaborazioneSeo || model("CollaborazioneSeo", CollaborazioneSeoSchema);
