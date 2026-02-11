import mongoose from 'mongoose';

const SocialInteractionSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['comment_reply', 'dm_sent', 'post_published', 'follow_back', 'story_reply'],
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook'],
    required: true
  },
  
  // Sorgente dell'interazione
  source: {
    type: {
      type: String,
      enum: ['comment', 'follow', 'dm', 'scheduled', 'mention', 'story']
    },
    id: String, // ID del commento/post originale
    username: String,
    userId: String,
    content: String,
    postUrl: String
  },
  
  // Azione eseguita
  action: {
    type: {
      type: String
    },
    message: String,
    success: {
      type: Boolean,
      default: false
    },
    responseId: String, // ID della risposta su Meta
    error: String
  },
  
  // Riferimenti
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialLead'
  },
  scheduledPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledPost'
  },
  
  // Metadata aggiuntiva
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index per analytics e report
SocialInteractionSchema.index({ accountId: 1, createdAt: -1 });
SocialInteractionSchema.index({ userId: 1, type: 1 });
SocialInteractionSchema.index({ 'action.success': 1 });
SocialInteractionSchema.index({ createdAt: -1 });

export default mongoose.models.SocialInteraction || mongoose.model('SocialInteraction', SocialInteractionSchema);
