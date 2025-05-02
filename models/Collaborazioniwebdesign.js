import mongoose, { Schema, model, models } from 'mongoose';

const CollaborazioneWebDesignSchema = new Schema(
  {
    tipoProgetto: {
      type: String,
      enum: ["e-commerce", "sito vetrina", "sito starter"],
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
    tasks: [
      {
        nome: { type: String, required: true },
        dataInizio: { type: Date, default: null },
        dataFine: { type: Date, default: null },
        tempistica: { type: String, required: true }, // Es. "3 giorni", "5 ore"
        completata: { type: Boolean, default: false },
      },
    ],
    note: { type: String, default: "" }, // Annotazioni generali
    problemi: { type: String, default: "" }, // Problemi riscontrati
    dataInizioContratto: { type: Date, required: true }, // Data di inizio contratto
    dataFineContratto: { type: Date, required: true }, // Data di fine contratto
  },
  { timestamps: true }
);

const CollaborazioneWebDesign =
  models.CollaborazioneWebDesign ||
  model("CollaborazioneWebDesign", CollaborazioneWebDesignSchema);

export default CollaborazioneWebDesign;