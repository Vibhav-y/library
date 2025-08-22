import React from 'react';
import { useChat } from '../contexts/ChatContext';

const TypingIndicator = ({ conversationId }) => {
  const { getTypingUsers } = useChat();
  const typingUsers = getTypingUsers(conversationId);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-2xl border border-orange-200 mb-3">
      {/* Typing Animation */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      
      {/* Typing Users */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-orange-700">
          {typingUsers.length === 1 ? (
            <span>
              <span className="font-medium text-orange-800">{typingUsers[0].userName}</span> is typing...
            </span>
          ) : (
            <span>
              <span className="font-medium text-orange-800">
                {typingUsers.map(u => u.userName).join(', ')}
              </span> are typing...
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;
