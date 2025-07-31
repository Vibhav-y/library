const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['group', 'private'],
    required: true
  },
  name: {
    type: String,
    required: function() {
      return this.type === 'group';
    }
  },
  description: {
    type: String
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  // Admin monitoring settings
  isMonitored: {
    type: Boolean,
    default: true // All chats are monitored by default
  },
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
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if user is participant
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Method to get participant by user ID
conversationSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => p.user.toString() === userId.toString());
};

// Method to add participant
conversationSchema.methods.addParticipant = function(userId, role = 'member') {
  if (!this.isParticipant(userId)) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      lastReadAt: new Date()
    });
  }
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    p => p.user.toString() !== userId.toString()
  );
};

// Method to update last read timestamp
conversationSchema.methods.updateLastRead = function(userId) {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.lastReadAt = new Date();
  }
};

// Static method to find or create private conversation
conversationSchema.statics.findOrCreatePrivateConversation = async function(user1Id, user2Id) {
  // Try to find existing private conversation between these two users
  let conversation = await this.findOne({
    type: 'private',
    'participants.user': { $all: [user1Id, user2Id] },
    'participants': { $size: 2 }
  }).populate('participants.user', 'name email role');

  if (!conversation) {
    // Create new private conversation
    conversation = new this({
      type: 'private',
      participants: [
        { user: user1Id, role: 'member' },
        { user: user2Id, role: 'member' }
      ],
      createdBy: user1Id,
      isMonitored: true
    });
    await conversation.save();
    await conversation.populate('participants.user', 'name email role');
  }

  return conversation;
};

// Static method to get main group chat
conversationSchema.statics.getMainGroupChat = async function() {
  let groupChat = await this.findOne({
    type: 'group',
    name: 'General Discussion'
  }).populate('participants.user', 'name email role');

  if (!groupChat) {
    // Create main group chat if it doesn't exist
    groupChat = new this({
      type: 'group',
      name: 'General Discussion',
      description: 'Main chat room for all library members',
      participants: [], // Will be populated as users join
      createdBy: null, // System created
      isMonitored: true
    });
    await groupChat.save();
  }

  return groupChat;
};

module.exports = mongoose.model('Conversation', conversationSchema);