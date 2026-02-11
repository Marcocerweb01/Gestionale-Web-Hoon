import mongoose from 'mongoose';

const ImageCompressionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  originalName: {
    type: String,
    required: true
  },
  
  originalSize: {
    type: Number,
    required: true
  },
  
  compressedSize: {
    type: Number,
    required: true
  },
  
  quality: {
    type: Number,
    required: true
  },
  
  savings: {
    type: Number, // Percentuale risparmio
    required: true
  },
  
  format: {
    type: String,
    enum: ['jpeg', 'png', 'webp'],
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.ImageCompression || mongoose.model('ImageCompression', ImageCompressionSchema);
