import { Schema, model, models } from "mongoose";
import { COLLABORATOR_SUB_ROLES, PERMISSIONS, USER_TYPES } from "./constants";

const UserV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  tipo: { type: String, enum: USER_TYPES, required: true, index: true },
  nome: { type: String, required: true, trim: true },
  cognome: { type: String, default: "", trim: true },
  displayName: { type: String, default: "", trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  telefono: { type: String, default: "", trim: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, default: "" },
  stato: {
    type: String,
    enum: ["attivo", "sospeso", "disattivato"],
    default: "attivo",
    index: true,
  },
  subRoles: {
    type: [String],
    enum: COLLABORATOR_SUB_ROLES,
    default: [],
  },
  permissions: {
    type: [String],
    enum: PERMISSIONS,
    default: [],
  },
  ultimoAccessoAt: { type: Date, default: null },
  preferenze: {
    sidebarCollapsed: { type: Boolean, default: false },
    dashboardDefaultView: { type: String, default: "dashboard" },
    notificheEmail: { type: Boolean, default: true },
    notificheInApp: { type: Boolean, default: true },
  },
  sicurezza: {
    mustChangePassword: { type: Boolean, default: false },
    passwordUpdatedAt: { type: Date, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: "UserV3", default: null },
}, { timestamps: true });

UserV3Schema.index({ agenziaId: 1, email: 1 }, { unique: true });
UserV3Schema.index({ agenziaId: 1, tipo: 1, stato: 1 });

export default models.UserV3 || model("UserV3", UserV3Schema);
