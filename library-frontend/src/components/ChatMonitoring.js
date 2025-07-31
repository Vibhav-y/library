import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { 
  MessageCircle, 
  Users, 
  Search, 
  Eye, 
  Flag, 
  AlertTriangle,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  X
} from 'lucide-react';

const ChatMonitoring = () => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, group, private
  const [activeTab, setActiveTab] = useState('conversations'); // conversations, flagged
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadFlaggedMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.admin.getAllConversations();
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
      const data = await chatAPI.admin.getConversationMessages(conversationId, page);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadFlaggedMessages = async () => {
    try {
      const data = await chatAPI.admin.getFlaggedMessages();
      setFlaggedMessages(data);
    } catch (error) {
      console.error('Error loading flagged messages:', error);
    }
  };

  const handleFlagMessage = async (messageId, shouldFlag, reason = '') => {
    try {
      await chatAPI.admin.flagMessage(messageId, shouldFlag, reason);
      
      // Refresh messages if viewing conversation
      if (selectedConversation) {
        loadMessages(selectedConversation._id);
      }
      
      // Refresh flagged messages
      loadFlaggedMessages();
      
      setShowFlagModal(false);
      setSelectedMessage(null);
      setFlagReason('');
    } catch (error) {
      console.error('Error flagging message:', error);
    }
  };

  const openFlagModal = (message) => {
    setSelectedMessage(message);
    setShowFlagModal(true);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
    }
    
    // Private conversation - show participant names
    const participants = conversation.participants
      .map(p => p.user.name)
      .join(' & ');
    return participants;
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return <Users className="h-8 w-8 text-blue-600" />;
    }
    return <User className="h-8 w-8 text-gray-600" />;
  };

  const exportConversation = () => {
    if (!selectedConversation || !messages.length) return;
    
    const conversationData = {
      conversation: {
        id: selectedConversation._id,
        name: getConversationName(selectedConversation),
        type: selectedConversation.type,
        participants: selectedConversation.participants.map(p => ({
          name: p.user.name,
          email: p.user.email,
          role: p.user.role
        }))
      },
      messages: messages.map(msg => ({
        sender: msg.sender.name,
        content: msg.content,
        timestamp: msg.createdAt,
        flagged: msg.flagged?.isFlagged || false
      })),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(conversationData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${selectedConversation._id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = getConversationName(conv)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || conv.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="relative bg-white/70 backdrop-blur-md shadow-xl rounded-2xl border border-white/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
            <div className="relative px-6 py-8">
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Eye className="h-8 w-8 mr-3" />
                Chat Monitoring
              </h1>
              <p className="text-blue-100 mt-2">
                Monitor all chat conversations and manage flagged content
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-1 inline-flex space-x-1">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'conversations'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              All Conversations
            </button>
            <button
              onClick={() => setActiveTab('flagged')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'flagged'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              <Flag className="h-4 w-4 inline mr-2" />
              Flagged Messages ({flaggedMessages.length})
            </button>
          </div>
        </div>

        {activeTab === 'conversations' ? (
          <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden h-[calc(100vh-12rem)]">
            <div className="flex h-full">
              {/* Sidebar - Conversations List */}
              <div className="w-1/3 border-r border-gray-200/50 flex flex-col">
                {/* Search and Filters */}
                <div className="p-4 border-b border-gray-200/50">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="group">Group Chats</option>
                      <option value="private">Private Chats</option>
                    </select>
                    
                    <button
                      onClick={loadConversations}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.map((conversation, index) => (
                    <div
                      key={conversation._id}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadMessages(conversation._id);
                      }}
                      className={`p-4 border-b border-gray-200/30 cursor-pointer transition-colors hover:bg-gray-50/50 ${
                        selectedConversation?._id === conversation._id ? 'bg-blue-50/50' : ''
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
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              conversation.type === 'group' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {conversation.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {conversation.participants.length} participants
                          </p>
                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              Last: {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Chat View */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-white/90 to-white/70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getConversationAvatar(selectedConversation)}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {getConversationName(selectedConversation)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {selectedConversation.participants.length} participants • {selectedConversation.type} chat
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={exportConversation}
                          className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors"
                          title="Export conversation"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesLoading && (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      )}
                      
                      {messages.map((message, index) => (
                        <div key={message._id} className="group">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {message.sender.profilePicture ? (
                                <img 
                                  src={message.sender.profilePicture} 
                                  alt={message.sender.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-semibold text-gray-900">
                                  {message.sender.name}
                                </p>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  message.sender.role === 'student' 
                                    ? 'bg-green-100 text-green-800'
                                    : message.sender.role === 'admin'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {message.sender.role}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {formatTime(message.createdAt)}
                                </p>
                                {message.flagged?.isFlagged && (
                                  <Flag className="h-4 w-4 text-red-500" title="Flagged message" />
                                )}
                              </div>
                              <div className="mt-1 p-3 bg-gray-50/50 rounded-lg">
                                <p className="text-sm text-gray-900">{message.content}</p>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openFlagModal(message)}
                                className={`p-2 rounded-lg transition-colors ${
                                  message.flagged?.isFlagged
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }`}
                                title={message.flagged?.isFlagged ? 'Unflag message' : 'Flag message'}
                              >
                                <Flag className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Conversation</h3>
                      <p className="text-gray-600">Choose a conversation from the sidebar to monitor messages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Flagged Messages Tab */
          <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-red-500" />
                Flagged Messages ({flaggedMessages.length})
              </h3>
              <button
                onClick={loadFlaggedMessages}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {flaggedMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No flagged messages</p>
                </div>
              ) : (
                flaggedMessages.map((message) => (
                  <div key={message._id} className="bg-red-50/50 border border-red-200/50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {message.sender.name}
                          </p>
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            {message.sender.role}
                          </span>
                          <p className="text-xs text-gray-500">
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-900 mb-3 p-3 bg-white/50 rounded border">
                          {message.content}
                        </p>
                        <div className="text-xs text-red-600">
                          <p><strong>Flagged by:</strong> {message.flagged.flaggedBy?.name}</p>
                          <p><strong>Reason:</strong> {message.flagged.reason || 'No reason provided'}</p>
                          <p><strong>Flagged at:</strong> {formatTime(message.flagged.flaggedAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFlagMessage(message._id, false)}
                        className="ml-4 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Unflag
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Flag Message Modal */}
      {showFlagModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedMessage.flagged?.isFlagged ? 'Unflag Message' : 'Flag Message'}
                </h3>
                <button
                  onClick={() => {
                    setShowFlagModal(false);
                    setSelectedMessage(null);
                    setFlagReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <p className="text-sm text-gray-900">{selectedMessage.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  By {selectedMessage.sender.name} • {formatTime(selectedMessage.createdAt)}
                </p>
              </div>

              {!selectedMessage.flagged?.isFlagged && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for flagging (optional)
                  </label>
                  <textarea
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="Enter reason for flagging this message..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowFlagModal(false);
                    setSelectedMessage(null);
                    setFlagReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFlagMessage(
                    selectedMessage._id, 
                    !selectedMessage.flagged?.isFlagged, 
                    flagReason
                  )}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                    selectedMessage.flagged?.isFlagged
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {selectedMessage.flagged?.isFlagged ? 'Unflag' : 'Flag'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMonitoring;