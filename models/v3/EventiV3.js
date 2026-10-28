import { Schema, model, models } from "mongoose";

const TrancheEventoSchema = new Schema({
  descrizione: { type: String, default: "", trim: true },
  importo: { type: Schema.Types.Decimal128, default: "0.00" },
  scadenza: { type: Date, default: null },
  stato: { type: String, enum: ["da_pagare", "pagata", "scaduta"], default: "da_pagare" },
}, { _id: true });

const EventoV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", default: null, index: true },
  tipo: { type: String, enum: ["evento", "shooting"], default: "evento", index: true },
  nome: { type: String, required: true, trim: true },
  dataInizio: { type: Date, required: true, index: true },
  dataFine: { type: Date, required: true },
  giornate: [{ type: Date, required: true }],
  luogo: { type: String, required: true, trim: true },
  responsabileId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  collaboratoriInvitati: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
  obiettivi: {
    postPrevisti: { type: Number, min: 0, default: 0 },
    postFatti: { type: Number, min: 0, default: 0 },
    appuntamentiPrevisti: { type: Number, min: 0, default: 0 },
    appuntamentiFatti: { type: Number, min: 0, default: 0 },
  },
  finestraSocial: {
    inizio: { type: Date, default: null },
    fine: { type: Date, default: null },
    piattaforme: [{ type: String, enum: ["instagram", "facebook", "tiktok", "youtube", "linkedin"] }],
  },
  noteInterne: { type: String, default: "" },
  noteShooting: { type: String, default: "" },
  pagamentoTotale: { type: Schema.Types.Decimal128, default: "0.00" },
  tranche: { type: [TrancheEventoSchema], default: [] },
  hardDisk: { type: Boolean, default: false },
  report: { type: Boolean, default: false },
  legacyRef: {
    model: { type: String, enum: ["Evento", ""], default: "" },
    id: { type: Schema.Types.ObjectId, default: null },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

const RispostaGiornalieraSchema = new Schema({
  data: { type: Date, required: true },
  stato: { type: String, enum: ["si", "no", "forse"], required: true },
  nota: { type: String, default: "", trim: true },
}, { _id: false });

const DisponibilitaEventoV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  eventoId: { type: Schema.Types.ObjectId, ref: "EventoV3", required: true, index: true },
  collaboratoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  stato: { type: String, enum: ["si", "no", "forse"], required: true },
  nota: { type: String, default: "", trim: true },
  risposteGiornaliere: { type: [RispostaGiornalieraSchema], default: [] },
}, { timestamps: true });

const AssegnazioneEventoV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  eventoId: { type: Schema.Types.ObjectId, ref: "EventoV3", required: true, index: true },
  collaboratoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  dataLavoro: { type: Date, required: true, index: true },
  mansione: { type: String, required: true, trim: true },
  noteCollaboratore: { type: String, default: "" },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

EventoV3Schema.index({ agenziaId: 1, dataInizio: 1, tipo: 1 });
EventoV3Schema.index({ agenziaId: 1, responsabileId: 1, dataInizio: 1 });
EventoV3Schema.index(
  { agenziaId: 1, "legacyRef.model": 1, "legacyRef.id": 1 },
  { unique: true, partialFilterExpression: { "legacyRef.id": { $type: "objectId" } } }
);
DisponibilitaEventoV3Schema.index({ agenziaId: 1, eventoId: 1, collaboratoreId: 1 }, { unique: true });
AssegnazioneEventoV3Schema.index({ agenziaId: 1, eventoId: 1, dataLavoro: 1, collaboratoreId: 1 }, { unique: true });

export const EventoV3 = models.EventoV3 || model("EventoV3", EventoV3Schema);
export const DisponibilitaEventoV3 = models.DisponibilitaEventoV3 || model("DisponibilitaEventoV3", DisponibilitaEventoV3Schema);
export const AssegnazioneEventoV3 = models.AssegnazioneEventoV3 || model("AssegnazioneEventoV3", AssegnazioneEventoV3Schema);
