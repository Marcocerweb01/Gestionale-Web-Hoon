import mongoose from 'mongoose';

const SocialInteractionSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['comment_reply', 'dm_sent', 'post_published', 'follow_back', 'story_reply', 'comment'],
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
  },

  // ID commento originale per deduplicazione polling
  commentId: {
    type: String,
    sparse: true
  },
  
  // Ref automazione che ha generato l'interazione
  automationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAutomation'
  },

  // Dati destrutturati per polling semplice
  data: {
    type: mongoose.Schema.Types.Mixed
  },

  processedAt: Date
}, {
  timestamps: true
});

// Index per analytics e report
SocialInteractionSchema.index({ accountId: 1, createdAt: -1 });
SocialInteractionSchema.index({ userId: 1, type: 1 });
SocialInteractionSchema.index({ 'action.success': 1 });
SocialInteractionSchema.index({ createdAt: -1 });
SocialInteractionSchema.index({ commentId: 1 }, { unique: true, sparse: true });

export default mongoose.models.SocialInteraction || mongoose.model('SocialInteraction', SocialInteractionSchema);
