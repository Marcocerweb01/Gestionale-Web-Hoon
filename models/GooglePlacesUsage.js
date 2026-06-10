import mongoose from 'mongoose';

const GooglePlacesUsageSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  calls: {
    type: Number,
    default: 0,
    min: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

GooglePlacesUsageSchema.pre('save', function setUpdatedAt(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.GooglePlacesUsage ||
  mongoose.model('GooglePlacesUsage', GooglePlacesUsageSchema);
