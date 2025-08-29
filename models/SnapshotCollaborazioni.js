import { Schema, model, models } from 'mongoose';

const SnapshotCollaborazioniSchema = new Schema({
  mese: {
    type: Number,
    required: true, // 0-11 (Gennaio = 0, Dicembre = 11)
  },
  anno: {
    type: Number,
    required: true,
  },
  meseNome: {
    type: String,
    required: true, // "Gennaio 2025"
  },
  data_creazione: {
    type: Date,
    default: Date.now,
  },
  data_ultimo_aggiornamento: {
    type: Date,
    default: Date.now,
  },
  collaborazioni_snapshot: [{
    collaborazione_id: {
      type: Schema.Types.ObjectId,
      ref: "Collaborazione",
      required: true,
    },
    collaboratore: {
      type: String,
      required: true,
    },
    cliente: {
      type: String,
      required: true,
    },
    appuntamenti_totali: {
      type: Number,
      default: 0,
    },
    appuntamenti_fatti: {
      type: Number,
      default: 0,
    },
    post_ig_fb: {
      type: String, // "fatti / totali"
      default: "0 / 0",
    },
    post_tiktok: {
      type: String,
      default: "0 / 0",
    },
    post_linkedin: {
      type: String,
      default: "0 / 0",
    },
    ultimo_aggiornamento: {
      type: Date,
      default: Date.now,
    }
  }],
  stato: {
    type: String,
    enum: ['attivo', 'completato', 'esportato', 'archiviato'],
    default: 'attivo',
  },
  data_export: {
    type: Date,
    default: null,
  },
  data_completamento: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

// Indice composto per trovare rapidamente gli snapshot per mese/anno
SnapshotCollaborazioniSchema.index({ anno: 1, mese: 1 });

const SnapshotCollaborazioni = models.SnapshotCollaborazioni || model('SnapshotCollaborazioni', SnapshotCollaborazioniSchema);

export default SnapshotCollaborazioni;
