import { Schema, model, models } from "mongoose";
import { COLLABORATOR_SUB_ROLES } from "./constants";

const AddressSchema = new Schema({
  via: { type: String, default: "" },
  citta: { type: String, default: "" },
  provincia: { type: String, default: "" },
  cap: { type: String, default: "" },
  nazione: { type: String, default: "Italia" },
}, { _id: false });

const CollaboratoreProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, unique: true },
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  partitaIva: { type: String, default: "" },
  codiceFiscale: { type: String, default: "" },
  iban: { type: String, default: "" },
  intestatarioConto: { type: String, default: "" },
  indirizzo: AddressSchema,
  subRoles: { type: [String], enum: COLLABORATOR_SUB_ROLES, default: [] },
  competenze: { type: [String], default: [] },
  seniority: {
    type: String,
    enum: ["junior", "middle", "senior", "lead"],
    default: "middle",
  },
  disponibilitaSettimanaleOre: { type: Number, default: null },
  costoOrario: { type: Number, default: null },
  percentualeDefault: { type: Number, default: null },
  percentuale_hoon: { type: Number, enum: [50, 55, 60, 70], default: 50 },
  statoOperativo: {
    type: String,
    enum: ["attivo", "non_attivo", "in pausa"],
    default: "attivo",
  },
  noteAmministratore: { type: String, default: "" },
  metriche: {
    tot_fatturato: { type: Number, default: 0 },
    guadagno_da_hoon: { type: Number, default: 0 },
    totale_fatture_terzi: { type: Number, default: 0 },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

export default models.CollaboratoreProfileV3 ||
  model("CollaboratoreProfileV3", CollaboratoreProfileSchema);
