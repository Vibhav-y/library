import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Edit3, Trash2, Smile, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';

const PremiumMessageCmp = ({ 
  message, 
  isOwnMessage, 
  onDelete, 
  onEdit,
  showReactions = true,
  showActions = true,
  onReply
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const editInputRef = useRef(null);

  const canEdit = message.sender._id === user.id || user.role === 'admin' || user.role === 'superadmin';
  const canDelete = message.sender._id === user.id || user.role === 'admin' || user.role === 'superadmin';
  const isEdited = message.isEdited;
  const isOldMessage = new Date(message.createdAt) < new Date(Date.now() - 4 * 60 * 60 * 1000);
  const isTempMessage = message.isTemp;

  const quickEmojis = ['👍', '❤️', '😊', '🎉', '👏', '🔥', '💯', '😎'];

  // Render text content with clickable links
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const parts = [];
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|mailto:[^\s]+)/gi;
    let lastIndex = 0;
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      const [url] = match;
      const start = match.index;
      if (start > lastIndex) {
        parts.push(text.slice(lastIndex, start));
      }
      const href = url.startsWith('http') || url.startsWith('mailto:') ? url : `https://${url}`;
      parts.push(
        <a key={`${start}-${url}`} href={href} target="_blank" rel="noreferrer" className={`${isOwnMessage ? 'underline decoration-white/60 hover:decoration-white' : 'text-indigo-600 underline hover:text-indigo-700'}`}>
          {url}
        </a>
      );
      lastIndex = start + url.length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    // Replace newlines with <br/>
    return parts.flatMap((chunk, i) =>
      typeof chunk === 'string'
        ? chunk.split('\n').flatMap((line, j) => (j === 0 ? [line] : [<br key={`br-${i}-${j}`} />, line]))
        : [chunk]
    );
  };

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

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
    } catch {
      alert('Failed to edit message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (emoji) => {
    try {
      await chatAPI.addReaction(message._id, emoji);
      setShowReactionPicker(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      try {
        await chatAPI.deleteMessage(message._id);
        onDelete && onDelete(message._id);
      } catch {
        alert('Failed to delete');
      }
    }
  };

  const handleDownload = () => {
    const url = message?.attachment?.url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = message?.attachment?.originalName || 'download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (isTempMessage) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl border shadow-sm ${
          isOwnMessage ? 'bg-indigo-50 border-indigo-100 text-indigo-900' : 'bg-gray-50 border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-80">{message.content}</span>
            <span className="text-xs text-gray-500">Sending…</span>
          </div>
        </div>
      </div>
    );
  }

  const ts = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderAttachment = () => {
    if (!message.attachment || !message.attachment.url) return null;
    const name = message.attachment.originalName || 'file';
    if (message.type === 'image') {
      return (
        <div className="mt-2 overflow-hidden rounded-xl border border-indigo-200 bg-white">
          <img
            loading="lazy"
            src={message.attachment.url}
            alt={name}
            className="max-h-80 object-cover w-full transition-transform duration-300 hover:scale-[1.01] cursor-zoom-in"
            onClick={() => { setShowImage(true); setZoom(1); setOffset({x:0,y:0}); }}
          />
        </div>
      );
    }
    // Document (e.g., PDF) preview + download button
    return (
      <div className="mt-2">
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
          <iframe
            src={message.attachment.url}
            title={name}
            className="w-full h-52"
          />
        </div>
        <button onClick={handleDownload} className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
          <Download size={16} />
          <span className="truncate max-w-[220px]">Download {name}</span>
        </button>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className="max-w-xs lg:max-w-md w-full">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 shadow-sm">
            <textarea
              ref={editInputRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows="2"
              placeholder="Edit your message…"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm text-gray-600">Cancel</button>
              <button onClick={handleEdit} disabled={isSubmitting || !editContent.trim()} className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white disabled:opacity-50">{isSubmitting ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 transition-all`}>
      <div className="max-w-xs lg:max-w-md">
        <div className={`text-xs mb-1 ${isOwnMessage ? 'text-right text-gray-400' : 'text-gray-400'}`}>{ts}{isEdited && <span className="ml-1 text-indigo-500">(edited)</span>}</div>
        {/* Gradient, ultra-slim border wrapper */}
        <div className={`group relative p-[1px] rounded-2xl transition-all duration-300 shadow-sm ${
          isOwnMessage
            ? 'bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500'
            : 'bg-gradient-to-br from-slate-200 to-slate-100'
        }`}>
          {/* Bubble content */}
          <div className={`rounded-2xl p-4 ${
            isOwnMessage ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white' : 'bg-white text-gray-900'
          }`}>
            {message.type === 'text' && (
              <div className="text-sm leading-relaxed break-words">{renderTextWithLinks(message.content)}</div>
            )}
            {renderAttachment()}
            {message.replyTo && (
              <div className={`mt-3 rounded-xl p-3 ${isOwnMessage ? 'bg-white/15' : 'bg-gray-100'}`}>
                <p className={`text-xs ${isOwnMessage ? 'opacity-90' : 'opacity-80'}`}>Replying to {message.replyTo.sender.name}: {message.replyTo.content}</p>
              </div>
            )}
            {showActions && (
              <div className={`absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto`}>
                <button onClick={() => onReply && onReply(message)} title="Reply" className={`h-8 w-8 rounded-full shadow-sm border backdrop-blur ${isOwnMessage ? 'bg-white/20 border-white/30 text-white hover:bg-white/25' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} transition-colors`}>
                  <MessageCircle size={14} className="mx-auto" />
                </button>
                {canEdit && !isOldMessage && message.type === 'text' && (
                  <button onClick={() => setIsEditing(true)} title="Edit" className={`h-8 w-8 rounded-full shadow-sm border backdrop-blur ${isOwnMessage ? 'bg-white/20 border-white/30 text-white hover:bg-white/25' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} transition-colors`}>
                    <Edit3 size={14} className="mx-auto" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={handleDelete} title="Delete" className={`h-8 w-8 rounded-full shadow-sm border backdrop-blur ${isOwnMessage ? 'bg-white/20 border-white/30 text-white hover:bg-white/25' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'} transition-colors`}>
                    <Trash2 size={14} className="mx-auto" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Image modal */}
        {showImage && message.type === 'image' && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setShowImage(false)}
          >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2" onClick={(e)=>e.stopPropagation()}>
              <button
                className="px-3 py-2 rounded-lg bg-white/90 text-gray-800 hover:bg-white"
                onClick={() => setZoom((z)=>Math.max(1, +(z-0.2).toFixed(2)))}
              >-
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-white/90 text-gray-800 hover:bg-white"
                onClick={() => setZoom((z)=>Math.min(5, +(z+0.2).toFixed(2)))}
              >+
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-white/90 text-gray-800 hover:bg-white"
                onClick={() => { setZoom(1); setOffset({x:0,y:0}); }}
              >Reset
              </button>
            </div>
            <div
              className="max-h-[90vh] max-w-[90vw] overflow-hidden cursor-grab active:cursor-grabbing"
              onClick={(e)=>e.stopPropagation()}
              onWheel={(e)=>{ e.preventDefault(); const delta = e.deltaY>0 ? -0.2: 0.2; setZoom(z=>Math.min(5, Math.max(1, +(z+delta).toFixed(2)))); }}
              onMouseDown={(e)=>{ setPanning(true); panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; }}
              onMouseMove={(e)=>{ if(panning){ setOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }); } }}
              onMouseUp={()=> setPanning(false)}
              onMouseLeave={()=> setPanning(false)}
              onTouchStart={(e)=>{ if(e.touches.length===1){ const t=e.touches[0]; setPanning(true); panStart.current={ x: t.clientX - offset.x, y: t.clientY - offset.y }; } }}
              onTouchMove={(e)=>{ if(panning && e.touches.length===1){ const t=e.touches[0]; setOffset({ x: t.clientX - panStart.current.x, y: t.clientY - panStart.current.y }); } }}
              onTouchEnd={()=> setPanning(false)}
            >
              <img
                src={message.attachment.url}
                alt={message.attachment.originalName || 'image'}
                draggable="false"
                style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`, transition: panning ? 'none' : 'transform 120ms ease-out' }}
                className="select-none rounded-xl shadow-2xl block"
              />
            </div>
          </div>
        )}

        {showReactions && reactions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(
              reactions.reduce((acc, r) => (acc[r.emoji] = (acc[r.emoji] || 0) + 1, acc), {})
            ).map(([emoji, count]) => (
              <button key={emoji} onClick={() => handleReaction(emoji)} className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors">
                {emoji} {count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  const a = prevProps.message;
  const b = nextProps.message;
  return (
    a._id === b._id &&
    a.content === b.content &&
    a.isEdited === b.isEdited &&
    a.editedAt === b.editedAt &&
    (a.reactions?.length || 0) === (b.reactions?.length || 0)
  );
};

const PremiumMessage = React.memo(PremiumMessageCmp, areEqual);

export default PremiumMessage;
