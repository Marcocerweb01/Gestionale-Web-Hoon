import { Schema, model, models } from "mongoose";

const TrancheSchema = new Schema({
  descrizione: { type: String, trim: true, default: "" },
  importo: { type: Schema.Types.Decimal128, default: "0.00" },
  scadenza: { type: Date, default: null },
  stato: {
    type: String,
    enum: ["da_pagare", "pagata", "scaduta"],
    default: "da_pagare",
  },
}, { _id: true });

const EventoSchema = new Schema({
  tipo: { type: String, enum: ["evento", "shooting"], default: "evento", index: true },
  nome: { type: String, required: true, trim: true },
  azienda: { type: Schema.Types.ObjectId, ref: "Azienda", default: null, index: true },
  dataInizio: { type: Date, required: true, index: true },
  dataFine: { type: Date, required: true },
  giornateEvento: [{ type: Date, required: true }],
  luogo: { type: String, required: true, trim: true },
  responsabile: { type: Schema.Types.ObjectId, ref: "Collaboratore", required: true, index: true },
  collaboratori: [{ type: Schema.Types.ObjectId, ref: "Collaboratore" }],
  postTotali: { type: Number, min: 0, default: 0 },
  postFatti: { type: Number, min: 0, default: 0 },
  appuntamentiTotali: { type: Number, min: 0, default: 0 },
  appuntamentiFatti: { type: Number, min: 0, default: 0 },
  inizioSocial: { type: Date, default: null },
  fineSocial: { type: Date, default: null },
  socialGestiti: [{ type: String, enum: ["instagram", "facebook", "tiktok", "youtube", "linkedin"] }],
  noteInterne: { type: String, default: "" },
  noteShooting: { type: String, default: "" },
  pagamentoTotale: { type: Schema.Types.Decimal128, default: "0.00" },
  tranche: { type: [TrancheSchema], default: [] },
  hardDisk: { type: Boolean, default: false },
  report: { type: Boolean, default: false },
  createdBy: { type: String, default: "" },
  updatedBy: { type: String, default: "" },
}, { timestamps: true });

EventoSchema.index({ collaboratori: 1, dataInizio: 1 });
EventoSchema.index({ responsabile: 1, dataInizio: 1 });
EventoSchema.index({ giornateEvento: 1 });

export default models.Evento || model("Evento", EventoSchema);
