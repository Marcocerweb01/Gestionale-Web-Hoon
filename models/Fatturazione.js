import { Schema, model, models } from "mongoose";

const FatturazioneSchema = new Schema({
  data: {
    type: Date,
    required: true,
    default: Date.now
  },
  mese: {
    type: String, // Formato: "YYYY-MM" es. "2025-10"
    required: true,
  },
  collaboratore: {
    type: Schema.Types.ObjectId,
    ref: "Collaboratore",
    required: true,
  },
  totale: {
    type: Number,
    default: null, // null quando non ancora compilato
  },
  statoCollaboratore: {
    type: String,
    enum: ["non emessa", "emessa"],
    default: "non emessa",
  },
  statoAmministratore: {
    type: String,
    enum: ["non pagata", "pagata"],
    default: "non pagata",
  },
}, {
  timestamps: true, // Aggiunge createdAt e updatedAt automaticamente
});

// Indice composto per evitare duplicati (un collaboratore per mese)
FatturazioneSchema.index({ collaboratore: 1, mese: 1 }, { unique: true });

const Fatturazione = models.Fatturazione || model("Fatturazione", FatturazioneSchema);

export default Fatturazione;
