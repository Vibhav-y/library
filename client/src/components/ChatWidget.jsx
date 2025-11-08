import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useAnalytics } from '../hooks/useAnalytics'

const ChatWidget = ({ blogId, blogTitle }) => {
  const { axios } = useAppContext()
  const { trackEvent } = useAnalytics()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef()

  useEffect(() => {
    if (open) {
      // focus input when opened
      const el = document.getElementById('chat-input')
      if (el) el.focus()
      // Track chat opened event
      trackEvent('chat_opened', {
        blog_id: blogId,
        blog_title: blogTitle
      })
    }
  }, [open, blogId, blogTitle, trackEvent])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [...prev, { from: 'user', text }])
    setInput('')
    setLoading(true)
    // Track message sent event
    trackEvent('chat_message_sent', {
      blog_id: blogId,
      blog_title: blogTitle
    })
    try {
      const { data } = await axios.post('/api/blog/chat', { blogId, message: text })
      if (data.success && data.reply) {
        setMessages(prev => [...prev, { from: 'assistant', text: data.reply }])
      } else if (data.reply) {
        setMessages(prev => [...prev, { from: 'assistant', text: data.reply }])
      } else {
        setMessages(prev => [...prev, { from: 'assistant', text: data.message || 'No response' }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { from: 'assistant', text: err.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button with smooth hover effect */}
      <button 
        onClick={() => setOpen(o => !o)} 
        className='fixed z-50 right-6 bottom-6 bg-primary hover:bg-primary/90 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transform transition-all duration-200 hover:scale-110 hover:shadow-xl'
      >
        <span className='text-xl'>{open ? '✕' : '💬'}</span>
      </button>

      {/* Chat modal with smooth transition */}
      {open && (
        <div className='fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4'>
          <div 
            className='absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300' 
            onClick={() => setOpen(false)}
          ></div>
          <div className='relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl mx-auto mb-0 sm:mb-0 overflow-hidden transform transition-all duration-300 ease-out'>
            {/* Header */}
            <div className='px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Assistant — {blogTitle || 'Blog'}
                  </h3>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Ask questions about this article
                  </p>
                </div>
                <button 
                  onClick={() => setOpen(false)} 
                  className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors'
                >
                  <span className='sr-only'>Close</span>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages area with subtle scrollbar */}
            <div 
              ref={scrollRef} 
              className='h-[400px] overflow-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600'
            >
              {messages.length === 0 && (
                <div className='flex items-center space-x-3 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
                  <span className='text-xl'>👋</span>
                  <p className='text-sm'>
                    Hi — ask me about this blog and I'll answer using the article content.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'assistant' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                  <div 
                    className={`
                      ${m.from === 'assistant' 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-br-lg' 
                        : 'bg-primary text-white rounded-bl-lg'
                      } 
                      max-w-[80%] p-4 rounded-t-lg shadow-sm
                    `}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area with modern styling */}
            <div className='p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700'>
              <div className='flex items-center gap-3'>
                <input 
                  id='chat-input'
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
                  className='flex-1 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow'
                  placeholder='Type your question...'
                />
                <button 
                  onClick={send}
                  disabled={loading}
                  className='bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
                >
                  {loading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Send</span>
                      <svg className='w-4 h-4' viewBox='0 0 20 20' fill='currentColor'>
                        <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z' />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 3px;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #4B5563;
        }
      `}</style>
    </>
  )
}

export default ChatWidget
