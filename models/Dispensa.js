import mongoose from 'mongoose';

const DispensaSchema = new mongoose.Schema({
  categoria: {
    type: String,
    required: [true, 'La categoria è obbligatoria'],
    trim: true,
  },
  icona: {
    type: String,
    default: '📄',
    trim: true,
  },
  item: {
    type: String,
    required: [true, "L'argomento è obbligatorio"],
    trim: true,
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

DispensaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Dispensa || mongoose.model('Dispensa', DispensaSchema);
