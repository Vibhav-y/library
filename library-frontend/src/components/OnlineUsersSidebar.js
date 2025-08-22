import React, { useState } from 'react';
import { Users, Circle, Clock, MessageCircle } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const OnlineUsersSidebar = ({ onUserSelect, selectedUserId }) => {
  const { onlineUsers, isConnected } = useChat();
  const { user: currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Unknown';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const filteredUsers = onlineUsers.filter(user => user.userId !== currentUser.id);

  return (
    <div className={`bg-white border-l border-gray-200 transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users size={20} className="text-blue-600" />
            {isExpanded && (
              <span className="font-semibold text-gray-800">Online Users</span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className={`w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin ${
              isExpanded ? 'rotate-180' : ''
            }`}></div>
          </button>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {isExpanded && (
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center">
            {isExpanded ? (
              <div className="text-gray-500">
                <Users size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users online</p>
              </div>
            ) : (
              <Users size={20} className="mx-auto text-gray-400" />
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredUsers.map((user) => (
              <div
                key={user.userId}
                onClick={() => onUserSelect && onUserSelect(user)}
                className={`group cursor-pointer p-3 rounded-lg transition-all duration-200 ${
                  selectedUserId === user.userId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Status Indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(user.status)} rounded-full border-2 border-white`}></div>
                  </div>

                  {isExpanded && (
                    <div className="flex-1 min-w-0">
                      {/* User Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 truncate">
                            {user.name}
                          </span>
                          {user.role !== 'student' && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {user.role}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status and Last Seen */}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {getStatusText(user.status)}
                        </span>
                        {user.status === 'offline' && user.lastSeen && (
                          <>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center space-x-1">
                              <Clock size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatLastSeen(user.lastSeen)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {isExpanded && (
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full hover:bg-blue-100 text-blue-600">
                      <MessageCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} online
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersSidebar;
