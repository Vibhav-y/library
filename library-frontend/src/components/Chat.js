import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';
import { 
  MessageCircle, 
  Send, 
  Users, 
  Search, 
  X, 
  Plus,
  MoreVertical,
  Reply,
  Trash2,
  Flag,
  User,
  Circle,
  Smile,
  Settings,
  Edit,
  Crown,
  UserMinus,
  UserPlus
} from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Admin group management
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    participants: []
  });
  const [editingGroup, setEditingGroup] = useState(null);
  
  // Polling state
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  // Mobile detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(false); // Hide mobile sidebar on desktop
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Load initial data
  useEffect(() => {
    loadConversations();
    loadOnlineUsers();
    loadAllUsers(); // For admin group management
  }, []);

  // Auto-join group chat
  useEffect(() => {
    if (conversations.length === 0) {
      joinMainGroupChat();
    }
  }, []);

  // Polling for new messages
  const pollForNewMessages = useCallback(async () => {
    if (!activeConversation || !lastMessageTimestamp || isPolling) {
      return;
    }

    try {
      setIsPolling(true);
      console.log('🔄 Polling for new messages after:', lastMessageTimestamp);
      
      const result = await chatAPI.getNewMessages(activeConversation._id, lastMessageTimestamp);
      
      if (result.hasNew && result.messages.length > 0) {
        console.log('📨 Found new messages:', result.messages.length);
        setMessages(prev => [...prev, ...result.messages]);
        setLastMessageTimestamp(result.latestTimestamp);
        scrollToBottom();
        
        // Update conversation last message
        const latestMessage = result.messages[result.messages.length - 1];
        setConversations(prev => prev.map(conv => 
          conv._id === activeConversation._id 
            ? { ...conv, lastMessage: latestMessage, updatedAt: latestMessage.createdAt }
            : conv
        ));
      }
    } catch (error) {
      console.error('❌ Error polling for new messages:', error);
    } finally {
      setIsPolling(false);
    }
  }, [activeConversation, lastMessageTimestamp, isPolling]);

  // Set up polling interval
  useEffect(() => {
    if (activeConversation && lastMessageTimestamp) {
      console.log('⏰ Starting message polling for conversation:', activeConversation._id);
      
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // Start polling every 3 seconds
      pollingIntervalRef.current = setInterval(pollForNewMessages, 3000);
      
      return () => {
        console.log('🛑 Stopping message polling');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [activeConversation, lastMessageTimestamp, pollForNewMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await chatAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId, page = 1) => {
    try {
      setMessagesLoading(true);
      console.log('📥 Loading messages for conversation:', conversationId);
      const data = await chatAPI.getMessages(conversationId, page);
      
      if (page === 1) {
        setMessages(data.messages);
        
        // Set timestamp for polling - use the latest message timestamp or current time
        const latestTimestamp = data.messages.length > 0 
          ? data.messages[data.messages.length - 1].createdAt 
          : new Date().toISOString();
        
        setLastMessageTimestamp(latestTimestamp);
        console.log('⏰ Set polling timestamp to:', latestTimestamp);
      } else {
        setMessages(prev => [...data.messages, ...prev]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const users = await chatAPI.getOnlineUsers();
      setOnlineUsers(users);
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  };

  // Admin group management functions
  const loadAllUsers = async () => {
    if (user.role === 'admin' || user.role === 'superadmin') {
      try {
        const users = await chatAPI.admin.getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error('Error loading all users:', error);
      }
    }
  };

  const createGroup = async () => {
    try {
      const newGroup = await chatAPI.admin.createGroup(
        groupForm.name,
        groupForm.description,
        groupForm.participants
      );
      
      setConversations(prev => [newGroup, ...prev]);
      setShowCreateGroup(false);
      setGroupForm({ name: '', description: '', participants: [] });
      
      // Auto-select the new group
      setActiveConversation(newGroup);
      loadMessages(newGroup._id);
    } catch (error) {
      console.error('Error creating group:', error);
      alert(error.response?.data?.message || 'Error creating group');
    }
  };

  const updateGroup = async () => {
    if (!editingGroup) return;
    
    try {
      const updatedGroup = await chatAPI.admin.updateGroup(
        editingGroup._id,
        groupForm.name,
        groupForm.description
      );
      
      setConversations(prev => prev.map(conv => 
        conv._id === updatedGroup._id ? updatedGroup : conv
      ));
      
      if (activeConversation?._id === updatedGroup._id) {
        setActiveConversation(updatedGroup);
      }
      
      setEditingGroup(null);
      setGroupForm({ name: '', description: '', participants: [] });
      setShowGroupManagement(false);
    } catch (error) {
      console.error('Error updating group:', error);
      alert(error.response?.data?.message || 'Error updating group');
    }
  };

  const addMembersToGroup = async (groupId, userIds) => {
    try {
      const result = await chatAPI.admin.addGroupMembers(groupId, userIds);
      
      // Update conversations list
      setConversations(prev => prev.map(conv => 
        conv._id === groupId ? result.group : conv
      ));
      
      // Update active conversation if it's the same group
      if (activeConversation?._id === groupId) {
        setActiveConversation(result.group);
      }
      
      // Refresh messages to show system message
      loadMessages(groupId);
    } catch (error) {
      console.error('Error adding members:', error);
      alert(error.response?.data?.message || 'Error adding members');
    }
  };

  const removeMemberFromGroup = async (groupId, userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) return;
    
    try {
      const result = await chatAPI.admin.removeGroupMember(groupId, userId);
      
      // Update conversations list
      setConversations(prev => prev.map(conv => 
        conv._id === groupId ? result.group : conv
      ));
      
      // Update active conversation if it's the same group
      if (activeConversation?._id === groupId) {
        setActiveConversation(result.group);
      }
      
      // Refresh messages to show system message
      loadMessages(groupId);
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.message || 'Error removing member');
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    
    try {
      await chatAPI.admin.deleteGroup(groupId);
      
      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv._id !== groupId));
      
      // Clear active conversation if it was the deleted group
      if (activeConversation?._id === groupId) {
        setActiveConversation(null);
        setMessages([]);
      }
      
      setShowGroupManagement(false);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert(error.response?.data?.message || 'Error deleting group');
    }
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
      participants: group.participants.map(p => p.user._id)
    });
    setShowGroupManagement(true);
  };

  const joinMainGroupChat = async () => {
    try {
      const groupChat = await chatAPI.joinGroupChat();
      setConversations(prev => {
        const exists = prev.find(conv => conv._id === groupChat._id);
        if (!exists) {
          return [groupChat, ...prev];
        }
        return prev;
      });
      
      if (!activeConversation) {
        setActiveConversation(groupChat);
        loadMessages(groupChat._id);
      }
    } catch (error) {
      console.error('Error joining group chat:', error);
    }
  };

  const startPrivateConversation = async (userId) => {
    try {
      const conversation = await chatAPI.createPrivateConversation(userId);
      
      setConversations(prev => {
        const exists = prev.find(conv => conv._id === conversation._id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
      
      setActiveConversation(conversation);
      loadMessages(conversation._id);
      setShowUserList(false);
    } catch (error) {
      console.error('Error starting private conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    console.log('📤 Sending message:', {
      content: newMessage.trim(),
      conversationId: activeConversation._id
    });

    try {
      const message = await chatAPI.sendMessage(
        activeConversation._id,
        newMessage.trim()
      );
      
      console.log('📤 Message sent successfully:', message);
      setNewMessage('');
      
      // Add message to current messages immediately
      setMessages(prev => [...prev, message]);
      
      // Update timestamp for polling
      setLastMessageTimestamp(message.createdAt);
      
      // Update conversations list
      setConversations(prev => prev.map(conv => 
        conv._id === activeConversation._id 
          ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
          : conv
      ));
      
      scrollToBottom();
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simplified typing handler (no real-time typing indicators with polling)
  const handleTyping = useCallback(() => {
    // For polling approach, we don't implement typing indicators
    // as they require real-time updates
  }, []);

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await chatAPI.deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
    }
    
    // Private conversation - get other user's name
    const otherUser = conversation.participants.find(
      p => p.user._id !== user.id
    );
    return otherUser?.user.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return <Users className="h-8 w-8 text-blue-600" />;
    }
    
    const otherUser = conversation.participants.find(
      p => p.user._id !== user.id
    );
    
    if (otherUser?.user.profilePicture) {
      return (
        <img 
          src={otherUser.user.profilePicture} 
          alt={otherUser.user.name}
          className="h-8 w-8 rounded-full object-cover"
        />
      );
    }
    
    return <User className="h-8 w-8 text-gray-600" />;
  };

  const filteredUsers = onlineUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-6">
        <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl sm:rounded-3xl border border-white/30 overflow-hidden h-[calc(100vh-1rem)] sm:h-[calc(100vh-8rem)]">
          
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-white" />
              </button>
              <h1 className="text-lg font-bold text-white">
                {activeConversation ? getConversationName(activeConversation) : 'Chat'}
              </h1>
              <div className="w-9" /> {/* Spacer for centering */}
            </div>
          )}

          <div className="flex h-full">
            {/* Mobile Sidebar Overlay */}
            {isMobile && showSidebar && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div className="fixed inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
                <div className="relative flex flex-col max-w-xs w-full bg-white h-full shadow-xl">
                  {/* Mobile Sidebar Content */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600">
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Conversations
                    </h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setShowUserList(true);
                          setShowSidebar(false);
                        }}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        title="Start new conversation"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                      {(user.role === 'admin' || user.role === 'superadmin') && (
                        <button
                          onClick={() => {
                            setShowCreateGroup(true);
                            setShowSidebar(false);
                          }}
                          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                          title="Create new group"
                        >
                          <Users className="h-4 w-4 text-white" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowSidebar(false)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Conversations List */}
                  <div className="flex-1 overflow-y-auto">
                    {conversations.map((conversation, index) => (
                      <div
                        key={conversation._id}
                        onClick={() => {
                          setActiveConversation(conversation);
                          loadMessages(conversation._id);
                          setShowSidebar(false);
                        }}
                        className={`p-4 border-b border-gray-200/30 cursor-pointer transition-colors hover:bg-gray-50/50 ${
                          activeConversation?._id === conversation._id ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getConversationAvatar(conversation)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {getConversationName(conversation)}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500 truncate">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Sidebar - Conversations List */}
            <div className={`${isMobile ? 'hidden' : 'w-1/3'} border-r border-gray-200/50 flex flex-col`}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <MessageCircle className="h-6 w-6 mr-2" />
                    Chat
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowUserList(true)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Start new conversation"
                    >
                      <Plus className="h-5 w-5 text-white" />
                    </button>
                    {(user.role === 'admin' || user.role === 'superadmin') && (
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        title="Create new group"
                      >
                        <Users className="h-5 w-5 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation, index) => (
                  <div
                    key={conversation._id}
                    onClick={() => {
                      setActiveConversation(conversation);
                      loadMessages(conversation._id);
                    }}
                    className={`p-4 border-b border-gray-200/30 cursor-pointer transition-colors hover:bg-gray-50/50 ${
                      activeConversation?._id === conversation._id ? 'bg-blue-50/50' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getConversationAvatar(conversation)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {getConversationName(conversation)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeConversation ? (
                <>
                  {/* Desktop Chat Header */}
                  {!isMobile && (
                    <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-white/90 to-white/70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getConversationAvatar(activeConversation)}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {getConversationName(activeConversation)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {activeConversation.type === 'group' 
                                ? `${activeConversation.participants.length} members`
                                : 'Private conversation'
                              }
                            </p>
                          </div>
                        </div>
                      {(user.role === 'admin' || user.role === 'superadmin') && activeConversation.type === 'group' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditGroup(activeConversation)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100/50 transition-colors"
                            title="Manage group"
                          >
                            <Settings className="h-5 w-5" />
                          </button>
                          {activeConversation.name !== 'General Discussion' && (
                            <button
                              onClick={() => deleteGroup(activeConversation._id)}
                              className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete group"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      )}
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100/50 transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
                    {messagesLoading && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    )}
                    
                    {messages.map((message, index) => (
                      <div
                        key={message._id}
                        className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl ${
                            message.sender._id === user.id
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-white/80 text-gray-900 border border-gray-200/50'
                          }`}
                        >
                          {message.sender._id !== user.id && (
                            <p className="text-xs font-semibold mb-1 text-gray-600">
                              {message.sender.name}
                            </p>
                          )}
                          <p className="text-sm break-words">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${
                              message.sender._id === user.id ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                            {message.sender._id === user.id && (
                              <button
                                onClick={() => deleteMessage(message._id)}
                                className="ml-2 text-white/70 hover:text-white p-1 -m-1 touch-manipulation"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Polling status indicator */}
                    {isPolling && (
                      <div className="flex justify-center">
                        <div className="bg-blue-100/80 px-3 py-1 rounded-xl">
                          <p className="text-xs text-blue-600">Checking for new messages...</p>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 sm:p-4 border-t border-gray-200/50 bg-white/50">
                    <div className="flex items-end space-x-2 sm:space-x-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          rows={isMobile ? 2 : 1}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/80 border border-gray-200/50 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all duration-200 text-base"
                          style={{ minHeight: isMobile ? '44px' : 'auto' }}
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="p-2 sm:p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* No conversation selected */
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center max-w-sm">
                    <MessageCircle className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Welcome to Chat</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      {isMobile ? 'Tap the chat icon to view conversations' : 'Select a conversation to start chatting'}
                    </p>
                    {!isMobile && (
                      <button
                        onClick={() => setShowUserList(true)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start New Conversation
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User List Modal */}
      {showUserList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Start New Conversation</h3>
                <button
                  onClick={() => setShowUserList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
                />
              </div>

              {/* Users List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredUsers.map((onlineUser) => (
                  <button
                    key={onlineUser._id}
                    onClick={() => startPrivateConversation(onlineUser._id)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors touch-manipulation"
                  >
                    <div className="relative">
                      {onlineUser.profilePicture ? (
                        <img 
                          src={onlineUser.profilePicture} 
                          alt={onlineUser.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      <Circle className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500 fill-current" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">{onlineUser.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{onlineUser.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (user.role === 'admin' || user.role === 'superadmin') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setGroupForm({ name: '', description: '', participants: [] });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                                      <input
                      type="text"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter group name..."
                      className="w-full px-3 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter group description..."
                    rows={3}
                    className="w-full px-3 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Members
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                    {allUsers.map((member) => (
                      <label key={member._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={groupForm.participants.includes(member._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGroupForm(prev => ({
                                ...prev,
                                participants: [...prev.participants, member._id]
                              }));
                            } else {
                              setGroupForm(prev => ({
                                ...prev,
                                participants: prev.participants.filter(id => id !== member._id)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 flex items-center space-x-2">
                          {member.profilePicture ? (
                            <img 
                              src={member.profilePicture} 
                              alt={member.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                          )}
                          <span className="text-sm text-gray-900">{member.name}</span>
                          <span className="text-xs text-gray-500 capitalize">{member.role}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setGroupForm({ name: '', description: '', participants: [] });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={!groupForm.name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {showGroupManagement && editingGroup && (user.role === 'admin' || user.role === 'superadmin') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                  Manage Group: {editingGroup.name}
                </h3>
                <button
                  onClick={() => {
                    setShowGroupManagement(false);
                    setEditingGroup(null);
                    setGroupForm({ name: '', description: '', participants: [] });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Group Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Group Details</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={groupForm.description}
                      onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Current Members */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      Members ({editingGroup.participants.length})
                    </h4>
                    <button
                      onClick={() => {
                        const nonMembers = allUsers.filter(user => 
                          !editingGroup.participants.some(p => p.user._id === user._id)
                        );
                        if (nonMembers.length === 0) {
                          alert('All users are already members of this group');
                          return;
                        }
                        
                        const selectedUsers = nonMembers.filter((_, index) => 
                          window.confirm(`Add ${nonMembers[index]?.name} to the group?`)
                        );
                        
                        if (selectedUsers.length > 0) {
                          addMembersToGroup(editingGroup._id, selectedUsers.map(u => u._id));
                        }
                      }}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Members
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {editingGroup.participants.map((participant) => (
                      <div key={participant.user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {participant.user.profilePicture ? (
                            <img 
                              src={participant.user.profilePicture} 
                              alt={participant.user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{participant.user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{participant.user.role}</p>
                          </div>
                          {participant.role === 'admin' && (
                            <Crown className="h-4 w-4 text-yellow-500" title="Group Admin" />
                          )}
                        </div>
                        
                        {editingGroup.createdBy?.toString() !== participant.user._id && (
                          <button
                            onClick={() => removeMemberFromGroup(editingGroup._id, participant.user._id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove member"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowGroupManagement(false);
                    setEditingGroup(null);
                    setGroupForm({ name: '', description: '', participants: [] });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={updateGroup}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;