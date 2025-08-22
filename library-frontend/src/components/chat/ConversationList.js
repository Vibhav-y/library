import React from 'react';

const ConversationList = ({ conversations, activeId, onSelect, currentUserId, searchTerm, headerAddon }) => {
  const filtered = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => p.user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {headerAddon}
      {filtered.map(conversation => {
        const isActive = activeId === conversation._id;
        const isGroup = conversation.type === 'group';
        const title = isGroup
          ? conversation.name
          : conversation.participants.find(p => p.user._id !== currentUserId)?.user.name;
        const avatar = isGroup
          ? conversation.name?.charAt(0).toUpperCase()
          : conversation.participants.find(p => p.user._id !== currentUserId)?.user.name?.charAt(0).toUpperCase();

        return (
          <div
            key={conversation._id}
            onClick={() => onSelect(conversation)}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
              isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{title}</h3>
                {conversation.lastMessage && (
                  <p className="text-sm text-gray-500 truncate">{conversation.lastMessage.content}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;


