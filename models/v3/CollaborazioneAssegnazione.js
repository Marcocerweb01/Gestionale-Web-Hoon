import { Schema, model, models } from "mongoose";
import { COLLABORATOR_SUB_ROLES } from "./constants";

const ASSIGNMENT_PERMISSIONS = [
  "read",
  "update_status",
  "manage_posts",
  "manage_calendar",
  "manage_notes",
  "manage_ads",
  "reply_chat",
  "manage_tickets",
];

const CollaborazioneAssegnazioneSchema = new Schema({
  collaborazioneId: { type: Schema.Types.ObjectId, ref: "CollaborazioneV3", required: true, index: true },
  aziendaId: { type: Schema.Types.ObjectId, ref: "AziendaV3", required: true, index: true },
  collaboratoreId: { type: Schema.Types.ObjectId, ref: "UserV3", required: true, index: true },
  subRole: { type: String, enum: COLLABORATOR_SUB_ROLES, required: true, index: true },
  stato: {
    type: String,
    enum: ["attiva", "sospesa", "terminata"],
    default: "attiva",
    index: true,
  },
  dataInizio: { type: Date, default: Date.now },
  dataFine: { type: Date, default: null },
  percentuale: { type: Number, default: null },
  cifraFissa: { type: Number, default: null },
  permessiCollaborazione: {
    type: [String],
    enum: ASSIGNMENT_PERMISSIONS,
    default: ["read"],
  },
  motivoSpostamento: { type: String, default: "" },
  assegnatoDa: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

CollaborazioneAssegnazioneSchema.index(
  { collaborazioneId: 1, collaboratoreId: 1, subRole: 1, stato: 1 },
  { unique: false }
);

export default models.CollaborazioneAssegnazioneV3 ||
  model("CollaborazioneAssegnazioneV3", CollaborazioneAssegnazioneSchema);
