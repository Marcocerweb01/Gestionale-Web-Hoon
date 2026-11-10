import { Schema, model, models } from "mongoose";

const ChiusuraAttivazioneSchema = new Schema(
  {
    categoria: {
      type: String,
      enum: ["chiusura", "attivazione"],
      required: true,
      index: true,
    },
    stato: {
      type: String,
      enum: ["programmata", "attiva", "completata", "annullata", "errore"],
      default: "programmata",
      index: true,
    },
    dataEvento: { type: Date, required: true, index: true },

    // Chiusura di una collaborazione esistente.
    collaborazioneTipo: {
      type: String,
      enum: ["social", "webdesign", "webdesign-v2", "googleads"],
      default: null,
    },
    collaborazioneId: { type: Schema.Types.ObjectId, default: null },
    collaborazioneEtichetta: { type: String, default: "" },

    // Anagrafica inserita manualmente per una futura attivazione.
    ragioneSociale: { type: String, trim: true, default: "" },
    referente: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    telefono: { type: String, trim: true, default: "" },
    partitaIva: { type: String, trim: true, default: "" },
    servizio: { type: String, trim: true, default: "" },
    importo: { type: Number, min: 0, default: 0 },
    periodicita: {
      type: String,
      enum: ["una tantum", "mensile", "trimestrale", "semestrale", "annuale"],
      default: "mensile",
    },
    collaboratore: { type: Schema.Types.ObjectId, ref: "Collaboratore", default: null },
    collaboratoreNome: { type: String, default: "" },
    note: { type: String, trim: true, default: "" },

    eseguitaAt: { type: Date, default: null },
    errore: { type: String, default: "" },
    creataDa: { type: String, default: "" },
  },
  { timestamps: true }
);

ChiusuraAttivazioneSchema.index(
  { categoria: 1, collaborazioneTipo: 1, collaborazioneId: 1, stato: 1 },
  { name: "chiusura_collaborazione_stato" }
);

export default models.ChiusuraAttivazione ||
  model("ChiusuraAttivazione", ChiusuraAttivazioneSchema);
