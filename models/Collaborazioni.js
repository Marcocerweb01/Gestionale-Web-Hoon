import { Schema, model, models } from "mongoose";

const CollaborazioneSchema = new Schema(
  {
    azienda: {
      type: Schema.Types.ObjectId,
      ref: "Azienda",
      required: true,
    },
    collaboratore: {
      type: Schema.Types.ObjectId,
      ref: "Collaboratore",
      required: true,
    },
    aziendaRagioneSociale: {
      type: String, // Campo duplicato per snapshot
      required: true,
    },
    collaboratoreNome: {
      type: String, // Campo duplicato per snapshot
      required: true,
    },
    collaboratoreCognome: {
      type: String, // Campo duplicato per snapshot
      required: true,
    },
    dataInizio: {
      type: Date,
      default: Date.now,
    },
    dataFine: {
      type: Date,
      default: null,
    },
    stato: {
      type: String,
      enum: ["attiva", "terminata", "in sospeso"],
      default: "attiva",
    },
    note: {
      type: String,
      default: "",
    },
    numero_appuntamenti:{
      type:Number,
    },
    post_ig_fb:{
      type:Number,
    },
    post_tiktok:{
      type:Number,
    },
    post_linkedin:{
      type:Number,
    },
    post_ig_fb_fatti: {
      type: Number,
      default: 0,
    },
    post_tiktok_fatti: {
      type: Number,
      default: 0,
    },
    post_linkedin_fatti: {
      type: Number,
      default: 0,
    },
  

  },
  { timestamps: true }
);

const Collaborazione = models.Collaborazione || model("Collaborazione", CollaborazioneSchema);

export default Collaborazione;
