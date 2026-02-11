import mongoose from 'mongoose';

const AutomationRuleSchema = new mongoose.Schema({
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
    enum: ['comment', 'follow', 'dm', 'mention'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  
  // Configurazione trigger (per type='comment')
  trigger: {
    keywords: [{
      type: String
    }],
    matchType: {
      type: String,
      enum: ['any', 'all', 'exact'],
      default: 'any'
    },
    caseSensitive: {
      type: Boolean,
      default: false
    }
  },
  
  // Configurazione azione
  action: {
    type: {
      type: String,
      enum: ['reply_comment', 'send_dm', 'both'],
      default: 'send_dm'
    },
    message: {
      type: String,
      required: true
    },
    variables: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Per type='follow'
  welcomeMessage: {
    type: String
  },
  delay: {
    type: Number,
    default: 0 // Minuti prima di inviare DM
  },
  
  // Statistiche
  stats: {
    triggered: {
      type: Number,
      default: 0
    },
    successful: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    lastTriggered: {
      type: Date
    }
  },
  
  // Configurazione avanzata
  settings: {
    maxPerDay: {
      type: Number,
      default: 100 // Limite giornaliero
    },
    maxPerHour: {
      type: Number,
      default: 20
    },
    excludeKeywords: [{
      type: String
    }],
    onlyVerified: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index per performance
AutomationRuleSchema.index({ accountId: 1, enabled: 1 });
AutomationRuleSchema.index({ userId: 1 });
AutomationRuleSchema.index({ type: 1 });

export default mongoose.models.AutomationRule || mongoose.model('AutomationRule', AutomationRuleSchema);
