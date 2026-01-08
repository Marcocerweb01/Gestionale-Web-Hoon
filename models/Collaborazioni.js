import { Schema, model, models } from 'mongoose';
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
    numero_appuntamenti: {
      type: Number,
    },
    appuntamenti_fatti: {
      type: Number,
      default: 0,
    },
    post_ig_fb: {
      type: Number,
    },
    post_tiktok: {
      type: Number,
    },
    post_linkedin: {
      type: Number,
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
    pagato: {
      type: String,
      enum: ["si", "no"],
      default: "no",
    },
    // Nuovi campi per gestione contratto SMM
    post_totali: {
      type: Number,
      default: 0,
    },
    appuntamenti_totali: {
      type: Number,
      default: 0,
    },
    durata_contratto: {
      type: String,
      enum: ["1 mese", "3 mesi", "6 mesi", "1 anno"],
      default: null,
    },
    data_inizio_contratto: {
      type: Date,
      default: null,
    },
    data_fine_contratto: {
      type: Date,
      default: null,
    },
    // Campi per valutazione trimestrale SMM
    valutazione_trimestrale_fatti: {
      type: Number,
      default: 0,
    },
    valutazione_trimestrale_totali: {
      type: Number,
      default: 0,
    },
    // Campi per appuntamenti trimestrali
    appuntamenti_trimestrale_fatti: {
      type: Number,
      default: 0,
    },
    appuntamenti_trimestrale_totali: {
      type: Number,
      default: 0,
    },
    // Flag per escludere dal reset trimestrale
    escludi_reset_trimestrale: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Collaborazione = models.Collaborazione || model("Collaborazione", CollaborazioneSchema);

export default Collaborazione;
