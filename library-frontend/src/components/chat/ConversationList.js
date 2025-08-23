import React from 'react';

const ConversationList = ({ conversations, activeId, onSelect, currentUserId, searchTerm, headerAddon }) => {
  const filtered = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => p.user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
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
        const unread = conversation.unreadCount > 0;

        return (
          <div
            key={conversation._id}
            onClick={() => onSelect(conversation)}
            className={`group cursor-pointer rounded-2xl p-[1px] transition-all ${
              isActive ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-slate-200 to-slate-100'
            }`}
          >
            <div className={`rounded-2xl px-3 py-3 flex items-center gap-3 ${
              isActive ? 'bg-white shadow-md' : 'bg-white hover:shadow-md hover:scale-[1.01]'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-sm ${
                isActive ? 'bg-gradient-to-br from-indigo-600 to-indigo-500' : 'bg-indigo-500'
              }`}>
                {avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate flex items-center gap-2">
                  {title}
                  {unread && <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>}
                </h3>
                {conversation.lastMessage && (
                  <p className="text-xs text-gray-500 truncate">{conversation.lastMessage.content}</p>
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


