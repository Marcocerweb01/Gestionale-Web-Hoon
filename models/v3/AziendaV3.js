import { Schema, model, models } from "mongoose";

const AddressSchema = new Schema({
  via: { type: String, default: "" },
  citta: { type: String, default: "" },
  provincia: { type: String, default: "" },
  cap: { type: String, default: "" },
  nazione: { type: String, default: "Italia" },
}, { _id: false });

const ReferenteSchema = new Schema({
  nome: { type: String, default: "" },
  cognome: { type: String, default: "" },
  ruolo: { type: String, default: "" },
  email: { type: String, default: "", lowercase: true, trim: true },
  telefono: { type: String, default: "" },
  principale: { type: Boolean, default: false },
}, { _id: true });

const AziendaV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  ragioneSociale: { type: String, required: true, trim: true },
  etichetta: { type: String, default: "", trim: true },
  partitaIva: { type: String, default: "", trim: true },
  codiceFiscale: { type: String, default: "", trim: true },
  codiceUnivoco: { type: String, default: "", trim: true },
  pec: { type: String, default: "", trim: true, lowercase: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  telefono: { type: String, default: "", trim: true },
  sitoWeb: { type: String, default: "", trim: true },
  settore: { type: String, default: "", trim: true },
  descrizioneAttivita: { type: String, default: "" },
  indirizzoLegale: AddressSchema,
  indirizzoOperativo: AddressSchema,
  referenti: [ReferenteSchema],
  utentiPortale: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
  statoCliente: {
    type: String,
    enum: ["lead", "attivo", "in pausa", "ex_cliente"],
    default: "lead",
    index: true,
  },
  origine: {
    type: String,
    enum: ["commerciale", "referal", "chiamata", "ricerca", "social", "altro"],
    default: "altro",
  },
  commercialeOwner: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  tags: { type: [String], default: [] },
  noteInterne: { type: String, default: "" },
  privacy: {
    consensoMarketing: { type: Boolean, default: false },
    consensoTrattamentoDati: { type: Boolean, default: false },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

AziendaV3Schema.index({ agenziaId: 1, ragioneSociale: 1 });
AziendaV3Schema.index({ agenziaId: 1, partitaIva: 1 });

export default models.AziendaV3 || model("AziendaV3", AziendaV3Schema);
