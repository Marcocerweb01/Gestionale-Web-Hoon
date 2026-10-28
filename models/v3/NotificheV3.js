import { Schema, model, models } from "mongoose";

const NotificaV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  destinatarioId: { type: Schema.Types.ObjectId, ref: "UserV3", default: null, index: true },
  tipo: {
    type: String,
    enum: ["nota_problema", "dominio_scadenza", "fine_mese", "evento_disponibilita", "shooting_disponibilita", "seo_assegnazione", "sistema"],
    required: true,
    index: true,
  },
  titolo: { type: String, required: true },
  messaggio: { type: String, required: true },
  link: { type: String, default: "" },
  lettaAt: { type: Date, default: null, index: true },
  entity: {
    type: { type: String, default: "" },
    id: { type: Schema.Types.ObjectId, default: null },
  },
  dedupeKey: { type: String, default: "" },
  legacyRef: {
    model: { type: String, enum: ["Notifica", ""], default: "" },
    id: { type: Schema.Types.ObjectId, default: null },
  },
}, { timestamps: true });

const NotificationDeliveryV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  notificaId: { type: Schema.Types.ObjectId, ref: "NotificaV3", default: null, index: true },
  destinatarioId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  channel: { type: String, enum: ["in_app", "email", "whatsapp"], required: true },
  target: { type: String, required: true },
  subject: { type: String, default: "" },
  message: { type: String, required: true },
  link: { type: String, default: "" },
  status: { type: String, enum: ["pending", "sent", "delivered", "failed", "skipped"], default: "pending", index: true },
  attempts: { type: Number, min: 0, default: 0 },
  lastError: { type: String, default: "" },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  dedupeKey: { type: String, required: true },
  legacyRef: {
    model: { type: String, enum: ["NotificationDelivery", ""], default: "" },
    id: { type: Schema.Types.ObjectId, default: null },
  },
}, { timestamps: true });

NotificaV3Schema.index({ agenziaId: 1, destinatarioId: 1, lettaAt: 1, createdAt: -1 });
NotificaV3Schema.index(
  { agenziaId: 1, destinatarioId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string", $gt: "" } } }
);
NotificationDeliveryV3Schema.index({ agenziaId: 1, dedupeKey: 1 }, { unique: true });

export const NotificaV3 = models.NotificaV3 || model("NotificaV3", NotificaV3Schema);
export const NotificationDeliveryV3 = models.NotificationDeliveryV3 || model("NotificationDeliveryV3", NotificationDeliveryV3Schema);
