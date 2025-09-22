const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { uploadToSupabase, getPublicUrl, generateUniqueFilename } = require('../config/supabaseConfig');
const multer = require('multer');
// Separate uploader for chat attachments: allow images and general files up to 20MB
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const crypto = require('crypto');

// --- E2EE KEY MANAGEMENT (Superadmin only) ---
// Generate or rotate a conversation key. Only superadmin.
router.post('/admin/conversations/:conversationId/keys/rotate', authMiddleware.verifyToken, authMiddleware.superAdminOnly, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { superAdminPublicKeyPem } = req.body; // optional legacy

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    // Generate new random 256-bit key for AES-GCM
    const newKey = crypto.randomBytes(32);

    // Store a plain base64 for superadmin retrieval only, and optionally wrap if PEM provided
    const symmetricKeyB64 = newKey.toString('base64');
    let wrappedForSuper = null;
    const publicKeyPem = superAdminPublicKeyPem || process.env.SUPERADMIN_PUBLIC_KEY_PEM;
    if (publicKeyPem) {
      try {
        wrappedForSuper = crypto.publicEncrypt(
          {
            key: publicKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
          },
          newKey
        ).toString('base64');
      } catch {}
    }

    // Bump version and store
    conversation.encryption = conversation.encryption || {};
    const nextVersion = (conversation.encryption.keyVersion || 0) + 1;
    conversation.encryption.enabled = true;
    conversation.encryption.algorithm = 'AES-GCM';
    conversation.encryption.keyVersion = nextVersion;
    conversation.encryption.symmetricKeyB64 = symmetricKeyB64;
    conversation.encryption.wrappedKeyForSuperAdmin = wrappedForSuper;
    conversation.encryption.wrappedKeysByUser = undefined; // reset per rotation; can re-grant later
    await conversation.save();

    res.json({ message: 'Key rotated', keyVersion: nextVersion });
  } catch (error) {
    console.error('Error rotating key:', error);
    res.status(500).json({ message: 'Error rotating key', error: error.message });
  }
});

// Superadmin grants user access to the conversation key by wrapping with user's public key
router.post('/admin/conversations/:conversationId/keys/grant', authMiddleware.verifyToken, authMiddleware.superAdminOnly, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.encryption?.enabled) return res.status(400).json({ message: 'E2EE not enabled for conversation' });

    const user = await User.findById(userId);
    if (!user || !user.encryptionPublicKey) {
      return res.status(400).json({ message: 'User public key not set' });
    }

    // Use stored symmetric key directly (no PEM required)
    const symmetricKeyB64 = conversation.encryption.symmetricKeyB64;
    if (!symmetricKeyB64) return res.status(400).json({ message: 'No symmetric key present' });
    const convKey = Buffer.from(symmetricKeyB64, 'base64');

    // Wrap for user
    const wrappedForUser = crypto.publicEncrypt(
      {
        key: user.encryptionPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      convKey
    ).toString('base64');

    if (!conversation.encryption.wrappedKeysByUser) {
      conversation.encryption.wrappedKeysByUser = new Map();
    }
    conversation.encryption.wrappedKeysByUser.set(userId.toString(), wrappedForUser);
    await conversation.save();

    res.json({ message: 'Access granted', userId, keyVersion: conversation.encryption.keyVersion });
  } catch (error) {
    console.error('Error granting key:', error);
    res.status(500).json({ message: 'Error granting key', error: error.message });
  }
});

// Fetch encryption metadata for a conversation (participant can fetch their wrapped key)
router.get('/conversations/:conversationId/encryption', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.isParticipant(userId) && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = {
      enabled: conversation.encryption?.enabled || false,
      algorithm: conversation.encryption?.algorithm || 'AES-GCM',
      keyVersion: conversation.encryption?.keyVersion || 0,
      wrappedKey: null
    };

    if (req.user.role === 'superadmin') {
      result.wrappedKey = conversation.encryption?.wrappedKeyForSuperAdmin || null;
    } else if (conversation.encryption?.wrappedKeysByUser) {
      result.wrappedKey = conversation.encryption.wrappedKeysByUser.get(userId.toString()) || null;
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching encryption metadata:', error);
    res.status(500).json({ message: 'Error fetching encryption metadata', error: error.message });
  }
});

