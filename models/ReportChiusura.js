import { Schema, model, models } from "mongoose";

const ReportChiusuraSchema = new Schema({
  tipo: { type: String, enum: ["mensile", "trimestrale"], required: true, index: true },
  periodoKey: { type: String, required: true },
  titolo: { type: String, required: true },
  periodoInizio: { type: Date, required: true },
  periodoFine: { type: Date, required: true },
  stato: {
    type: String,
    enum: ["generazione", "da_visionare", "reset_in_corso", "completato", "errore"],
    default: "generazione",
    index: true,
  },
  collaborazioniSnapshot: { type: [Schema.Types.Mixed], default: [] },
  numeroCollaborazioni: { type: Number, default: 0 },
  fileNome: { type: String, default: "" },
  fileMimeType: {
    type: String,
    default: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  fileBuffer: { type: Buffer, default: null, select: false },
  generatoAt: { type: Date, default: null },
  visionatoAt: { type: Date, default: null },
  visionatoDa: { type: Schema.Types.ObjectId, default: null },
  approvatoAt: { type: Date, default: null },
  approvatoDa: { type: Schema.Types.ObjectId, default: null },
  resetRisultato: { type: Schema.Types.Mixed, default: null },
  errore: { type: String, default: "" },
}, { timestamps: true });

ReportChiusuraSchema.index({ tipo: 1, periodoKey: 1 }, { unique: true });

export default models.ReportChiusura || model("ReportChiusura", ReportChiusuraSchema);
