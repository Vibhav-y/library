const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

// Get user's conversations
router.get('/conversations', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      'participants.user': userId,
      isActive: true
    })
    .populate('participants.user', 'name email role profilePicture')
    .populate('lastMessage.sender', 'name')
    .sort({ updatedAt: -1 });

    // Add unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.getUnreadCount(conv._id, userId);
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Error getting conversations', error: error.message });
  }
});

// Get or create private conversation
router.post('/conversations/private', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { userId: otherUserId } = req.body;
    const currentUserId = req.user.id;

    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    const conversation = await Conversation.findOrCreatePrivateConversation(
      currentUserId,
      otherUserId
    );

    res.json(conversation);
  } catch (error) {
    console.error('Error creating private conversation:', error);
    res.status(500).json({ message: 'Error creating private conversation', error: error.message });
  }
});

// Join main group chat
router.post('/conversations/group/join', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const groupChat = await Conversation.getMainGroupChat();
    
    // Add user to group chat if not already a participant
    if (!groupChat.isParticipant(userId)) {
      groupChat.addParticipant(userId, 'member');
      await groupChat.save();
    }

    await groupChat.populate('participants.user', 'name email role profilePicture');
    res.json(groupChat);
  } catch (error) {
    console.error('Error joining group chat:', error);
    res.status(500).json({ message: 'Error joining group chat', error: error.message });
  }
});

// Get conversation messages
router.get('/conversations/:conversationId/messages', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, after } = req.query;
    const userId = req.user.id;

    // Check if user is participant in the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({ message: 'Access denied. Not a participant in this conversation.' });
    }

    let result;
    
    // If 'after' timestamp is provided, get only new messages
    if (after) {
      const afterDate = new Date(after);
      const newMessages = await Message.find({
        conversation: conversationId,
        isDeleted: false,
        createdAt: { $gt: afterDate }
      })
      .populate('sender', 'name email role profilePicture')
      .populate('replyTo', 'content sender')
      .populate('readBy.user', 'name')
      .sort({ createdAt: 1 });

      result = {
        messages: newMessages,
        hasNew: newMessages.length > 0,
        latestTimestamp: newMessages.length > 0 ? newMessages[newMessages.length - 1].createdAt : after
      };
    } else {
      // Regular pagination for initial load
      result = await Message.getConversationMessages(conversationId, parseInt(page), parseInt(limit));
    }
    
    // Update user's last read timestamp only for initial load
    if (!after) {
      conversation.updateLastRead(userId);
      await conversation.save();
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Error getting messages', error: error.message });
  }
});

// Send message
router.post('/conversations/:conversationId/messages', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', replyTo } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({ message: 'Access denied. Not a participant in this conversation.' });
    }

    // Create new message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
      type,
      replyTo: replyTo || undefined
    });

    await message.save();
    
    // Populate sender information
    await message.populate('sender', 'name email role profilePicture');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update conversation's last message
    conversation.lastMessage = {
      content: content.trim(),
      sender: userId,
      timestamp: message.createdAt
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    // Message sent successfully - will be picked up by polling
    console.log('📤 Message sent, will be detected by polling:', message._id);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Update conversation's last read timestamp for user
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({ message: 'Access denied. Not a participant in this conversation.' });
    }

    conversation.updateLastRead(userId);
    await conversation.save();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

// Admin routes - Get all conversations (hidden monitoring)
router.get('/admin/conversations', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const conversations = await Conversation.find({ isActive: true })
      .populate('participants.user', 'name email role profilePicture')
      .populate('lastMessage.sender', 'name')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error('Error getting admin conversations:', error);
    res.status(500).json({ message: 'Error getting admin conversations', error: error.message });
  }
});

// Admin routes - Get all messages from any conversation
router.get('/admin/conversations/:conversationId/messages', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await Message.getConversationMessages(conversationId, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Error getting admin messages:', error);
    res.status(500).json({ message: 'Error getting admin messages', error: error.message });
  }
});

// Admin routes - Get flagged messages
router.get('/admin/messages/flagged', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const flaggedMessages = await Message.find({
      'flagged.isFlagged': true,
      isDeleted: false
    })
    .populate('sender', 'name email role')
    .populate('conversation', 'name type')
    .populate('flagged.flaggedBy', 'name email')
    .sort({ 'flagged.flaggedAt': -1 });

    res.json(flaggedMessages);
  } catch (error) {
    console.error('Error getting flagged messages:', error);
    res.status(500).json({ message: 'Error getting flagged messages', error: error.message });
  }
});

// Flag/unflag message
router.put('/messages/:messageId/flag', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { flag, reason } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (flag) {
      message.flag(userId, reason);
    } else {
      message.unflag();
    }

    await message.save();
    res.json({ message: `Message ${flag ? 'flagged' : 'unflagged'} successfully` });
  } catch (error) {
    console.error('Error flagging message:', error);
    res.status(500).json({ message: 'Error flagging message', error: error.message });
  }
});

