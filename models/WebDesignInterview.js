import { Schema, model, models } from 'mongoose';

const WebDesignInterviewSchema = new Schema(
  {
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

const WebDesignInterview =
  models.WebDesignInterview || model('WebDesignInterview', WebDesignInterviewSchema);

export default WebDesignInterview;
