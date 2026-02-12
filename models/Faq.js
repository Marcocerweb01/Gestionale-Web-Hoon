import mongoose from 'mongoose';

const FaqSchema = new mongoose.Schema({
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    trim: true,
  },
  titolo: {
    type: String,
    required: [true, 'Il titolo è obbligatorio'],
    trim: true,
  },
  testo: {
    type: String,
    required: [true, 'Il testo è obbligatorio'],
  },
  ordine: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Aggiorna updatedAt prima di salvare
FaqSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Faq || mongoose.model('Faq', FaqSchema);
