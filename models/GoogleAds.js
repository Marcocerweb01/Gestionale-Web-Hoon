import { Schema, model, models } from 'mongoose';

const GoogleAdsSchema = new Schema(
  {
    cliente: {
      type: Schema.Types.ObjectId,
      ref: "Azienda",
      required: true,
    },
    collaboratore: {
      type: Schema.Types.ObjectId,
      ref: "Collaboratore",
      required: true,
    },
    clienteEtichetta: {
      type: String,
      required: true,
    },
    collaboratoreNome: {
      type: String,
      required: true,
    },
    collaboratoreCognome: {
      type: String,
      required: true,
    },
    contattato: {
      type: Boolean,
      default: false,
    },
    campagnaAvviata: {
      type: Boolean,
      default: false,
    },
    campagnaTerminata: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indice composto per evitare duplicati cliente-collaboratore
GoogleAdsSchema.index({ cliente: 1, collaboratore: 1 }, { unique: true });

export default models.GoogleAds || model('GoogleAds', GoogleAdsSchema);
