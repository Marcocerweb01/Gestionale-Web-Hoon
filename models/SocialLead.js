import mongoose from 'mongoose';

const SocialLeadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  automationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAutomation'
  },
  
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'],
    required: true
  },
  
  leadInfo: {
    username: String,
    userId: String, // ID sulla piattaforma social
    name: String,
    profileUrl: String,
    profilePic: String
  },
  
  interaction: {
    type: String, // comment, dm, post_like, etc
    content: String, // Contenuto del commento/messaggio
    postUrl: String, // URL del post originale
    timestamp: Date
  },
  
  response: {
    sent: Boolean,
    message: String,
    sentAt: Date
  },
  
  status: {
    type: String,
    enum: ['new', 'replied', 'converted', 'ignored'],
    default: 'new'
  },
  
  tags: [String],
  
  notes: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.SocialLead || mongoose.model('SocialLead', SocialLeadSchema);
