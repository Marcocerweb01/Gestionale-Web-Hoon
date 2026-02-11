import mongoose from 'mongoose';

const SocialAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook'],
    required: true
  },
  accountId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String
  },
  profilePicture: {
    type: String
  },
  accessToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'error'],
    default: 'active'
  },
  permissions: [{
    type: String
  }],
  stats: {
    followers: {
      type: Number,
      default: 0
    },
    following: {
      type: Number,
      default: 0
    },
    posts: {
      type: Number,
      default: 0
    },
    lastSync: {
      type: Date
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index per ricerca veloce
SocialAccountSchema.index({ userId: 1, platform: 1 });
SocialAccountSchema.index({ accountId: 1 });
SocialAccountSchema.index({ status: 1 });

export default mongoose.models.SocialAccount || mongoose.model('SocialAccount', SocialAccountSchema);
