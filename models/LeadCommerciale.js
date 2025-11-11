import { Schema, model, models } from "mongoose";

// Sub-schema per gli stati della timeline (senza nota, solo completato + data)
const StatoTimelineSchema = new Schema({
  completato: {
    type: Boolean,
    default: false
  },
  data_completamento: {
    type: Date,
    default: null
  }
}, { _id: false });

// Schema principale Lead Commerciale
const LeadCommercialeSchema = new Schema({
  // ========== DATI OBBLIGATORI ==========
  nome_attivita: {
    type: String,
    required: true,
    trim: true
  },
  numero_telefono: {
    type: String,
    required: true,
    trim: true
  },

  // ========== DATI NON OBBLIGATORI ==========
  referente: {
    type: String,
    trim: true,
    default: ""
  },
  indirizzo: {
    type: String,
    trim: true,
    default: ""
  },
  citta: {
    type: String,
    trim: true,
    default: ""
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ""
  },
  secondo_numero: {
    type: String,
    trim: true,
    default: ""
  },

  // ========== COMMERCIALE ASSEGNATO ==========
  commerciale: {
    type: Schema.Types.ObjectId,
    ref: "Collaboratore",
    required: true
  },

  // ========== STATI DI AVANZAMENTO ==========
  timeline: {
    contatto: {
      type: StatoTimelineSchema,
      default: () => ({ completato: false, data_completamento: null })
    },
    appuntamento: {
      type: StatoTimelineSchema,
      default: () => ({ completato: false, data_completamento: null })
    },
    preventivo: {
      type: StatoTimelineSchema,
      default: () => ({ completato: false, data_completamento: null })
    },
    contratto: {
      type: StatoTimelineSchema,
      default: () => ({ completato: false, data_completamento: null })
    }
  },

  // ========== STATI DI COMPLETAMENTO ==========
  non_interessato: {
    completato: {
      type: Boolean,
      default: false
    },
    data_completamento: {
      type: Date,
      default: null
    },
    nota: {
      type: String,
      default: ""
    }
  },

  da_ricontattare: {
    completato: {
      type: Boolean,
      default: false
    },
    data_completamento: {
      type: Date,
      default: null
    },
    data_ricontatto: {
      type: Date,
      default: null
    },
    nota: {
      type: String,
      default: ""
    }
  },

  // ========== NOTA GENERALE ==========
  nota_generale: {
    type: String,
    default: ""
  },

  // ========== STATO GENERALE ==========
  stato_attuale: {
    type: String,
    enum: [
      "in_lavorazione",    // Default - lead attivo
      "non_interessato",   // Cliente non vuole
      "da_richiamare",     // Richiamarlo in una data specifica
      "completato"         // Contratto firmato
    ],
    default: "in_lavorazione"
  },

  // Data ultimo cambio stato
  data_cambio_stato: {
    type: Date,
    default: null
  },

  // Data per "da_richiamare"
  data_richiamo: {
    type: Date,
    default: null
  },

  // ========== ARCHIVIAZIONE ==========
  archiviato: {
    type: Boolean,
    default: false
  },
  data_archiviazione: {
    type: Date,
    default: null
  }

}, { 
  timestamps: true 
});

// Indici per performance
LeadCommercialeSchema.index({ commerciale: 1, stato_attuale: 1 });
LeadCommercialeSchema.index({ commerciale: 1, archiviato: 1 });
LeadCommercialeSchema.index({ 'da_ricontattare.data_ricontatto': 1 });

const LeadCommerciale = models.LeadCommerciale || model("LeadCommerciale", LeadCommercialeSchema);

export default LeadCommerciale;
