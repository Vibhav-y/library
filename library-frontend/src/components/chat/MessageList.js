import React from 'react';
import PremiumMessage from '../PremiumMessage';

const MessageList = ({ messages, currentUserId, onDelete, onEdit, typingIndicator }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" id="message-list">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <svg className="mx-auto mb-4 opacity-50" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/></svg>
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <>
          {messages.map(message => (
            <PremiumMessage
              key={message._id}
              message={message}
              isOwnMessage={message.sender._id === currentUserId}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
          {typingIndicator}
        </>
      )}
    </div>
  );
};

export default MessageList;


