import { Schema, model, models } from 'mongoose';

const WebDesignInterviewSchema = new Schema(
  {
    collaborazione: {
      type: Schema.Types.ObjectId,
      ref: 'CollaborazioneWebDesignV2',
    },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: 'Azienda',
      default: null,
      index: true,
    },
    webDesigner: {
      type: Schema.Types.ObjectId,
      ref: 'Collaboratore',
      required: true,
      index: true,
    },
    azienda: {
      type: String,
      default: '',
    },
    interview: {
      type: Schema.Types.Mixed,
      default: {},
    },
    risultatoTxt: {
      type: String,
      default: '',
    },
    aiAnalysis: {
      type: Schema.Types.Mixed,
      default: null,
    },
    aiRisultatoTxt: {
      type: String,
      default: '',
    },
    aiFollowUpAnswers: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    aiInputHash: {
      type: String,
      default: '',
    },
    aiPromptVersion: {
      type: String,
      default: '',
    },
    aiModel: {
      type: String,
      default: '',
    },
    aiGeneratedAt: {
      type: Date,
      default: null,
    },
    aiInitialAnalysis: {
      type: Schema.Types.Mixed,
      default: null,
    },
    aiInitialRisultatoTxt: {
      type: String,
      default: '',
    },
    aiInitialInputHash: {
      type: String,
      default: '',
    },
    aiInitialGeneratedAt: {
      type: Date,
      default: null,
    },
    aiFinalAnalysis: {
      type: Schema.Types.Mixed,
      default: null,
    },
    aiFinalRisultatoTxt: {
      type: String,
      default: '',
    },
    aiFinalInputHash: {
      type: String,
      default: '',
    },
    aiFinalGeneratedAt: {
      type: Date,
      default: null,
    },
    aiStage: {
      type: String,
      enum: ['non_generata', 'prima_analisi', 'finale'],
      default: 'non_generata',
    },
    aiInputStale: {
      type: Boolean,
      default: false,
    },
    aiFinalStale: {
      type: Boolean,
      default: false,
    },
    autoreId: {
      type: String,
      default: '',
    },
    autoreNome: {
      type: String,
      default: '',
    },
    autoreEmail: {
      type: String,
      default: '',
    },
    autoreRuolo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

WebDesignInterviewSchema.index({ webDesigner: 1, createdAt: -1 });
WebDesignInterviewSchema.index({ collaborazione: 1 }, { unique: true, sparse: true });

const WebDesignInterview =
  models.WebDesignInterview || model('WebDesignInterview', WebDesignInterviewSchema);

export default WebDesignInterview;