// Delete message (soft delete)
router.delete('/messages/:messageId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or admin
    if (message.sender.toString() !== userId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Can only delete your own messages.' });
    }

    message.softDelete(userId);
    await message.save();

    // Message deleted successfully - will be detected by next poll
    console.log('🗑️ Message deleted:', messageId);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

// Get online users (for private messaging)
router.get('/users/online', authMiddleware.verifyToken, async (req, res) => {
  try {
    // This will be implemented with socket.io to track online users
    // For now, return all users
    const User = require('../models/User');
    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude current user
      role: { $in: ['student', 'admin', 'superadmin'] }
    }, 'name email role profilePicture').sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ message: 'Error getting online users', error: error.message });
  }
});

// Admin routes - Create custom group
router.post('/admin/groups', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const { name, description, participants = [] } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Check if group name already exists
    const existingGroup = await Conversation.findOne({
      type: 'group',
      name: name.trim()
    });

    if (existingGroup) {
      return res.status(400).json({ message: 'A group with this name already exists' });
    }

    // Create new group conversation
    const groupConversation = new Conversation({
      type: 'group',
      name: name.trim(),
      description: description?.trim() || '',
      participants: [
        // Add creator as admin
        { user: userId, role: 'admin' },
        // Add selected participants as members
        ...participants.map(participantId => ({
          user: participantId,
          role: 'member'
        }))
      ],
      createdBy: userId,
      isMonitored: true
    });

    await groupConversation.save();
    await groupConversation.populate('participants.user', 'name email role profilePicture');

    res.status(201).json(groupConversation);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
});

// Admin routes - Update group details
router.put('/admin/groups/:groupId', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await Conversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.type !== 'group') {
      return res.status(400).json({ message: 'Can only update group conversations' });
    }

    // Update group details
    if (name && name.trim().length > 0) {
      // Check if new name conflicts with existing groups
      const existingGroup = await Conversation.findOne({
        type: 'group',
        name: name.trim(),
        _id: { $ne: groupId }
      });

      if (existingGroup) {
        return res.status(400).json({ message: 'A group with this name already exists' });
      }

      group.name = name.trim();
    }

    if (description !== undefined) {
      group.description = description.trim();
    }

    await group.save();
    await group.populate('participants.user', 'name email role profilePicture');

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Error updating group', error: error.message });
  }
});

// Admin routes - Add members to group
router.post('/admin/groups/:groupId/members', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const group = await Conversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.type !== 'group') {
      return res.status(400).json({ message: 'Can only add members to group conversations' });
    }

    // Add new participants (avoiding duplicates)
    const addedMembers = [];
    for (const userId of userIds) {
      if (!group.isParticipant(userId)) {
        group.addParticipant(userId, 'member');
        addedMembers.push(userId);
      }
    }

    if (addedMembers.length === 0) {
      return res.status(400).json({ message: 'All specified users are already members of this group' });
    }

    await group.save();
    await group.populate('participants.user', 'name email role profilePicture');

    // Send system message about new members
    const User = require('../models/User');
    const addedUsers = await User.find({ _id: { $in: addedMembers } }, 'name');
    const memberNames = addedUsers.map(u => u.name).join(', ');
    
    const systemMessage = new Message({
      conversation: groupId,
      sender: req.user.id,
      content: `${memberNames} ${addedMembers.length === 1 ? 'has' : 'have'} been added to the group`,
      type: 'system'
    });
    await systemMessage.save();

    res.json({ group, addedMembers: addedMembers.length });
  } catch (error) {
    console.error('Error adding group members:', error);
    res.status(500).json({ message: 'Error adding group members', error: error.message });
  }
});

// Admin routes - Remove members from group
router.delete('/admin/groups/:groupId/members/:userId', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Conversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.type !== 'group') {
      return res.status(400).json({ message: 'Can only remove members from group conversations' });
    }

    if (!group.isParticipant(userId)) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    // Don't allow removing the creator
    if (group.createdBy && group.createdBy.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the group creator' });
    }

    // Get user name before removing
    const User = require('../models/User');
    const user = await User.findById(userId, 'name');
    
    group.removeParticipant(userId);
    await group.save();
    await group.populate('participants.user', 'name email role profilePicture');

    // Send system message about member removal
    const systemMessage = new Message({
      conversation: groupId,
      sender: req.user.id,
      content: `${user?.name || 'A member'} has been removed from the group`,
      type: 'system'
    });
    await systemMessage.save();

    res.json({ group, removedUser: user?.name || 'Unknown user' });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ message: 'Error removing group member', error: error.message });
  }
});

// Admin routes - Delete group
router.delete('/admin/groups/:groupId', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Conversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.type !== 'group') {
      return res.status(400).json({ message: 'Can only delete group conversations' });
    }

    // Prevent deletion of main group chat
    if (group.name === 'General Discussion') {
      return res.status(400).json({ message: 'Cannot delete the main group chat' });
    }

    // Soft delete the group
    group.isActive = false;
    await group.save();

    // Also soft delete all messages in the group
    const Message = require('../models/Message');
    await Message.updateMany(
      { conversation: groupId },
      { isDeleted: true, deletedAt: new Date(), deletedBy: req.user.id }
    );

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
});

// Admin routes - Get all users for group management
router.get('/admin/users', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({
      role: { $in: ['student', 'admin', 'superadmin', 'manager'] }
    }, 'name email role profilePicture').sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({ message: 'Error getting all users', error: error.message });
  }
});

module.exports = router;