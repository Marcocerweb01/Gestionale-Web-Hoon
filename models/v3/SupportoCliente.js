import { Schema, model, models } from "mongoose";

const ChatThreadSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", default: null, index: true },
  partecipanti: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
  visibilita: {
    type: String,
    enum: ["cliente_team", "interna"],
    default: "cliente_team",
  },
  ultimoMessaggioAt: { type: Date, default: null },
}, { timestamps: true });

const ChatMessageSchema = new Schema({
  threadId: { type: Schema.Types.ObjectId, ref: "ChatThreadV3", required: true, index: true },
  autoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true },
  testo: { type: String, required: true },
  allegati: [{ type: Schema.Types.ObjectId, ref: "FileAssetV3" }],
  lettoDa: [{
    userId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true },
    lettoAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const TicketSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", default: null, index: true },
  apertoDa: { type: Schema.Types.ObjectId, ref: "UserV3", required: true },
  assegnatoA: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
  titolo: { type: String, required: true },
  descrizione: { type: String, default: "" },
  categoria: {
    type: String,
    enum: ["assistenza", "bug", "contenuti", "dominio", "pagamento", "altro"],
    default: "assistenza",
  },
  priorita: {
    type: String,
    enum: ["bassa", "media", "alta", "urgente"],
    default: "media",
  },
  stato: {
    type: String,
    enum: ["aperto", "in_lavorazione", "in_attesa_cliente", "risolto", "chiuso"],
    default: "aperto",
    index: true,
  },
  messaggi: [{ type: Schema.Types.ObjectId, ref: "ChatMessageV3" }],
  closedAt: { type: Date, default: null },
}, { timestamps: true });

ChatMessageSchema.index({ threadId: 1, createdAt: 1 });
TicketSchema.index({ agenziaId: 1, stato: 1, priorita: 1 });

export const ChatThreadV3 = models.ChatThreadV3 || model("ChatThreadV3", ChatThreadSchema);
export const ChatMessageV3 = models.ChatMessageV3 || model("ChatMessageV3", ChatMessageSchema);
export const TicketV3 = models.TicketV3 || model("TicketV3", TicketSchema);
