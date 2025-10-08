import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, libraryAPI } from '../services/api';
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
  X,
  ArrowLeft,
  Building2,
  Clock
} from 'lucide-react';
import { decryptMessagesWithKeyB64 } from '../utils/e2ee';

const ChatMonitoring = () => {
  // State management
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('conversations');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadLibraries();
  }, []);

  useEffect(() => {
    if (selectedLibrary) {
      loadConversations();
      loadFlaggedMessages();
    }
  }, [selectedLibrary]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadLibraries = async () => {
    try {
      setLoading(true);
      const data = await libraryAPI.getAll();
      setLibraries(data);
    } catch (error) {
      console.error('Error loading libraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!selectedLibrary) return;
    try {
      setConversationsLoading(true);
      const data = await chatAPI.admin.getAllConversations(selectedLibrary._id, true);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadMessages = async (conversationId, page = 1) => {
    try {
      setMessagesLoading(true);
      const data = await chatAPI.admin.getConversationMessages(conversationId, page, 50, true);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadFlaggedMessages = async () => {
    if (!selectedLibrary) return;
    try {
      const data = await chatAPI.admin.getFlaggedMessages(selectedLibrary._id, true);
      setFlaggedMessages(data);
    } catch (error) {
      console.error('Error loading flagged messages:', error);
    }
  };

  const goBackToLibraries = () => {
    setSelectedLibrary(null);
    setSelectedConversation(null);
    setConversations([]);
    setMessages([]);
  };

  const goBackToConversations = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.participants?.some(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      conv.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'group' && conv.type === 'group') ||
      (filterType === 'private' && conv.type === 'private');
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Library Selection View
  if (!selectedLibrary) {
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
                  Select a library to monitor chat conversations and manage flagged content
                </p>
              </div>
            </div>
          </div>

          {/* Libraries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraries.map((library) => (
              <div
                key={library._id}
                onClick={() => setSelectedLibrary(library)}
                className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/30 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{library.name}</h3>
                    <p className="text-sm text-gray-600">{library.handle}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      library.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {library.isActive ? 'Active' : 'Suspended'}
                    </span>
                    {library.features?.chatEnabled && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        Chat Enabled
                      </span>
                    )}
                  </div>
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>

          {libraries.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Libraries Found</h3>
              <p className="text-gray-600">No libraries are available for monitoring.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Conversations View
  if (!selectedConversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="relative bg-white/70 backdrop-blur-md shadow-xl rounded-2xl border border-white/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
              <div className="relative px-6 py-8">
                <div className="flex items-center">
                  <button
                    onClick={goBackToLibraries}
                    className="mr-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-6 w-6 text-white" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center">
                      <MessageCircle className="h-8 w-8 mr-3" />
                      {selectedLibrary.name} - Chat Monitoring
                    </h1>
                    <p className="text-blue-100 mt-2">
                      Monitor conversations in {selectedLibrary.name} ({selectedLibrary.handle})
                    </p>
                  </div>
                </div>
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
                Conversations ({conversations.length})
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
                Flagged ({flaggedMessages.length})
              </button>
            </div>
          </div>

          {activeTab === 'conversations' && (
            <div>
              {/* Search and Filter */}
              <div className="mb-6 bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="group">Group Chats</option>
                    <option value="private">Private Chats</option>
                  </select>
                  <button
                    onClick={loadConversations}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Conversations List */}
              {conversationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadMessages(conversation._id);
                      }}
                      className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            conversation.type === 'group' 
                              ? 'bg-purple-100 text-purple-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {conversation.type === 'group' ? (
                              <Users className="h-5 w-5" />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {conversation.name || 
                               conversation.participants?.map(p => p.name).join(', ') || 
                               'Unnamed Conversation'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {conversation.type === 'group' ? 'Group Chat' : 'Private Chat'} • 
                              {conversation.participants?.length || 0} participants
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {conversation.lastMessage?.createdAt ? 
                              new Date(conversation.lastMessage.createdAt).toLocaleDateString() : 
                              'No messages'
                            }
                          </p>
                          <p className="text-xs text-gray-400">
                            {conversation.messageCount || 0} messages
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredConversations.length === 0 && !conversationsLoading && (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No Conversations Found</h3>
                  <p className="text-gray-600">
                    {conversations.length === 0 
                      ? 'No conversations available in this library.' 
                      : 'No conversations match your search criteria.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'flagged' && (
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Flagged Messages</h3>
              {flaggedMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No flagged messages in this library.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedMessages.map((message) => (
                    <div key={message._id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-900">{message.sender?.name}</p>
                          <p className="text-red-800 mt-1">{message.content}</p>
                          <p className="text-red-600 text-sm mt-2">
                            Reason: {message.flagReason || 'No reason provided'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-600 text-sm">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Messages View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="relative bg-white/70 backdrop-blur-md shadow-xl rounded-2xl border border-white/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-blue-600/90"></div>
            <div className="relative px-6 py-8">
              <div className="flex items-center">
                <button
                  onClick={goBackToConversations}
                  className="mr-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-6 w-6 text-white" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {selectedConversation.name || 
                     selectedConversation.participants?.map(p => p.name).join(', ') || 
                     'Conversation'}
                  </h1>
                  <p className="text-blue-100 mt-1">
                    {selectedLibrary.name} • {selectedConversation.type === 'group' ? 'Group Chat' : 'Private Chat'} • 
                    {selectedConversation.participants?.length || 0} participants
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages in this conversation.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message._id} className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{message.sender?.name || 'Unknown User'}</span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                    {message.isFlagged && (
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <Flag className="h-3 w-3 mr-1" />
                        Flagged: {message.flagReason || 'No reason provided'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMonitoring;