// Superadmin: retrieve raw symmetric key (base64) for a conversation
router.get('/admin/conversations/:conversationId/keys/raw', authMiddleware.verifyToken, authMiddleware.superAdminOnly, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.encryption?.enabled || !conversation.encryption?.symmetricKeyB64) {
      return res.status(400).json({ message: 'No symmetric key present for this conversation' });
    }
    res.json({ keyVersion: conversation.encryption.keyVersion, symmetricKeyB64: conversation.encryption.symmetricKeyB64 });
  } catch (error) {
    console.error('Error retrieving raw key:', error);
    res.status(500).json({ message: 'Error retrieving raw key', error: error.message });
  }
});
// Get user's conversations
router.get('/conversations', authMiddleware.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // If library has chat disabled, block access (except superadmin)
    if (req.user.role !== 'superadmin' && req.user.libraryId) {
      const Library = require('../models/Library');
      const lib = await Library.findById(req.user.libraryId);
      if (lib && lib.features && lib.features.chatEnabled === false) {
        return res.status(403).json({ message: 'Chat feature is disabled for this library' });
      }
    }
    
    const conversations = await Conversation.find({
      'participants.user': userId,
      isActive: true,
      ...(req.user.libraryId ? { library: req.user.libraryId } : {})
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

// Search users to start a private chat (exclude superadmin)
router.get('/users/search', authMiddleware.verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.libraryId) {
      const Library = require('../models/Library');
      const lib = await Library.findById(req.user.libraryId);
      if (lib && lib.features && lib.features.chatEnabled === false) {
        return res.status(403).json({ message: 'Chat feature is disabled for this library' });
      }
    }
    const { q = '' } = req.query;
    const currentUserId = req.user.id;

    const query = {
      _id: { $ne: currentUserId },
      role: { $in: ['student', 'admin', 'manager'] }, // exclude superadmin
      name: { $regex: q.trim(), $options: 'i' },
      ...(req.user.libraryId ? { library: req.user.libraryId } : {})
    };

    const users = await User.find(query, 'name email role profilePicture').sort({ name: 1 }).limit(20);
    res.json(users);
  } catch (error) {
    console.error('Error searching users for private chat:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Get or create private conversation
router.post('/conversations/private', authMiddleware.verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.libraryId) {
      const Library = require('../models/Library');
      const lib = await Library.findById(req.user.libraryId);
      if (lib && lib.features && lib.features.chatEnabled === false) {
        return res.status(403).json({ message: 'Chat feature is disabled for this library' });
      }
    }
    const { userId: otherUserId } = req.body;
    const currentUserId = req.user.id;

    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Enforce cross-library isolation: users can only chat within the same library context
    if (req.user.libraryId) {
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (!otherUser.library || otherUser.library.toString() !== req.user.libraryId) {
        return res.status(403).json({ message: 'Cannot chat across libraries' });
      }
    }

    let conversation = await Conversation.findOne({
      type: 'private',
      'participants.user': { $all: [currentUserId, otherUserId] },
      participants: { $size: 2 },
      ...(req.user.libraryId ? { library: req.user.libraryId } : {})
    }).populate('participants.user', 'name email role');

    if (!conversation) {
      conversation = new Conversation({
        type: 'private',
        participants: [
          { user: currentUserId, role: 'member' },
          { user: otherUserId, role: 'member' }
        ],
        createdBy: currentUserId,
        isMonitored: true,
        library: req.user.libraryId || null
      });
      await conversation.save();
      await conversation.populate('participants.user', 'name email role');
    }

    // Notify both users in real-time so the new chat appears without refresh
    const io = req.app.get('io');
    if (io && conversation && conversation.participants) {
      const participantIds = conversation.participants.map(p => p.user._id?.toString?.() || p.user.toString());
      participantIds.forEach(pid => {
        io.to(`user_${pid}`).emit('conversation_created', {
          conversation
        });
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error creating private conversation:', error);
    res.status(500).json({ message: 'Error creating private conversation', error: error.message });
  }
});

// Join main group chat
router.post('/conversations/group/join', authMiddleware.verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.libraryId) {
      const Library = require('../models/Library');
      const lib = await Library.findById(req.user.libraryId);
      if (lib && lib.features && lib.features.chatEnabled === false) {
        return res.status(403).json({ message: 'Chat feature is disabled for this library' });
      }
    }
    const userId = req.user.id;
    
    let groupChat = await Conversation.findOne({
      type: 'group',
      name: 'General Discussion',
      ...(req.user.libraryId ? { library: req.user.libraryId } : {})
    }).populate('participants.user', 'name email role profilePicture');

    if (!groupChat) {
      groupChat = new Conversation({
        type: 'group',
        name: 'General Discussion',
        description: 'Main chat room for all library members',
        participants: [],
        createdBy: null,
        isMonitored: true,
        library: req.user.libraryId || null
      });
      await groupChat.save();
    }
    
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

// Ensure user is in Announcement group (auto-join for students)
router.post('/conversations/announcement/join', authMiddleware.verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.libraryId) {
      const Library = require('../models/Library');
      const lib = await Library.findById(req.user.libraryId);
      if (lib && lib.features && lib.features.chatEnabled === false) {
        return res.status(403).json({ message: 'Chat feature is disabled for this library' });
      }
    }
    const userId = req.user.id;
    const Conversation = require('../models/Conversation');
    let announcement = await Conversation.findOne({
      type: 'group',
      name: 'Announcement',
      ...(req.user.libraryId ? { library: req.user.libraryId } : {})
    }).populate('participants.user', 'name email role profilePicture');

    if (!announcement) {
      announcement = new Conversation({
        type: 'group',
        name: 'Announcement',
        description: 'Official announcements. Only admins can post.',
        participants: [],
        createdBy: null,
        isMonitored: true,
        library: req.user.libraryId || null
      });
      await announcement.save();
    }

    if (!announcement.isParticipant(userId)) {
      // All roles can be members; posting is restricted elsewhere
      announcement.addParticipant(userId, 'member');
      await announcement.save();
    }

    await announcement.populate('participants.user', 'name email role profilePicture');
    res.json(announcement);
  } catch (error) {
    console.error('Error joining announcement group:', error);
    res.status(500).json({ message: 'Error joining announcement group', error: error.message });
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

// Send message (text or encrypted)
router.post('/conversations/:conversationId/messages', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', replyTo, encryption } = req.body;
    const userId = req.user.id;

    if (!content && !(encryption && encryption.isEncrypted && encryption.ciphertext)) {
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

    // Extra rule: Announcement group is write-restricted to admins
    if (conversation.type === 'group' && conversation.name === 'Announcement') {
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Only admins can post in Announcement group' });
      }
    }

    // Create new message
    const messageData = {
      conversation: conversationId,
      sender: userId,
      content: content ? content.trim() : '[encrypted]',
      type,
      replyTo: replyTo || undefined
    };

    // If encrypted payload present, store encryption metadata and ciphertext
    if (encryption && encryption.isEncrypted) {
      messageData.encryption = {
        isEncrypted: true,
        keyVersion: Number(encryption.keyVersion || 0),
        iv: encryption.iv || null,
        authTag: encryption.authTag || null,
        ciphertext: encryption.ciphertext || null
      };
    }

    // If conversation requires encryption, enforce it
    if (conversation.encryption?.enabled) {
      const hasEnc = messageData.encryption?.isEncrypted && messageData.encryption.ciphertext && messageData.encryption.iv;
      if (!hasEnc) {
        return res.status(400).json({ message: 'Encryption required for this conversation' });
      }
    }

    const message = new Message({ ...messageData, library: req.user.libraryId || null });

    await message.save();
    
    // Populate sender information
    await message.populate('sender', 'name email role profilePicture');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update conversation's last message
    conversation.lastMessage = {
      content: content ? content.trim() : '[encrypted]',
      sender: userId,
      timestamp: message.createdAt
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    // 🚀 REAL-TIME: Emit message via WebSocket to all participants
    const io = req.app.get('io');
    if (io) {
      const roomName = `conversation_${conversationId}`;
      console.log(`🚀 Emitting message to room: ${roomName}`);
      
      // Get all sockets in the room
      const room = io.sockets.adapter.rooms.get(roomName);
      if (room) {
        console.log(`🚀 Room ${roomName} has ${room.size} sockets`);
        console.log(`🚀 Socket IDs in room:`, Array.from(room));
        
        // Check if the sender is in the room
        const senderSocket = Array.from(io.sockets.sockets.values()).find(s => s.userId === userId);
        if (senderSocket) {
          console.log(`🚀 Sender socket ID: ${senderSocket.id}`);
          console.log(`🚀 Sender in room: ${room.has(senderSocket.id)}`);
        }
      } else {
        console.log(`❌ Room ${roomName} not found or empty`);
        
        // Debug: List all rooms
        const allRooms = Array.from(io.sockets.adapter.rooms.keys());
        console.log(`🔍 All available rooms:`, allRooms);
        
        // Debug: Check if any users are connected
        const connectedSockets = Array.from(io.sockets.sockets.values());
        console.log(`🔍 Connected sockets:`, connectedSockets.length);
        connectedSockets.forEach(socket => {
          if (socket.userId) {
            console.log(`🔍 Socket ${socket.id} belongs to user ${socket.userId}`);
          }
        });
      }
      
      // Emit to the specific conversation room
      io.to(roomName).emit('new_message', {
        message: message,
        conversationId: conversationId,
        sender: {
          id: message.sender._id,
          name: message.sender.name,
          role: message.sender.role,
          profilePicture: message.sender.profilePicture
        }
      });

      // Emit conversation update to all participants
      io.to(roomName).emit('conversation_updated', {
        conversationId: conversationId,
        lastMessage: {
          content: content.trim(),
          sender: userId,
          timestamp: message.createdAt
        },
        updatedAt: conversation.updatedAt
      });

      console.log(`🚀 WebSocket: Message sent in real-time to conversation ${conversationId}`);
    } else {
      console.log('⚠️ WebSocket not available, falling back to polling');
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Send attachment (image/file)
router.post('/conversations/:conversationId/attachments', authMiddleware.verifyToken, chatUpload.single('file'), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { replyTo } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({ message: 'Access denied. Not a participant in this conversation.' });
    }

    // Upload to 'documents' bucket under a dedicated folder
    const uniqueName = generateUniqueFilename(req.file.originalname);
    const objectPath = `chat/${uniqueName}`;
    await uploadToSupabase(req.file, objectPath);
    // If your bucket is private, use a signed URL; otherwise use public URL
    let fileUrl;
    try {
      const { getSignedUrl } = require('../config/supabaseConfig');
      fileUrl = await getSignedUrl(objectPath, 60 * 60 * 24); // 24h signed URL
    } catch (e) {
      const { getPublicUrl } = require('../config/supabaseConfig');
      fileUrl = getPublicUrl(objectPath);
    }

    const inferredType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    const message = new Message({
      library: req.user.libraryId || null,
      conversation: conversationId,
      sender: userId,
      content: req.file.originalname,
      type: inferredType,
      replyTo: replyTo || undefined,
      attachment: {
        filename: uniqueName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });

    await message.save();
    await message.populate('sender', 'name email role profilePicture');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    conversation.lastMessage = {
      content: inferredType === 'image' ? '[Image]' : '[File] ' + req.file.originalname,
      sender: userId,
      timestamp: message.createdAt
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      const roomName = `conversation_${conversationId}`;
      io.to(roomName).emit('new_message', {
        message,
        conversationId
      });
      io.to(roomName).emit('conversation_updated', {
        conversationId,
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending attachment:', error);
    res.status(500).json({ message: 'Error sending attachment', error: error.message });
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
    // Superadmin may pass ?libraryId=... to view a specific library; admins are scoped
    let filter = { isActive: true };
    if (req.user.role === 'superadmin' && req.query.libraryId) {
      filter.library = req.query.libraryId;
    } else if (req.user.libraryId) {
      filter.library = req.user.libraryId;
    }

    const conversations = await Conversation.find(filter)
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

    // If superadmin and server has private key, attempt to decrypt messages for monitoring
    if (req.user.role === 'superadmin') {
      const conversation = await Conversation.findById(conversationId);
      const privPem = process.env.SUPERADMIN_PRIVATE_KEY_PEM;
      if (conversation?.encryption?.enabled && privPem && conversation.encryption.wrappedKeyForSuperAdmin) {
        try {
          const convKey = crypto.privateDecrypt(
            {
              key: privPem,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: 'sha256'
            },
            Buffer.from(conversation.encryption.wrappedKeyForSuperAdmin, 'base64')
          );

          // Decrypt each message that is encrypted using AES-256-GCM
          for (const msg of result.messages) {
            if (msg.encryption?.isEncrypted && msg.encryption.ciphertext && msg.encryption.iv) {
              try {
                const iv = Buffer.from(msg.encryption.iv, 'base64');
                const ciphertext = Buffer.from(msg.encryption.ciphertext, 'base64');
                const authTag = msg.encryption.authTag ? Buffer.from(msg.encryption.authTag, 'base64') : ciphertext.slice(ciphertext.length - 16);
                const ct = msg.encryption.authTag ? ciphertext : ciphertext.slice(0, ciphertext.length - 16);
                const decipher = crypto.createDecipheriv('aes-256-gcm', convKey, iv);
                decipher.setAuthTag(authTag);
                const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
                msg.content = decrypted;
              } catch (e) {
                // Leave content as is if decryption fails
              }
            }
          }
        } catch (e) {
          // Ignore decryption issues for monitoring to avoid breaking response
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting admin messages:', error);
    res.status(500).json({ message: 'Error getting admin messages', error: error.message });
  }
});

// Admin routes - Get flagged messages
router.get('/admin/messages/flagged', authMiddleware.verifyToken, authMiddleware.adminOnly, async (req, res) => {
  try {
    // Filter by library if provided (superadmin) or scoped to admin's library
    const filter = { 'flagged.isFlagged': true, isDeleted: false };
    if (req.user.role === 'superadmin' && req.query.libraryId) {
      filter.library = req.query.libraryId;
    } else if (req.user.libraryId) {
      filter.library = req.user.libraryId;
    }

    const flaggedMessages = await Message.find(filter)
      .populate('sender', 'name email role')
      .populate('conversation', 'name type library')
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

// Add reaction to message
router.post('/messages/:messageId/reactions', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji || emoji.length > 10) {
      return res.status(400).json({ message: 'Valid emoji is required (max 10 characters)' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation || !conversation.isParticipant(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(r => r.user.toString() !== userId.toString());
    
    // Add new reaction
    message.reactions.push({
      user: userId,
      emoji: emoji,
      createdAt: new Date()
    });

    await message.save();
    await message.populate('reactions.user', 'name');

    // 🚀 REAL-TIME: Emit reaction update
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${message.conversation}`).emit('message_reaction_updated', {
        messageId: messageId,
        reactions: message.reactions,
        conversationId: message.conversation
      });
    }

    res.json({ message: 'Reaction added', reactions: message.reactions });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ message: 'Error adding reaction', error: error.message });
  }
});

// Edit message
router.put('/messages/:messageId', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or admin
    if (message.sender.toString() !== userId && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Can only edit your own messages.' });
    }

    // Check if message is too old (4 hours)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    if (message.createdAt < fourHoursAgo) {
      return res.status(400).json({ message: 'Messages can only be edited within 4 hours' });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // 🚀 REAL-TIME: Emit message edit
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${message.conversation}`).emit('message_edited', {
        messageId: messageId,
        content: content.trim(),
        editedAt: message.editedAt,
        conversationId: message.conversation
      });
    }

    res.json({ message: 'Message edited successfully', content: content.trim() });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: 'Error editing message', error: error.message });
  }
});

// Get message reactions
router.get('/messages/:messageId/reactions', authMiddleware.verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId)
      .populate('reactions.user', 'name email role profilePicture');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ reactions: message.reactions });
  } catch (error) {
    console.error('Error getting message reactions:', error);
    res.status(500).json({ message: 'Error getting reactions', error: error.message });
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