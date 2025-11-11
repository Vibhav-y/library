import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useAnalytics } from '../hooks/useAnalytics'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const ChatWidget = ({ blogId, blogTitle }) => {
  const { axios } = useAppContext()
  const { trackEvent } = useAnalytics()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef()

  // We'll use react-markdown + remark-gfm for rich markdown rendering.
  // react-markdown is safe by default (it doesn't render raw HTML unless allowed).

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
        <div className='fixed right-6 bottom-20 z-40 sm:right-8 sm:bottom-24 flex items-end'>
          <div 
            className='fixed inset-0 bg-gray-900/20 transition-opacity duration-300' 
            onClick={() => setOpen(false)}
          ></div>
          <div className='relative w-[520px] max-w-full sm:w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-350 ease-out animate-chat-pop border border-gray-100'>
            {/* Header */}
            <div className='px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold text-white'>
                    Blog Assistant
                  </h3>
                  <p className='text-sm text-indigo-100'>
                    Ask questions about "{blogTitle || 'this article'}"
                  </p>
                </div>
                <button 
                  onClick={() => setOpen(false)} 
                  className='text-white hover:text-indigo-100 transition-colors'
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
              className='h-[480px] overflow-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-indigo-50/30 scrollbar-thin scrollbar-thumb-gray-300'
            >
              {messages.length === 0 && (
                <div className='flex items-center space-x-3 text-gray-600 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm'>
                  <span className='text-xl'>👋</span>
                  <p className='text-sm'>
                    Hi — ask me about this blog and I'll answer using the article content.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'assistant' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                  <div className={`flex ${m.from === 'assistant' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                    <div
                      className={`
                        ${m.from === 'assistant'
                          ? 'bg-white text-gray-900 rounded-br-2xl border border-indigo-100 shadow-sm'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-bl-2xl shadow-lg'
                        }
                        max-w-[85%] p-4 rounded-t-lg font-medium overflow-hidden
                      `}
                    >
                      {m.from === 'assistant' ? (
                        <div className='prose max-w-none text-sm'>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="underline text-indigo-600 hover:text-indigo-800" />,
                              code: ({node, inline, className, children, ...props}) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-lg text-xs my-2"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                    {children}
                                  </code>
                                )
                              },
                              p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="text-sm" {...props} />
                            }}
                          >
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div>{m.text}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white border border-indigo-100 p-4 rounded-xl shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area with modern styling */}
            <div className='p-4 bg-white border-t border-indigo-100'>
              <div className='flex items-center gap-3'>
                <input 
                  id='chat-input'
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
                  className='flex-1 p-3 border border-indigo-200 rounded-lg bg-indigo-50/30 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-shadow'
                  placeholder='Type your question...'
                />
                <button 
                  onClick={send}
                  disabled={loading}
                  className='bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-5 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md transform hover:-translate-y-0.5'
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
        @keyframes chat-pop {
          0% { opacity: 0; transform: translateY(12px) scale(0.98); }
          60% { opacity: 1; transform: translateY(-6px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-chat-pop {
          animation: chat-pop 260ms cubic-bezier(.2,.9,.3,1) both;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .prose a { text-decoration: underline; }
        .prose pre { background: #0f172a; }
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
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }
      `}</style>
    </>
  )
}

export default ChatWidget
