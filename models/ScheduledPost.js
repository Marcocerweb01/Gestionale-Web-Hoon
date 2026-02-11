import mongoose from 'mongoose';

const ScheduledPostSchema = new mongoose.Schema({
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
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'published', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Contenuto del post
  content: {
    type: {
      type: String,
      enum: ['image', 'video', 'carousel', 'text'],
      required: true
    },
    caption: {
      type: String,
      required: true
    },
    media: [{
      url: String,
      type: {
        type: String,
        enum: ['image', 'video']
      },
      order: Number
    }],
    hashtags: [{
      type: String
    }],
    location: {
      id: String,
      name: String
    },
    tagUsers: [{
      username: String,
      userId: String
    }]
  },
  
  // Post pubblicato
  publishedAt: {
    type: Date
  },
  publishedPostId: {
    type: String
  },
  publishedUrl: {
    type: String
  },
  
  // Errori
  error: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Retry logic
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Analytics
  analytics: {
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    reach: {
      type: Number,
      default: 0
    },
    lastSynced: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Index composti per query frequenti
ScheduledPostSchema.index({ status: 1, scheduledFor: 1 });
ScheduledPostSchema.index({ accountId: 1, status: 1 });
ScheduledPostSchema.index({ userId: 1, scheduledFor: -1 });

export default mongoose.models.ScheduledPost || mongoose.model('ScheduledPost', ScheduledPostSchema);
