import { Schema, model, models } from "mongoose";

const CalendarioItemSchema = new Schema({
  titolo: { type: String, required: true },
  descrizione: { type: String, default: "" },
  tipo: {
    type: String,
    enum: ["task", "appuntamento", "scadenza", "controllo", "pubblicazione"],
    default: "task",
  },
  dataInizio: { type: Date, default: null },
  dataFine: { type: Date, default: null },
  giornoOperativo: { type: Number, default: null },
  assegnatoA: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
  stato: {
    type: String,
    enum: ["da_fare", "in_corso", "bloccato", "completato"],
    default: "da_fare",
  },
  priorita: {
    type: String,
    enum: ["bassa", "media", "alta", "critica"],
    default: "media",
  },
  note: { type: String, default: "" },
}, { _id: true, timestamps: true });

const CalendarioOperativoSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  items: [CalendarioItemSchema],
}, { timestamps: true });

CalendarioOperativoSchema.index({ collaborazioneId: 1 }, { unique: true });

export default models.CalendarioOperativoV3 ||
  model("CalendarioOperativoV3", CalendarioOperativoSchema);
