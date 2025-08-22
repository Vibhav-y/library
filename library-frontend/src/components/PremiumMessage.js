import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Edit3, Trash2, MoreVertical, Smile } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';

const PremiumMessage = ({ 
  message, 
  isOwnMessage, 
  onDelete, 
  onEdit,
  showReactions = true,
  showActions = true 
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editInputRef = useRef(null);

  const canEdit = message.sender._id === user.id || user.role === 'admin' || user.role === 'superadmin';
  const canDelete = message.sender._id === user.id || user.role === 'admin' || user.role === 'superadmin';
  const isEdited = message.isEdited;
  const isOldMessage = new Date(message.createdAt) < new Date(Date.now() - 5 * 60 * 1000);
  const isTempMessage = message.isTemp;

  // Common emojis for quick reactions
  const quickEmojis = ['👍', '❤️', '😊', '🎉', '👏', '🔥', '💯', '😎'];

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Update edit content when message content changes
  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  // Update reactions when message reactions change
  useEffect(() => {
    setReactions(message.reactions || []);
  }, [message.reactions]);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await chatAPI.editMessage(message._id, editContent);
      onEdit && onEdit(message._id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (emoji) => {
    try {
      await chatAPI.addReaction(message._id, emoji);
      setShowReactionPicker(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await chatAPI.deleteMessage(message._id);
        onDelete && onDelete(message._id);
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
      }
    }
  };

  // Don't show actions for temp messages
  if (isTempMessage) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-blue-100 text-blue-900 border border-blue-200' 
            : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="text-sm opacity-75">{message.content}</div>
            <div className="text-xs text-gray-500">Sending...</div>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getReactionCount = (emoji) => {
    return reactions.filter(r => r.emoji === emoji).length;
  };

  const hasUserReacted = (emoji) => {
    return reactions.some(r => r.emoji === emoji && r.user._id === user.id);
  };

  if (isEditing) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
            <textarea
              ref={editInputRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-orange-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows="2"
              placeholder="Edit your message..."
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isSubmitting || !editContent.trim()}
                className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className="max-w-xs lg:max-w-md">
        {/* Message Header */}
        <div className={`flex items-center mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          {!isOwnMessage && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {message.sender.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {message.sender.name}
              </span>
              {message.sender.role !== 'student' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {message.sender.role}
                </span>
              )}
            </div>
          )}
          <span className="text-xs text-gray-500 ml-2">
            {formatTime(message.createdAt)}
            {isEdited && <span className="ml-1 text-orange-500">(edited)</span>}
          </span>
        </div>

        {/* Message Content */}
        <div className={`relative ${isOwnMessage ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-800'} rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
          
          {/* Reply Preview */}
          {message.replyTo && (
            <div className={`mt-3 p-3 rounded-xl ${isOwnMessage ? 'bg-orange-400 bg-opacity-30' : 'bg-gray-100'}`}>
              <p className="text-xs opacity-75">
                Replying to {message.replyTo.sender.name}: {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Message Actions */}
          {showActions && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-1">
                {canEdit && !isOldMessage && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 transition-colors"
                    title="Edit message"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-xl hover:bg-white hover:bg-opacity-20 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reactions */}
        {showReactions && reactions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(
              reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`px-3 py-2 rounded-full text-sm transition-all duration-200 ${
                  hasUserReacted(emoji)
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        {/* Reaction Picker */}
        {showReactionPicker && (
          <div className="absolute bottom-full left-0 mb-3 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 z-10">
            <div className="grid grid-cols-4 gap-2">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Smile size={16} />
            <span>React</span>
          </button>
          
          <button className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <MessageCircle size={16} />
            <span>Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumMessage;
