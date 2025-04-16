import mongoose, { Schema, model, models } from 'mongoose';

const CollaborazioneWebDesignSchema = new Schema(
  {
    tipoProgetto: {
      type: String,
      enum: ["e-commerce", "sito vetrina", "web app"],
      required: true,
    },
    cliente: { type: Schema.Types.ObjectId, ref: "Azienda", required: true },
    webDesigner: { type: Schema.Types.ObjectId, ref: "Collaboratore", required: true },
    aziendaRagioneSociale: {
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
    fasiProgetto: [
      {
        nome: { type: String, required: true },
        completata: { type: Boolean, default: false },
        dataCompletamento: { type: Date, default: null },
      },
    ],
    faseAttuale: { type: Number, default: 0 }, // Indice della fase attuale
    note: [{ type: Schema.Types.ObjectId, ref: "Nota" }], // Collegamento al feed delle note
  },
  { timestamps: true }
);

const CollaborazioneWebDesign =
  models.CollaborazioneWebDesign ||
  model("CollaborazioneWebDesign", CollaborazioneWebDesignSchema);

export default CollaborazioneWebDesign;