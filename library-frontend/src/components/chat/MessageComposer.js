import React from 'react';

const MessageComposer = ({ value, onChange, onSend, onKeyPress, isSending, disabled = false, disabledReason }) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex space-x-3">
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyPress={onKeyPress}
            placeholder="Type your message..."
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${disabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:ring-blue-500'}`}
          />
        </div>
        <button
          onClick={onSend}
          disabled={disabled || !value.trim() || isSending}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
      {disabled && disabledReason && (
        <p className="text-xs text-gray-500 mt-2">{disabledReason}</p>
      )}
    </div>
  );
};

export default MessageComposer;


