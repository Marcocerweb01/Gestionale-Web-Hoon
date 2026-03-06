import mongoose from 'mongoose';

const FaqSuggeriteSchema = new mongoose.Schema({
  domanda: {
    type: String,
    required: [true, 'La domanda è obbligatoria'],
    trim: true,
  },
  suggeritaDa: {
    nome: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  stato: {
    type: String,
    enum: ['in_attesa', 'pubblicata'],
    default: 'in_attesa',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.FaqSuggerite || mongoose.model('FaqSuggerite', FaqSuggeriteSchema);
