import { Schema, model, models } from "mongoose";

const KpiSchema = new Schema({
  impressions: { type: Number, default: 0 },
  click: { type: Number, default: 0 },
  costo: { type: Number, default: 0 },
  conversioni: { type: Number, default: 0 },
  cpa: { type: Number, default: 0 },
}, { _id: false });

const CampagnaAdsSchema = new Schema({
  nome: { type: String, required: true },
  tipo: { type: String, default: "" },
  budget: { type: Number, default: 0 },
  stato: {
    type: String,
    enum: ["bozza", "attiva", "in pausa", "terminata"],
    default: "bozza",
  },
  dataAvvio: { type: Date, default: null },
  dataFine: { type: Date, default: null },
  kpi: KpiSchema,
}, { _id: true });

const TaskSchema = new Schema({
  titolo: { type: String, required: true },
  descrizione: { type: String, default: "" },
  stato: {
    type: String,
    enum: ["da_fare", "in_corso", "bloccato", "completato"],
    default: "da_fare",
  },
  dataPrevista: { type: Date, default: null },
  dataCompletamento: { type: Date, default: null },
  assegnatoA: [{ type: Schema.Types.ObjectId, ref: "UserV3" }],
}, { _id: true });

const SmmServiceSchema = new Schema({
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", required: true, unique: true },
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  piattaforme: {
    type: [String],
    enum: ["instagram", "facebook", "tiktok", "linkedin"],
    default: [],
  },
  pianoEditoriale: {
    postPrevistiMese: { type: Number, default: 0 },
    storiesPrevisteMese: { type: Number, default: 0 },
    reelPrevistiMese: { type: Number, default: 0 },
    appuntamentiPrevistiMese: { type: Number, default: 0 },
  },
  contatoriMensili: {
    post_ig_fb_fatti: { type: Number, default: 0 },
    post_tiktok_fatti: { type: Number, default: 0 },
    post_linkedin_fatti: { type: Number, default: 0 },
    appuntamenti_fatti: { type: Number, default: 0 },
  },
  contatoriTrimestrali: {
    instagram_trim_fatti: { type: Number, default: 0 },
    instagram_trim_totali: { type: Number, default: 0 },
    tiktok_trim_fatti: { type: Number, default: 0 },
    tiktok_trim_totali: { type: Number, default: 0 },
    linkedin_trim_fatti: { type: Number, default: 0 },
    linkedin_trim_totali: { type: Number, default: 0 },
    appuntamenti_trimestrale_fatti: { type: Number, default: 0 },
    appuntamenti_trimestrale_totali: { type: Number, default: 0 },
  },
  storicoReset: [{ type: Schema.Types.ObjectId, ref: "ResetLogV3" }],
}, { timestamps: true });

const WebDesignServiceSchema = new Schema({
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", required: true, unique: true },
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  tipoProgetto: {
    type: String,
    enum: ["starter", "vetrina", "e-commerce", "custom"],
    required: true,
  },
  fasi: [{
    nome: { type: String, required: true },
    tasks: [TaskSchema],
    note: { type: String, default: "" },
  }],
  controlli: [{
    nome: { type: String, required: true },
    tasks: [TaskSchema],
    note: { type: String, default: "" },
  }],
  checklistPubblicazione: [{
    categoria: { type: String, required: true },
    items: [TaskSchema],
    note: { type: String, default: "" },
  }],
  interview: { type: Schema.Types.Mixed, default: {} },
  dominioId: { type: Schema.Types.ObjectId, ref: "DominioV3", default: null },
  ambiente: {
    cms: { type: String, default: "WordPress" },
    hosting: { type: String, default: "" },
    stagingUrl: { type: String, default: "" },
    produzioneUrl: { type: String, default: "" },
  },
  consegna: {
    dataPrevista: { type: Date, default: null },
    dataEffettiva: { type: Date, default: null },
    esito: { type: String, default: "" },
  },
}, { timestamps: true });

const SeoServiceSchema = new Schema({
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", required: true, unique: true },
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  audit: {
    dataAudit: { type: Date, default: null },
    stato: {
      type: String,
      enum: ["non_avviato", "in_corso", "completato"],
      default: "non_avviato",
    },
    fileUrl: { type: String, default: "" },
  },
  keyword: [{
    parola: { type: String, required: true },
    intento: { type: String, default: "" },
    priorita: { type: String, enum: ["bassa", "media", "alta"], default: "media" },
    volumeStimato: { type: Number, default: null },
    posizioneIniziale: { type: Number, default: null },
    posizioneAttuale: { type: Number, default: null },
  }],
  pagineOttimizzate: [{
    url: { type: String, required: true },
    keywordPrincipale: { type: String, default: "" },
    stato: { type: String, enum: ["da_fare", "in_corso", "completata"], default: "da_fare" },
    dataOttimizzazione: { type: Date, default: null },
  }],
  taskMensili: [TaskSchema],
  reportMensili: [{
    mese: { type: Number, min: 1, max: 12, required: true },
    anno: { type: Number, required: true },
    fileUrl: { type: String, default: "" },
    note: { type: String, default: "" },
  }],
}, { timestamps: true });

const GoogleAdsServiceSchema = new Schema({
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", required: true, unique: true },
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  accountId: { type: String, default: "" },
  customerId: { type: String, default: "" },
  budgetMensile: { type: Number, default: 0 },
  obiettivo: {
    type: String,
    enum: ["lead", "vendite", "traffico", "brand"],
    default: "lead",
  },
  campagne: [CampagnaAdsSchema],
  statoOperativo: {
    type: String,
    enum: ["da_contattare", "setup", "attiva", "in_pausa", "terminata"],
    default: "da_contattare",
  },
  note: { type: String, default: "" },
}, { timestamps: true });

const MetaAdsServiceSchema = new Schema({
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", required: true, unique: true },
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  businessManagerId: { type: String, default: "" },
  adAccountId: { type: String, default: "" },
  pixelId: { type: String, default: "" },
  budgetMensile: { type: Number, default: 0 },
  obiettivo: { type: String, default: "" },
  campagne: [CampagnaAdsSchema],
  creativita: [{
    titolo: { type: String, required: true },
    formato: { type: String, default: "" },
    stato: { type: String, enum: ["bozza", "approvata", "pubblicata", "archiviata"], default: "bozza" },
    fileAssetId: { type: Schema.Types.ObjectId, ref: "FileAssetV3", default: null },
  }],
  statoOperativo: {
    type: String,
    enum: ["da_contattare", "setup", "attiva", "in_pausa", "terminata"],
    default: "da_contattare",
  },
  note: { type: String, default: "" },
}, { timestamps: true });

export const SmmServiceV3 = models.SmmServiceV3 || model("SmmServiceV3", SmmServiceSchema);
export const WebDesignServiceV3 = models.WebDesignServiceV3 || model("WebDesignServiceV3", WebDesignServiceSchema);
export const SeoServiceV3 = models.SeoServiceV3 || model("SeoServiceV3", SeoServiceSchema);
export const GoogleAdsServiceV3 = models.GoogleAdsServiceV3 || model("GoogleAdsServiceV3", GoogleAdsServiceSchema);
export const MetaAdsServiceV3 = models.MetaAdsServiceV3 || model("MetaAdsServiceV3", MetaAdsServiceSchema);
