import { Schema, model, models } from "mongoose";
import { COLLABORATION_TYPES, COLLABORATOR_SUB_ROLES } from "./constants";

const TeamMemberSchema = new Schema({
  collaboratoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true },
  subRole: { type: String, enum: COLLABORATOR_SUB_ROLES, required: true },
  ruoloNelProgetto: {
    type: String,
    enum: ["owner", "operativo", "supporto", "reviewer"],
    default: "operativo",
  },
  percentuale: { type: Number, default: null },
  cifraFissa: { type: Number, default: null },
  dataAssegnazione: { type: Date, default: Date.now },
  dataFineAssegnazione: { type: Date, default: null },
  attivo: { type: Boolean, default: true },
}, { _id: true });

const ServizioCollaborazioneSchema = new Schema({
  tipo: { type: String, enum: COLLABORATION_TYPES, required: true },
  nome: { type: String, required: true },
  stato: {
    type: String,
    enum: ["bozza", "attivo", "in pausa", "terminato"],
    default: "attivo",
  },
  budget: { type: Number, default: null },
  obiettivi: { type: String, default: "" },
}, { _id: true });

const CollaborazioneV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  titolo: { type: String, required: true, trim: true },
  tipo: { type: String, enum: COLLABORATION_TYPES, required: true, index: true },
  stato: {
    type: String,
    enum: ["bozza", "attiva", "in pausa", "terminata", "archiviata"],
    default: "bozza",
    index: true,
  },
  priorita: {
    type: String,
    enum: ["bassa", "media", "alta", "critica"],
    default: "media",
  },
  dataInizio: { type: Date, default: Date.now },
  dataFine: { type: Date, default: null },
  contratto: {
    durata: { type: String, default: "" },
    dataInizio: { type: Date, default: null },
    dataFine: { type: Date, default: null },
    rinnovoAutomatico: { type: Boolean, default: false },
    valoreMensile: { type: Number, default: 0 },
    valoreTotale: { type: Number, default: 0 },
  },
  team: [TeamMemberSchema],
  servizi: [ServizioCollaborazioneSchema],
  avanzamento: {
    percentuale: { type: Number, min: 0, max: 100, default: 0 },
    statoSintetico: { type: String, default: "" },
    ultimoAggiornamentoAt: { type: Date, default: null },
  },
  notebookId: { type: Schema.Types.ObjectId, ref: "NotebookV3", default: null },
  calendarioId: { type: Schema.Types.ObjectId, ref: "CalendarioOperativoV3", default: null },
  chatId: { type: Schema.Types.ObjectId, ref: "ChatThreadV3", default: null },
  legacyRef: {
    model: {
      type: String,
      enum: ["Collaborazione", "CollaborazioneWebDesignV2", "GoogleAds", ""],
      default: "",
    },
    id: { type: Schema.Types.ObjectId, default: null },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

CollaborazioneV3Schema.index({ agenziaId: 1, aziendaId: 1, stato: 1 });
CollaborazioneV3Schema.index({ "team.collaboratoreId": 1, stato: 1 });

export default models.CollaborazioneV3 || model("CollaborazioneV3", CollaborazioneV3Schema);
