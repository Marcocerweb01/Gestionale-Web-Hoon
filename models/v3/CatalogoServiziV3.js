import { Schema, model, models } from "mongoose";
import { COLLABORATION_TYPES } from "./constants";

const CatalogoServizioV3Schema = new Schema({
  agenziaId: { type: Schema.Types.ObjectId, ref: "AgenziaV3", required: true, index: true },
  codice: { type: String, required: true, trim: true, lowercase: true },
  nome: { type: String, required: true, trim: true },
  tipoCollaborazione: { type: String, enum: COLLABORATION_TYPES, default: "mista" },
  descrizione: { type: String, default: "" },
  prezzoBase: { type: Number, min: 0, default: null },
  valuta: { type: String, enum: ["EUR"], default: "EUR" },
  attivo: { type: Boolean, default: true, index: true },
  legacyRef: {
    model: { type: String, enum: ["Servizio", ""], default: "" },
    id: { type: Schema.Types.ObjectId, default: null },
  },
}, { timestamps: true });

CatalogoServizioV3Schema.index({ agenziaId: 1, codice: 1 }, { unique: true });
CatalogoServizioV3Schema.index(
  { agenziaId: 1, "legacyRef.model": 1, "legacyRef.id": 1 },
  { unique: true, partialFilterExpression: { "legacyRef.id": { $type: "objectId" } } }
);

export default models.CatalogoServizioV3 || model("CatalogoServizioV3", CatalogoServizioV3Schema);
