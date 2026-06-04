import mongoose from 'mongoose';

const DispensaSuggeritaSchema = new mongoose.Schema({
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    trim: true,
  },
  argomento: {
    type: String,
    required: [true, "L'argomento è obbligatorio"],
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

export default mongoose.models.DispensaSuggerita || mongoose.model('DispensaSuggerita', DispensaSuggeritaSchema);
