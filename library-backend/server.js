// File: server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow no origin (health checks) and any origin by default
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware - Allow CORS from all domains
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Additional CORS headers for maximum compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/document', require('./routes/document'));
app.use('/api/category', require('./routes/category'));
app.use('/api/students', require('./routes/student'));
app.use('/api/notice', require('./routes/notice'));
app.use('/api/customization', require('./routes/customization'));
app.use('/api/announcement', require('./routes/announcement'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/thought', require('./routes/thoughtOfTheDay'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/library', require('./routes/library'));
app.use('/api/fee-structures', require('./routes/feeStructure'));

// Make io available to routes
app.set('io', io);

// Simple migration function for existing users without names
const migrateExistingUsers = async () => {
  try {
    const User = require('./models/User');
    const usersWithoutNames = await User.find({ 
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' }
      ]
    });
    
    if (usersWithoutNames.length > 0) {

      
      for (const user of usersWithoutNames) {
        const emailName = user.email.split('@')[0];
        const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        user.name = capitalizedName;
        await user.save();
      }
      

    }
  } catch (error) {

  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library')
.then(async () => {
  console.log('MongoDB connected');
  
  // Run migration after database connection
  migrateExistingUsers();
  
  // Initialize customization models
  const { initializePredefinedThemes, initializeCustomization } = require('./models/Customization');
  await initializePredefinedThemes();
  await initializeCustomization();
})
.catch(err => console.log(err));

// Socket.io connection handling
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL ERROR: JWT_SECRET environment variable is not set!');
  console.error('❌ WebSocket authentication will fail!');
  process.exit(1);
}

console.log('✅ JWT_SECRET is configured');

// Store online users with enhanced data
const onlineUsers = new Map(); // Map of socketId -> { userId, user, lastSeen, status }

io.use(async (socket, next) => {
  try {
    console.log('🔐 WebSocket auth attempt:', {
      hasToken: !!socket.handshake.auth.token,
      tokenLength: socket.handshake.auth.token?.length || 0,
      headers: Object.keys(socket.handshake.headers)
    });

    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('⚠️ No token provided - allowing unauthenticated connection for debugging');
      // Allow unauthenticated connections for debugging
      socket.userId = null;
      socket.user = { name: 'Anonymous', role: 'guest' };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔐 JWT decoded successfully:', {
        userId: decoded.id,
        hasId: !!decoded.id
      });

      const user = await User.findById(decoded.id);
      if (!user) {
        console.log('❌ User not found for WebSocket connection:', decoded.id);
        return next(new Error('User not found'));
      }

      console.log('✅ WebSocket authentication successful:', {
        userId: user._id,
        userName: user.name,
        userRole: user.role
      });

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      // Allow connection with limited access for debugging
      socket.userId = null;
      socket.user = { name: 'Invalid Token', role: 'guest' };
      next();
    }
  } catch (err) {
    console.error('❌ WebSocket authentication error:', err.message);
    // Allow connection with limited access for debugging
    socket.userId = null;
    socket.user = { name: 'Error', role: 'guest' };
    next();
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User ${socket.user.name} connected (${socket.userId || 'Anonymous'}) - Socket ID: ${socket.id}`);
  
  // Add user to online users with enhanced data
  onlineUsers.set(socket.id, {
    userId: socket.userId,
    user: socket.user,
    lastSeen: new Date(),
    status: 'online'
  });
  
  // 🚀 PREMIUM: Emit user online status to all clients
  socket.broadcast.emit('user_status_changed', {
    userId: socket.userId,
    status: 'online',
    name: socket.user.name,
    role: socket.user.role
  });
  
  // Join user to their conversations
  socket.on('join_conversations', async (conversationIds) => {
    if (Array.isArray(conversationIds)) {
      console.log(`🏠 User ${socket.user.name} joining conversations:`, conversationIds);
      
      // Leave any existing conversation rooms first
      const currentRooms = Array.from(socket.rooms);
      currentRooms.forEach(room => {
        if (room.startsWith('conversation_')) {
          socket.leave(room);
          console.log(`🚪 User ${socket.user.name} left room: ${room}`);
        }
      });
      
      // Join new conversation rooms
      conversationIds.forEach(convId => {
        socket.join(`conversation_${convId}`);
        console.log(`✅ User ${socket.user.name} joined room: conversation_${convId}`);
      });
      
      // Debug: Check which rooms the user is in
      const rooms = Array.from(socket.rooms);
      console.log(`🏠 User ${socket.user.name} is now in rooms:`, rooms);
      
      // Verify room membership
      conversationIds.forEach(convId => {
        const roomName = `conversation_${convId}`;
        const room = io.sockets.adapter.rooms.get(roomName);
        if (room && room.has(socket.id)) {
          console.log(`✅ Verified: User ${socket.user.name} is in room ${roomName}`);
        } else {
          console.log(`❌ ERROR: User ${socket.user.name} failed to join room ${roomName}`);
        }
      });
    }
  });

  // 🚀 PREMIUM: Enhanced typing indicators with user info
  socket.on('typing_start', (data) => {
    console.log(`⌨️ Typing start from ${socket.user.name} in conversation ${data.conversationId}`);
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name,
      userRole: socket.user.role,
      conversationId: data.conversationId,
      timestamp: new Date()
    });
  });

  socket.on('typing_stop', (data) => {
    console.log(`⏹️ Typing stop from ${socket.user.name} in conversation ${data.conversationId}`);
    socket.to(`conversation_${data.conversationId}`).emit('user_stop_typing', {
      userId: socket.userId,
      conversationId: data.conversationId,
      timestamp: new Date()
    });
  });

  // 🚀 PREMIUM: Message read receipts
  socket.on('mark_message_read', async (data) => {
    console.log(`👁️ Mark message read from ${socket.user.name} for message ${data.messageId}`);
    try {
      const { messageId, conversationId } = data;
      
      // Update message read status in database
      const Message = require('./models/Message');
      const message = await Message.findById(messageId);
      
      if (message && !message.isReadBy(socket.userId)) {
        message.markAsRead(socket.userId);
        await message.save();
        
        // Emit read receipt to conversation
        socket.to(`conversation_${conversationId}`).emit('message_read', {
          messageId: messageId,
          userId: socket.userId,
          userName: socket.user.name,
          conversationId: conversationId,
          readAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // 🚀 PREMIUM: User status updates
  socket.on('update_status', (data) => {
    const { status } = data;
    const userData = onlineUsers.get(socket.id);
    
    if (userData) {
      userData.status = status;
      userData.lastSeen = new Date();
      onlineUsers.set(socket.id, userData);
      
      // Broadcast status change
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        status: status,
        name: socket.user.name,
        role: socket.user.role,
        lastSeen: userData.lastSeen
      });
    }
  });

  // 🚀 PREMIUM: Typing indicators for specific users
  socket.on('typing_start_private', (data) => {
    const { targetUserId } = data;
    socket.to(`user_${targetUserId}`).emit('user_typing_private', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date()
    });
  });

  socket.on('typing_stop_private', (data) => {
    const { targetUserId } = data;
    socket.to(`user_${targetUserId}`).emit('user_stop_typing_private', {
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  // Join user to their personal room for private messages
  socket.join(`user_${socket.userId}`);

  // Handle user going online/offline
  socket.emit('user_online', { userId: socket.userId });

  // 🧪 Test WebSocket connection
  socket.on('test_message', (data) => {
    console.log('🧪 Test message received:', data);
    socket.emit('test_response', { 
      message: 'WebSocket is working!', 
      timestamp: new Date(),
      data: data 
    });
  });

  // 🧪 Test real-time message
  socket.on('test_real_message', (data) => {
    console.log('🧪 Test real-time message received:', data);
    const { conversationId, content, sender } = data;
    
    // Emit to the conversation room
    socket.to(`conversation_${conversationId}`).emit('new_message', {
      message: {
        _id: `test_${Date.now()}`,
        content: content,
        sender: sender,
        conversation: conversationId,
        createdAt: new Date(),
        isTest: true
      },
      conversationId: conversationId,
      sender: sender
    });
    
    console.log(`🧪 Test message emitted to room: conversation_${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected`);
    
    // Update user status to offline
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      userData.status = 'offline';
      userData.lastSeen = new Date();
      
      // Notify others that user went offline (only if authenticated)
      if (socket.userId) {
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          status: 'offline',
          name: socket.user.name,
          role: socket.user.role,
          lastSeen: userData.lastSeen
        });
      }
    }
    
    onlineUsers.delete(socket.id);
  });
});

// 🚀 PREMIUM: Get online users with enhanced data
app.get('/api/chat/users/online', (req, res) => {
  const onlineUsersList = Array.from(onlineUsers.values()).map(userData => ({
    userId: userData.userId,
    name: userData.user.name,
    email: userData.user.email,
    role: userData.user.role,
    profilePicture: userData.user.profilePicture,
    status: userData.status,
    lastSeen: userData.lastSeen
  }));
  
  res.json(onlineUsersList);
});

// 🧪 Test WebSocket server status
app.get('/api/chat/status', (req, res) => {
  const connectedSockets = Array.from(io.sockets.sockets.values());
  const allRooms = Array.from(io.sockets.adapter.rooms.keys());
  
  res.json({
    status: 'WebSocket server is running',
    connectedSockets: connectedSockets.length,
    allRooms: allRooms,
    timestamp: new Date().toISOString()
  });
});

// Make online users available globally
app.set('onlineUsers', onlineUsers);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server initialized`);
});