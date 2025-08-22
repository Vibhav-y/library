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
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {avatar}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{conversation.participants.length} members</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;


