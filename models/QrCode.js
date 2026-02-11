import mongoose from 'mongoose';

const QrCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  type: {
    type: String,
    enum: ['url', 'text', 'email', 'phone', 'wifi'],
    required: true
  },
  
  value: {
    type: String,
    required: true
  },
  
  // Per WiFi
  wifiConfig: {
    ssid: String,
    password: String,
    encryption: {
      type: String,
      enum: ['WPA', 'WEP', 'nopass']
    }
  },
  
  // Analytics
  scans: {
    type: Number,
    default: 0
  },
  
  lastScan: Date,
  
  // URL breve per tracking
  shortUrl: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.QrCode || mongoose.model('QrCode', QrCodeSchema);
