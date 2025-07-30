const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    required: true,
    enum: ['banner', 'marquee', 'tab'],
    default: 'tab'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetAllUsers: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priority: {
    type: Number,
    default: 10,
    min: 0,
    max: 10
  },
  expiresAt: {
    type: Date,
    default: null
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
noticeSchema.index({ type: 1, isActive: 1, createdAt: -1 });
noticeSchema.index({ targetUsers: 1, isActive: 1 });
noticeSchema.index({ expiresAt: 1 });

// Virtual for checking if notice is expired
noticeSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to check if user is target of this notice
noticeSchema.methods.isTargetUser = function(userId) {
  if (this.targetAllUsers) return true;
  return this.targetUsers.some(targetId => targetId.toString() === userId.toString());
};

// Method to mark notice as read by user
noticeSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
};

// Pre-save middleware to handle expired notices
noticeSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt < new Date()) {
    this.isActive = false;
  }
  next();
});

module.exports = mongoose.model('Notice', noticeSchema); 