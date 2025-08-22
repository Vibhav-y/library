import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { chatAPI } from '../services/api';
import { userAPI } from '../services/api';
import PremiumMessage from './PremiumMessage';
import TypingIndicator from './TypingIndicator';
import { MessageCircle, Search } from 'lucide-react';
import ConnectionBadge from './chat/ConnectionBadge';
import ChatHeader from './chat/ChatHeader';
import ConversationList from './chat/ConversationList';
import MessageList from './chat/MessageList';
import MessageComposer from './chat/MessageComposer';

const Chat = () => {
  const { user } = useAuth();
  const { 
    socket, 
    isConnected, 
    sendTypingStart, 
    sendTypingStop, 
    joinConversations,
    markMessageAsRead 
  } = useChat();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all | private | group
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleResults, setPeopleResults] = useState([]);
  const searchTimeoutRef = useRef(null);
  
  // Message sending state
  const [isSending, setIsSending] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const listContainerRef = useRef(null);
  
  // Typing state
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 0);
    }
  }, [messages]);

  // Load initial data
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-join group chat
  useEffect(() => {
    if (conversations.length === 0) {
      joinMainGroupChat();
    }
  }, []);

  // Join WebSocket rooms when conversations are loaded
  useEffect(() => {
    if (socket && isConnected && conversations.length > 0) {
      const conversationIds = conversations.map(conv => conv._id);
      console.log('🔌 Joining conversations via Chat component:', conversationIds);
      joinConversations(conversationIds);
    }
  }, [socket, isConnected, conversations, joinConversations]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Debug: Log all socket events
    console.log('🔌 Setting up WebSocket event listeners...');
    
    // Listen for new messages in real-time - DIRECTLY from socket
    const handleNewMessage = (data) => {
      const { message, conversationId } = data;
      console.log('🚀 WebSocket: New message received:', message);
      console.log('🚀 Active conversation:', activeConversation?._id);
      console.log('🚀 Message conversation:', conversationId);
      
      // Add new message to the active conversation
      if (activeConversation && activeConversation._id === conversationId) {
        console.log('✅ Adding message to active conversation');
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        
        // Mark message as read if it's not from current user
        if (message.sender._id !== user.id) {
          markMessageAsRead(message._id, conversationId);
        }
      } else {
        console.log('❌ Message not for active conversation');
      }

      // Update conversation list with new message
      setConversations(prev => prev.map(conv => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              sender: message.sender._id,
              timestamp: message.createdAt
            },
            updatedAt: message.createdAt
          };
        }
        return conv;
      }));
    };

    // Listen for new conversation created (private chat)
    const handleConversationCreated = (data) => {
      const { conversation } = data;
      setConversations(prev => {
        const exists = prev.some(c => c._id === conversation._id);
        if (exists) return prev;
        return [conversation, ...prev];
      });
      // Auto-select when created by current user action
      setActiveConversation(conversation);
      loadMessages(conversation._id);
    };

    // Listen for message edits
    const handleMessageEdit = (data) => {
      const { messageId, content } = data;
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, content, isEdited: true, editedAt: new Date() }
          : msg
      ));
    };

    // Listen for message reactions
    const handleMessageReaction = (data) => {
      const { messageId, reactions } = data;
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, reactions }
          : msg
      ));
    };

    // Listen for conversation updates
    const handleConversationUpdate = (data) => {
      const { conversationId, lastMessage, updatedAt } = data;
      
      setConversations(prev => prev.map(conv => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            lastMessage,
            updatedAt
          };
        }
        return conv;
      }));
    };

    // Add DIRECT socket event listeners (not window events)
    socket.on('new_message', handleNewMessage);
    socket.on('conversation_created', handleConversationCreated);
    socket.on('message_edited', handleMessageEdit);
    socket.on('message_reaction_updated', handleMessageReaction);
    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      // Remove socket event listeners
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_created', handleConversationCreated);
      socket.off('message_edited', handleMessageEdit);
      socket.off('message_reaction_updated', handleMessageReaction);
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, isConnected, conversations, activeConversation, user.id, joinConversations, markMessageAsRead]);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getConversations();
      setConversations(data);
      
      // Auto-select first conversation
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
        loadMessages(data[0]._id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const data = await chatAPI.getMessages(conversationId);
      setMessages(data.messages || []);
      // Scroll after messages render
      setTimeout(() => scrollToBottom(true), 0);
      
      // Mark messages as read
      await chatAPI.markAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      console.log('📤 Sending message via WebSocket...');
      
      // Create a temporary message object to show immediately
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        content: messageContent,
        sender: {
          _id: user.id,
          name: user.name,
          role: user.role
        },
        conversation: activeConversation._id,
        createdAt: new Date(),
        isTemp: true
      };

      // Add message to UI immediately
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();

      // Send message via API
      const response = await chatAPI.sendMessage(activeConversation._id, messageContent);
      
      // Replace temp message with real message
      setMessages(prev => prev.map(msg => 
        msg.isTemp ? response : msg
      ));
      
      // Stop typing indicator
      sendTypingStop(activeConversation._id);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStart(activeConversation._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 1 second of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStop(activeConversation._id);
    }, 1000);
  };

  // Scroll to bottom
  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    }
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight;
    }
  };

  // Join main group chat
  const joinMainGroupChat = async () => {
    try {
      const groupChat = await chatAPI.joinGroupChat();
      setConversations(prev => [groupChat, ...prev]);
        setActiveConversation(groupChat);
        loadMessages(groupChat._id);
    } catch (error) {
      console.error('Error joining group chat:', error);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
      setActiveConversation(conversation);
      loadMessages(conversation._id);
  };

  // Handle message deletion
  const handleMessageDelete = (messageId) => {
    setMessages(prev => prev.filter(msg => msg._id !== messageId));
  };

  // Handle message edit
  const handleMessageEdit = (messageId, newContent) => {
    setMessages(prev => prev.map(msg => 
      msg._id === messageId 
        ? { ...msg, content: newContent, isEdited: true, editedAt: new Date() }
        : msg
    ));
  };

  // Handle key press for sending messages
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Chats</h2>
            <ConnectionBadge connected={isConnected} />
            </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
                    </div>
                  </div>

        <div className="px-4 py-2 flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('private')}
            className={`text-xs px-3 py-1 rounded-full border ${filter === 'private' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700'}`}
          >
            Personal
          </button>
                    <button
            onClick={() => setFilter('group')}
            className={`text-xs px-3 py-1 rounded-full border ${filter === 'group' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700'}`}
                    >
            Groups
                    </button>
                      <button
            onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1 rounded-full border ${filter === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700'}`}
                      >
            All
                      </button>
              </div>

        <ConversationList
          conversations={conversations.filter(c => filter === 'all' ? true : c.type === filter)}
          activeId={activeConversation?._id}
          onSelect={handleConversationSelect}
          currentUserId={user.id}
          searchTerm={searchTerm}
          headerAddon={filter === 'private' ? (
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={peopleSearch}
                onChange={(e) => {
                  const q = e.target.value;
                  setPeopleSearch(q);
                  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  searchTimeoutRef.current = setTimeout(async () => {
                    if (q.trim().length === 0) {
                      setPeopleResults([]);
                      return;
                    }
                    try {
                      const results = await chatAPI.searchUsers(q);
                      setPeopleResults(results);
                    } catch (err) {
                      console.error('Search users error:', err);
                    }
                  }, 300);
                }}
                placeholder="Search people to start chat..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {peopleResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg max-h-56 overflow-y-auto shadow-sm">
                  {peopleResults.map(p => (
                    <div
                      key={p._id}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex items-center justify-between"
                      onClick={async () => {
                        try {
                          const conv = await chatAPI.createPrivateConversation(p._id);
                          // Insert/activate conversation
                          setConversations(prev => {
                            const exists = prev.find(c => c._id === conv._id);
                            if (exists) return prev;
                            return [conv, ...prev];
                          });
                          setActiveConversation(conv);
                          setPeopleSearch('');
                          setPeopleResults([]);
                          loadMessages(conv._id);
                        } catch (err) {
                          console.error('Create private conversation error:', err);
                        }
                      }}
                    >
                      <span className="text-gray-800">{p.name}</span>
                      <span className="text-xs text-gray-500">{p.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        />
            </div>

      {/* Main Area */}
            <div className="flex-1 flex flex-col">
              {activeConversation ? (
                <>
            <ChatHeader conversation={activeConversation} currentUser={user} />

            {messagesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={user.id}
                onDelete={handleMessageDelete}
                onEdit={handleMessageEdit}
                typingIndicator={activeConversation && (
                  <TypingIndicator conversationId={activeConversation._id} />
                )}
              />
                    )}
                    
                    <div ref={messagesEndRef} />

            <MessageComposer
                          value={newMessage}
              onChange={handleTyping}
              onSend={sendMessage}
                          onKeyPress={handleKeyPress}
              isSending={isSending}
              disabled={activeConversation?.type === 'group' && activeConversation?.name === 'Announcement' && !(user.role === 'admin' || user.role === 'superadmin')}
              disabledReason={activeConversation?.type === 'group' && activeConversation?.name === 'Announcement' && !(user.role === 'admin' || user.role === 'superadmin') ? 'Only admins can post in Announcement.' : undefined}
            />
                </>
              ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
              <p>Choose a chat from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
    </div>
  );
};

export default Chat;