import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/environment';

const useSocket = (user) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && user.token) {
      console.log('🔌 Initializing socket connection to:', API_BASE_URL);
      console.log('👤 User token available:', !!user.token);
      
      // Initialize socket connection
      const newSocket = io(API_BASE_URL, {
        auth: {
          token: user.token || localStorage.getItem('token')
        },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      socketRef.current = newSocket;

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully:', newSocket.id);
        setIsConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚨 Socket connection error:', error);
        setIsConnected(false);
      });

      // Online/offline user tracking
      newSocket.on('user_online', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      newSocket.on('user_offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      return () => {
        newSocket.close();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user]);

  // Join conversations
  const joinConversations = (conversationIds) => {
    if (socket && isConnected) {
      socket.emit('join_conversations', conversationIds);
    }
  };

  // Typing indicators
  const startTyping = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId });
    }
  };

  const stopTyping = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId });
    }
  };

  // Event listeners
  const onNewMessage = (callback) => {
    if (socket) {
      console.log('🎧 Setting up new_message listener');
      socket.on('new_message', callback);
      return () => {
        console.log('🧹 Cleaning up new_message listener');
        socket.off('new_message', callback);
      };
    }
    // Return empty cleanup function if socket not ready
    return () => {};
  };

  const onMessageDeleted = (callback) => {
    if (socket) {
      console.log('🎧 Setting up message_deleted listener');
      socket.on('message_deleted', callback);
      return () => {
        console.log('🧹 Cleaning up message_deleted listener');
        socket.off('message_deleted', callback);
      };
    }
    return () => {};
  };

  const onUserTyping = (callback) => {
    if (socket) {
      console.log('🎧 Setting up user_typing listener');
      socket.on('user_typing', callback);
      return () => {
        console.log('🧹 Cleaning up user_typing listener');
        socket.off('user_typing', callback);
      };
    }
    return () => {};
  };

  const onUserStopTyping = (callback) => {
    if (socket) {
      console.log('🎧 Setting up user_stop_typing listener');
      socket.on('user_stop_typing', callback);
      return () => {
        console.log('🧹 Cleaning up user_stop_typing listener');
        socket.off('user_stop_typing', callback);
      };
    }
    return () => {};
  };

  return {
    socket,
    isConnected,
    onlineUsers,
    joinConversations,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageDeleted,
    onUserTyping,
    onUserStopTyping
  };
};

export default useSocket;