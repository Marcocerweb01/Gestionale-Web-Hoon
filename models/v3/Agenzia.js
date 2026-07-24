import { Schema, model, models } from "mongoose";

const AddressSchema = new Schema({
  via: { type: String, default: "" },
  citta: { type: String, default: "" },
  provincia: { type: String, default: "" },
  cap: { type: String, default: "" },
  nazione: { type: String, default: "Italia" },
}, { _id: false });

const AgenziaSchema = new Schema({
  nome: { type: String, required: true, trim: true },
  ragioneSociale: { type: String, default: "", trim: true },
  partitaIva: { type: String, default: "", trim: true },
  codiceFiscale: { type: String, default: "", trim: true },
  codiceUnivoco: { type: String, default: "", trim: true },
  pec: { type: String, default: "", trim: true, lowercase: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  telefono: { type: String, default: "", trim: true },
  sitoWeb: { type: String, default: "", trim: true },
  indirizzo: AddressSchema,
  logoUrl: { type: String, default: "" },
  impostazioni: {
    timezone: { type: String, default: "Europe/Rome" },
    valuta: { type: String, default: "EUR" },
    resetMensileAbilitato: { type: Boolean, default: true },
    resetTrimestraleAbilitato: { type: Boolean, default: true },
    soglieNotificheDomini: { type: [Number], default: [30, 20, 10, 5, 3, 2, 1] },
  },
  billing: {
    iban: { type: String, default: "" },
    banca: { type: String, default: "" },
    intestatario: { type: String, default: "" },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

AgenziaSchema.index({ email: 1 }, { unique: true });

export default models.AgenziaV3 || model("AgenziaV3", AgenziaSchema);
