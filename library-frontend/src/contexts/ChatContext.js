import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const socketRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log('🔌 User data for WebSocket:', {
      userId: user.id || user._id,
      userName: user.name,
      userRole: user.role,
      hasConversations: !!user.conversations,
      conversationsCount: user.conversations?.length || 0,
      userKeys: Object.keys(user)
    });

    console.log('🔌 Attempting WebSocket connection...');
    console.log('🔐 JWT token present:', !!token, 'length:', token?.length || 0);
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Add connection event listeners
    newSocket.on('connect', () => {
      console.log('🚀 WebSocket connected:', newSocket.id);
      setIsConnected(true);

      // Immediately join user's conversations when WebSocket connects
      // Don't wait for the Chat component to load conversations
      if (user && user.conversations && user.conversations.length > 0) {
        const conversationIds = user.conversations.map(conv => conv._id);
        console.log('🔌 Immediately joining conversations on connect:', conversationIds);
        newSocket.emit('join_conversations', conversationIds);
      } else {
        console.log('⚠️ No conversations to join for user:', user);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context
      });
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('❌ WebSocket general error:', error);
    });

    newSocket.on('new_message', (data) => {
      console.log('📨 New message received via WebSocket:', data);
      // Event will be handled directly by Chat component
    });

    newSocket.on('message_edited', (data) => {
      console.log('✏️ Message edited via WebSocket:', data);
      // Event will be handled directly by Chat component
    });

    newSocket.on('message_reaction_updated', (data) => {
      console.log('😀 Reaction updated via WebSocket:', data);
      // Event will be handled directly by Chat component
    });

    newSocket.on('message_read', (data) => {
      console.log('👁️ Message read via WebSocket:', data);
      // Event will be handled directly by Chat component
    });

    newSocket.on('user_typing', (data) => {
      console.log('⌨️ User typing via WebSocket:', data);
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const key = `${data.conversationId}-${data.userId}`;
        newMap.set(key, {
          userId: data.userId,
          userName: data.userName,
          userRole: data.userRole,
          timestamp: data.timestamp
        });
        return newMap;
      });
    });

    newSocket.on('user_stop_typing', (data) => {
      console.log('⏹️ User stopped typing via WebSocket:', data);
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const key = `${data.conversationId}-${data.userId}`;
        newMap.delete(key);
        return newMap;
      });
    });

    newSocket.on('user_status_changed', (data) => {
      console.log('👤 User status changed via WebSocket:', data);
      setOnlineUsers(prev => {
        const existingIndex = prev.findIndex(u => u.userId === data.userId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status: data.status,
            lastSeen: data.lastSeen
          };
          return updated;
        } else if (data.status === 'online') {
          return [...prev, {
            userId: data.userId,
            name: data.name,
            role: data.role,
            status: data.status,
            lastSeen: data.lastSeen
          }];
        }
        return prev;
      });
    });

    newSocket.on('conversation_updated', (data) => {
      console.log('💬 Conversation updated via WebSocket:', data);
      // Event will be handled directly by Chat component
    });

    // 🧪 Test WebSocket response
    newSocket.on('test_response', (data) => {
      console.log('🧪 Test response received:', data);
      alert(`WebSocket Test: ${data.message}`);
    });

    return () => {
      console.log('🧹 Cleaning up WebSocket connection...');
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  // 🚀 PREMIUM: Send typing indicators
  const sendTypingStart = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId });
    }
  };

  const sendTypingStop = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId });
    }
  };

  // 🚀 PREMIUM: Mark message as read
  const markMessageAsRead = (messageId, conversationId) => {
    if (socket && isConnected) {
      socket.emit('mark_message_read', { messageId, conversationId });
    }
  };

  // 🚀 PREMIUM: Update user status
  const updateUserStatus = (status) => {
    if (socket && isConnected) {
      socket.emit('update_status', { status });
    }
  };

  // 🚀 PREMIUM: Join conversations
  const joinConversations = (conversationIds) => {
    if (socket && isConnected) {
      console.log('🔌 Joining conversations via WebSocket:', conversationIds);
      socket.emit('join_conversations', conversationIds);
    } else {
      console.log('❌ Cannot join conversations - socket not connected');
    }
  };

  // Get typing users for a specific conversation
  const getTypingUsers = (conversationId) => {
    const typing = [];
    typingUsers.forEach((userData, key) => {
      if (key.startsWith(`${conversationId}-`)) {
        typing.push(userData);
      }
    });
    return typing;
  };

  // Check if user is typing in a conversation
  const isUserTyping = (conversationId, userId) => {
    const key = `${conversationId}-${userId}`;
    return typingUsers.has(key);
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    unreadCounts,
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead,
    updateUserStatus,
    joinConversations,
    getTypingUsers,
    isUserTyping
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
