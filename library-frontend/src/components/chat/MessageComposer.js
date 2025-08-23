import React from 'react';
import { Paperclip } from 'lucide-react';

const MessageComposer = ({ value, onChange, onSend, onKeyPress, isSending, disabled = false, disabledReason, onAttach, onCancelReply, replyToMessage }) => {
  return (
    <div className="bg-white border-t border-gray-200 p-3">
      {replyToMessage && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
          <div className="text-xs text-blue-800 truncate">Replying to {replyToMessage.sender?.name || 'message'}: {replyToMessage.content?.slice(0, 120)}</div>
          <button onClick={onCancelReply} className="ml-3 text-xs text-blue-600 hover:underline">Cancel</button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={() => document.getElementById('chat-file-input')?.click()}
          disabled={disabled}
          title="Attach"
          aria-label="Attach"
        >
          <Paperclip size={18} />
        </button>
        <input id="chat-file-input" type="file" className="hidden" onChange={onAttach} />
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyPress={onKeyPress}
            placeholder="Type your message…"
            disabled={disabled}
            className={`w-full h-10 px-4 rounded-xl border focus:outline-none focus:ring-2 ${disabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:ring-blue-500'}`}
          />
        </div>
        <button
          onClick={onSend}
          disabled={disabled || (!value.trim() && !isSending)}
          className="h-10 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {disabled && disabledReason && (
        <p className="text-xs text-gray-500 mt-2">{disabledReason}</p>
      )}
    </div>
  );
};

export default MessageComposer;


