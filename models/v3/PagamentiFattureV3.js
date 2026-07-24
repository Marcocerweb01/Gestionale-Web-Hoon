import { Schema, model, models } from "mongoose";

const PagamentoV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", default: null, index: true },
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", default: null, index: true },
  assegnazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneAssegnazioneV3", default: null },
  tipo: { type: String, enum: ["entrata", "uscita"], required: true, index: true },
  importo: { type: Number, required: true },
  stato_pagamento: {
    type: String,
    enum: ["pagato", "non_pagato", "ragazzi"],
    default: "non_pagato",
    index: true,
  },
  servizio: { type: String, default: "" },
  numeroDocumento: { type: String, default: "" },
  dataCompetenzaDa: { type: Date, default: null },
  dataCompetenzaA: { type: Date, default: null },
  data_pagamento: { type: Date, default: null },
  scadenzaPagamento: { type: Date, default: null },
  mese: { type: Number, min: 1, max: 12, default: null },
  anno: { type: Number, default: null },
  metodoPagamento: { type: String, default: "" },
  note: { type: String, default: "" },
  allegati: [{ type: Schema.Types.ObjectId, ref: "FileAssetV3" }],
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

const FatturaCollaboratoreV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  collaboratoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  collaborazioneIds: [{ type: Schema.Types.ObjectId, ref: "CollaborazioneV3" }],
  assegnazioneIds: [{ type: Schema.Types.ObjectId, ref: "CollaborazioneAssegnazioneV3" }],
  mese: { type: String, required: true },
  totale: { type: Number, default: null },
  numeroFattura: { type: String, default: "" },
  dataEmissione: { type: Date, default: null },
  dataScadenza: { type: Date, default: null },
  statoCollaboratore: {
    type: String,
    enum: ["non emessa", "emessa"],
    default: "non emessa",
  },
  statoAmministratore: {
    type: String,
    enum: ["non pagata", "pagata"],
    default: "non pagata",
  },
  fileUrl: { type: String, default: "" },
  noteAdmin: { type: String, default: "" },
}, { timestamps: true });

PagamentoV3Schema.index({ agenziaId: 1, tipo: 1, anno: 1, mese: 1 });
FatturaCollaboratoreV3Schema.index({ collaboratoreId: 1, mese: 1 }, { unique: true });

export const PagamentoV3 = models.PagamentoV3 || model("PagamentoV3", PagamentoV3Schema);
export const FatturaCollaboratoreV3 = models.FatturaCollaboratoreV3 ||
  model("FatturaCollaboratoreV3", FatturaCollaboratoreV3Schema);
