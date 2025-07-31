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
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware - Allow CORS from all domains
app.use(cors({
  origin: true, // Allow all domains
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Additional CORS headers for maximum compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
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

// Store online users
const onlineUsers = new Map(); // Map of socketId -> userId

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User ${socket.user.name} connected (${socket.userId}) - Socket ID: ${socket.id}`);
  
  // Add user to online users
  onlineUsers.set(socket.id, socket.userId);
  
  // Join user to their conversations
  socket.on('join_conversations', async (conversationIds) => {
    if (Array.isArray(conversationIds)) {
      console.log(`🏠 User ${socket.user.name} joining conversations:`, conversationIds);
      conversationIds.forEach(convId => {
        socket.join(`conversation_${convId}`);
        console.log(`✅ Joined room: conversation_${convId}`);
      });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name,
      conversationId: data.conversationId
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stop_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });

  // Handle user going online/offline
  socket.emit('user_online', { userId: socket.userId });
  socket.broadcast.emit('user_online', { userId: socket.userId });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected`);
    onlineUsers.delete(socket.id);
    
    // Notify others that user went offline
    socket.broadcast.emit('user_offline', { userId: socket.userId });
  });
});

// Make online users available globally
app.set('onlineUsers', onlineUsers);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server initialized`);
});