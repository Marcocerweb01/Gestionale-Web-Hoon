import { Schema, model, models } from "mongoose";

const NotificationDeliverySchema = new Schema({
  destinatario: { type: Schema.Types.ObjectId, ref: "Collaboratore", required: true, index: true },
  channel: { type: String, enum: ["email", "whatsapp"], required: true },
  target: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: "" },
  status: { type: String, enum: ["pending", "sent", "failed", "skipped"], default: "pending", index: true },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: "" },
  sentAt: { type: Date, default: null },
  dedupeKey: { type: String, required: true, unique: true },
}, { timestamps: true });

export default models.NotificationDelivery || model("NotificationDelivery", NotificationDeliverySchema);
