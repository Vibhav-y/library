const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    default: null
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  // E2EE fields: if encrypted, contentEncrypted holds ciphertext (base64) and related metadata
  encryption: {
    isEncrypted: { type: Boolean, default: false },
    keyVersion: { type: Number, default: 0 },
    iv: { type: String, default: null }, // base64 IV/nonce
    authTag: { type: String, default: null }, // optional if using AES-GCM implicit tag
    ciphertext: { type: String, default: null }
  },
  // File attachment details (if type is 'file' or 'image')
  attachment: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  },
  // Message status
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reply/Thread functionality
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // 🚀 PREMIUM: Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      maxlength: 10,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Admin monitoring
  flagged: {
    isFlagged: {
      type: Boolean,
      default: false
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: Date,
    reason: String
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Method to mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

// Method to soft delete message
messageSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
};

// Method to flag message
messageSchema.methods.flag = function(flaggedBy, reason) {
  this.flagged.isFlagged = true;
  this.flagged.flaggedBy = flaggedBy;
  this.flagged.flaggedAt = new Date();
  this.flagged.reason = reason;
};

// Method to unflag message
messageSchema.methods.unflag = function() {
  this.flagged.isFlagged = false;
  this.flagged.flaggedBy = undefined;
  this.flagged.flaggedAt = undefined;
  this.flagged.reason = undefined;
};

// Static method to get conversation messages with pagination
messageSchema.statics.getConversationMessages = async function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({
    conversation: conversationId,
    isDeleted: false
  })
  .populate('sender', 'name email role profilePicture')
  .populate('replyTo', 'content sender')
  .populate('readBy.user', 'name')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  const total = await this.countDocuments({
    conversation: conversationId,
    isDeleted: false
  });

  return {
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

// Static method to get unread message count for user in conversation
messageSchema.statics.getUnreadCount = async function(conversationId, userId) {
  // Get the user's last read timestamp from the conversation
  const Conversation = mongoose.model('Conversation');
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) return 0;
  
  const participant = conversation.getParticipant(userId);
  if (!participant) return 0;

  const lastReadAt = participant.lastReadAt || new Date(0);

  const unreadCount = await this.countDocuments({
    conversation: conversationId,
    createdAt: { $gt: lastReadAt },
    sender: { $ne: userId }, // Don't count own messages
    isDeleted: false
  });

  return unreadCount;
};

module.exports = mongoose.model('Message', messageSchema);