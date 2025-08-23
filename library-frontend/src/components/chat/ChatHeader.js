import React from 'react';

const ChatHeader = ({ conversation, currentUser }) => {
  if (!conversation) return null;

  const isGroup = conversation.type === 'group';
  const title = isGroup
    ? conversation.name
    : conversation.participants.find(p => p.user._id !== currentUser.id)?.user.name;
  const avatar = isGroup
    ? conversation.name?.charAt(0).toUpperCase()
    : conversation.participants.find(p => p.user._id !== currentUser.id)?.user.name?.charAt(0).toUpperCase();

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-semibold flex items-center justify-center shadow-sm">
            {avatar}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {conversation.participants.length} {isGroup ? 'members' : 'participant'}
              </span>
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;


