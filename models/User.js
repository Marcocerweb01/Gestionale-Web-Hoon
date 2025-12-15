import { Schema, model, models } from "mongoose";

const AziendaSchema = new Schema({
  nome: { type: String, required: false },
  cognome: { type: String, required: false },
  email: { type: String, required: false, unique: true }, // era true
  password: { type: String, required: false },             // era true
  partitaIva: { type: String, required: false },           // era true
  ragioneSociale: { type: String, required: false },       // era true
  etichetta: { type: String, required: false },
  indirizzo: { type: String, required: false },
  pagamento: { type: Boolean, default: false },
  livelloAccesso: { type: Number, default: 3 },
}, { timestamps: true });

const CollaboratoreSchema = new Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  partitaIva: { type: String, required: true },
  subRole: {
    type: String,
    enum: ["commerciale", "smm", "web designer"],
    required: true,
  },
  status: {
    type: String,
    enum: ["attivo", "non_attivo"],
    default: "attivo",
    required: true
  },
  noteAmministratore: {
    type: String,
    default: "",
    required: false
  },
  // Campi nuovo sistema pagamenti
  percentuale_hoon: {
    type: Number,
    enum: [50, 55, 60, 70],
    default: 50,
    required: true
  },
  tot_fatturato: {
    type: Number,
    default: 0
  },
  guadagno_da_hoon: {
    type: Number,
    default: 0
  },
  totale_fatture_terzi: {
    type: Number,
    default: 0
  },
  livelloAccesso: { type: Number, default: 2 },
}, { timestamps: true });

const AmministratoreSchema = new Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const ContattoSchema = new Schema({
  referente: { type: String, required: true },
  numero:{type:String, required: true},
  email: { type: String, required: true, unique: true },
  ragioneSociale: { type: String },
  indirizzo: { type: String },
  notes: { type: String },
  livelloAccesso: { type: Number, default: 3 },
}, { timestamps: true });

export const Azienda = models.Azienda || model("Azienda", AziendaSchema);
export const Collaboratore = models.Collaboratore || model("Collaboratore", CollaboratoreSchema);
export const Amministratore = models.Amministratore || model("Amministratore", AmministratoreSchema);
export const Contatto = models.Contatto || model("Contatto", ContattoSchema);
