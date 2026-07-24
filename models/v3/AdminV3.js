import { Schema, model, models } from "mongoose";
import { COLLABORATOR_SUB_ROLES } from "./constants";

const FileAssetSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", default: null, index: true },
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", default: null, index: true },
  nome: { type: String, required: true },
  mimeType: { type: String, default: "" },
  size: { type: Number, default: 0 },
  url: { type: String, required: true },
  categoria: { type: String, default: "" },
}, { timestamps: true });

const CredentialVaultItemSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", default: null, index: true },
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", default: null, index: true },
  titolo: { type: String, required: true },
  categoria: {
    type: String,
    enum: ["dominio", "hosting", "wordpress", "social", "ads", "email", "altro"],
    default: "altro",
  },
  url: { type: String, default: "" },
  username: { type: String, default: "" },
  passwordEncrypted: { type: String, required: true },
  noteEncrypted: { type: String, default: "" },
  visibileA: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
  ultimoAccessoAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

const DominioSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", default: null, index: true },
  webDesignerId: { type: Schema.Types.ObjectId, ref: "UserV3", default: null, index: true },
  registrar: { type: String, default: "" },
  urlDominio: { type: String, required: true, trim: true },
  dataAcquisto: { type: Date, default: null },
  dataScadenza: { type: Date, required: true, index: true },
  rinnovoAutomatico: { type: Boolean, default: false },
  stato: {
    type: String,
    enum: ["attivo", "in_scadenza", "scaduto", "trasferito"],
    default: "attivo",
  },
  credenzialeId: { type: Schema.Types.ObjectId, ref: "CredentialVaultItemV3", default: null },
  note: { type: String, default: "" },
  alertInviati: [{
    soglia: { type: Number, required: true },
    dataInvio: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const ValutazioneCollaboratoreSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  collaboratoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  periodo: {
    tipo: { type: String, enum: ["mensile", "trimestrale"], required: true },
    anno: { type: Number, required: true },
    trimestre: { type: Number, min: 1, max: 4, default: null },
    mese: { type: Number, min: 1, max: 12, default: null },
    dataInizio: { type: Date, required: true },
    dataFine: { type: Date, required: true },
  },
  ruoloValutato: { type: String, enum: COLLABORATOR_SUB_ROLES, required: true },
  valutatoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true },
  metriche: {
    puntualita: { type: Number, min: 1, max: 5, default: null },
    qualita: { type: Number, min: 1, max: 5, default: null },
    comunicazione: { type: Number, min: 1, max: 5, default: null },
    autonomia: { type: Number, min: 1, max: 5, default: null },
    rispettoObiettivi: { type: Number, min: 1, max: 5, default: null },
  },
  kpi: {
    previsti: { type: Number, default: 0 },
    completati: { type: Number, default: 0 },
    percentualeCompletamento: { type: Number, default: 0 },
  },
  note: { type: String, default: "" },
  esito: {
    type: String,
    enum: ["ottimo", "buono", "sufficiente", "critico"],
    default: "buono",
  },
  azioniRichieste: { type: String, default: "" },
}, { timestamps: true });

const ResetLogSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  tipo: { type: String, enum: ["mensile", "trimestrale", "valutazione"], required: true },
  periodo: {
    anno: { type: Number, required: true },
    mese: { type: Number, min: 1, max: 12, default: null },
    trimestre: { type: Number, min: 1, max: 4, default: null },
    dataInizio: { type: Date, default: null },
    dataFine: { type: Date, default: null },
  },
  target: {
    collaborazioneIds: [{ type: Schema.Types.ObjectId, ref: "CollaborazioneV3" }],
    collaboratoreIds: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
  },
  snapshotPrima: { type: Schema.Types.Mixed, default: {} },
  snapshotDopo: { type: Schema.Types.Mixed, default: {} },
  eseguitoDa: { type: Schema.Types.ObjectId, ref: "UserV3", required: true },
  eseguitoAt: { type: Date, default: Date.now },
  note: { type: String, default: "" },
}, { timestamps: true });

const KnowledgeItemSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  tipo: { type: String, enum: ["dispensa", "faq", "operation"], required: true, index: true },
  titolo: { type: String, required: true },
  contenuto: { type: String, default: "" },
  categoria: { type: String, default: "", index: true },
  tags: { type: [String], default: [] },
  fileUrl: { type: String, default: "" },
  visibileA: {
    type: [String],
    enum: ["admin", "collaboratori", "aziende"],
    default: ["collaboratori"],
  },
  subRolesVisibili: { type: [String], enum: COLLABORATOR_SUB_ROLES, default: [] },
  stato: {
    type: String,
    enum: ["bozza", "pubblicato", "archiviato"],
    default: "bozza",
  },
  suggeritoDa: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  approvatoDa: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  ordine: { type: Number, default: 0 },
}, { timestamps: true });

const AuditLogSchema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  azione: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, default: null, index: true },
  before: { type: Schema.Types.Mixed, default: null },
  after: { type: Schema.Types.Mixed, default: null },
  ip: { type: String, default: "" },
  userAgent: { type: String, default: "" },
}, { timestamps: { createdAt: true, updatedAt: false } });

DominioSchema.index({ agenziaId: 1, urlDominio: 1 }, { unique: true });
ValutazioneCollaboratoreSchema.index(
  { collaboratoreId: 1, "periodo.tipo": 1, "periodo.anno": 1, "periodo.trimestre": 1, "periodo.mese": 1, ruoloValutato: 1 },
  { unique: true }
);

export const FileAssetV3 = models.FileAssetV3 || model("FileAssetV3", FileAssetSchema);
export const CredentialVaultItemV3 = models.CredentialVaultItemV3 ||
  model("CredentialVaultItemV3", CredentialVaultItemSchema);
export const DominioV3 = models.DominioV3 || model("DominioV3", DominioSchema);
export const ValutazioneCollaboratoreV3 = models.ValutazioneCollaboratoreV3 ||
  model("ValutazioneCollaboratoreV3", ValutazioneCollaboratoreSchema);
export const ResetLogV3 = models.ResetLogV3 || model("ResetLogV3", ResetLogSchema);
export const KnowledgeItemV3 = models.KnowledgeItemV3 || model("KnowledgeItemV3", KnowledgeItemSchema);
export const AuditLogV3 = models.AuditLogV3 || model("AuditLogV3", AuditLogSchema);
