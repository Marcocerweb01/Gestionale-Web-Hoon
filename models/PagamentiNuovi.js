import { Schema, model, models } from "mongoose";

// Schema per i servizi disponibili
const ServizioSchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  attivo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Schema per i collaboratori associati a un pagamento
const CollaboratorePagamentoSchema = new Schema({
  collaboratore_id: {
    type: Schema.Types.ObjectId,
    ref: "Collaboratore",
    required: true
  },
  nome_collaboratore: String,
  usa_percentuale: {
    type: Boolean,
    default: true
  },
  percentuale: Number, // Se usa_percentuale = true
  cifra_fissa: Number, // Se usa_percentuale = false
  importo_calcolato: Number // Importo finale calcolato
});

// Schema principale per Entrate
const EntrataSchema = new Schema({
  tipo: {
    type: String,
    enum: ["entrata"],
    default: "entrata",
    required: true
  },
  // Chi paga
  chi_paga: {
    cliente_id: {
      type: Schema.Types.ObjectId,
      ref: "Azienda"
    },
    nome_cliente: String,
    etichetta: String,
    ragione_sociale: String
  },
  // Quanto paga
  importo_totale: {
    type: Number,
    required: true
  },
  // A chi paga
  destinatario: {
    type: String,
    enum: ["hoon", "collaboratori"],
    required: true
  },
  // Tipo servizio
  servizio: {
    type: String,
    required: true
  },
  // Collaboratori di riferimento con percentuali/cifre
  collaboratori: [CollaboratorePagamentoSchema],
  // Stato pagamento
  stato_pagamento: {
    type: String,
    enum: ["pagato", "non_pagato", "ragazzi"],
    default: "non_pagato"
  },
  // Data pagamento
  data_pagamento: Date,
  // Note
  note: String,
  // Uscita generata automaticamente
  uscita_generata_id: {
    type: Schema.Types.ObjectId,
    ref: "PagamentoNuovo"
  }
}, { timestamps: true });

// Schema principale per Uscite
const UscitaSchema = new Schema({
  tipo: {
    type: String,
    enum: ["uscita"],
    default: "uscita",
    required: true
  },
  // Quanto
  importo: {
    type: Number,
    required: true
  },
  // A chi si paga
  destinatario_tipo: {
    type: String,
    enum: ["collaboratore", "azienda_esterna", "servizio_esterno"],
    required: true
  },
  destinatario_id: {
    type: Schema.Types.ObjectId,
    refPath: 'destinatario_tipo_ref'
  },
  destinatario_tipo_ref: {
    type: String,
    enum: ["Collaboratore", "Azienda"]
  },
  nome_destinatario: String,
  // Stato pagamento
  stato_pagamento: {
    type: String,
    enum: ["pagato", "non_pagato", "ragazzi"],
    default: "non_pagato"
  },
  // Data pagamento
  data_pagamento: Date,
  // Note
  note: String,
  // Se è generata automaticamente da un'entrata
  generata_da_entrata: {
    type: Boolean,
    default: false
  },
  entrata_riferimento_id: {
    type: Schema.Types.ObjectId,
    ref: "PagamentoNuovo"
  }
}, { timestamps: true });

// Schema unificato che può essere entrata o uscita
const PagamentoNuovoSchema = new Schema({
  tipo: {
    type: String,
    enum: ["entrata", "uscita"],
    required: true
  },
  // Campi comuni
  importo: {
    type: Number,
    required: true
  },
  stato_pagamento: {
    type: String,
    enum: ["pagato", "non_pagato", "ragazzi"],
    default: "non_pagato"
  },
  data_pagamento: Date,
  mese: Number, // 1-12
  anno: Number,
  note: String,
  
  // Campi specifici ENTRATA
  chi_paga: {
    cliente_id: Schema.Types.ObjectId,
    nome_cliente: String,
    etichetta: String,
    ragione_sociale: String
  },
  destinatario_entrata: {
    type: String,
    enum: ["hoon", "collaboratori"]
  },
  servizio: String,
  collaboratori: [CollaboratorePagamentoSchema],
  uscite_generate_ids: [{
    type: Schema.Types.ObjectId,
    ref: "PagamentoNuovo"
  }],
  
  // Campi specifici USCITA
  destinatario_tipo: {
    type: String,
    enum: ["collaboratore", "azienda_esterna", "servizio_esterno"]
  },
  destinatario_id: Schema.Types.ObjectId,
  nome_destinatario: String,
  generata_da_entrata: {
    type: Boolean,
    default: false
  },
  entrata_riferimento_id: {
    type: Schema.Types.ObjectId,
    ref: "PagamentoNuovo"
  },
  ricorrente: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Modello per i servizi personalizzabili
export const Servizio = models.Servizio || model("Servizio", ServizioSchema);

// Modello unificato pagamenti
export const PagamentoNuovo = models.PagamentoNuovo || model("PagamentoNuovo", PagamentoNuovoSchema);
