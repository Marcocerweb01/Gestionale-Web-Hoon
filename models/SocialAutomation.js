import mongoose from 'mongoose';

const SocialAutomationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok'],
    required: true
  },
  
  type: {
    type: String,
    enum: ['comment_reply', 'dm_auto', 'post_schedule', 'lead_capture'],
    required: true
  },
  
  trigger: {
    keywords: [String], // Keywords che attivano l'automazione
    conditions: mongoose.Schema.Types.Mixed // Condizioni avanzate
  },
  
  action: {
    type: String, // Tipo di azione
    message: String, // Messaggio da inviare
    template: String, // Template con variabili
    delay: Number // Ritardo in secondi
  },
  
  n8nWorkflowId: String, // ID del workflow n8n
  
  status: {
    type: String,
    enum: ['active', 'paused', 'draft'],
    default: 'draft'
  },
  
  stats: {
    triggered: { type: Number, default: 0 },
    successful: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  
  lastTriggered: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.SocialAutomation || mongoose.model('SocialAutomation', SocialAutomationSchema);
