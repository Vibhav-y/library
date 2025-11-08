import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const Chats = () => {
  const { axios } = useAppContext()
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)

  const fetchChats = async () => {
    try {
      const { data } = await axios.get('/api/admin/chats')
      if (data.success) setChats(data.chats || [])
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
  }

  useEffect(() => { fetchChats() }, [])

  const deleteChat = async (id) => {
    if (!confirm('Delete this chat?')) return
    try {
      const { data } = await axios.post('/api/admin/delete-chat', { id })
      if (data.success) { toast.success(data.message); fetchChats() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className='flex-1 pt-5 px-5 sm:pt-12 sm:pl-16 bg-blue-50/50'>
      <div className='max-w-3xl'>
        <h1>Assistant Chats</h1>
        <div className='mt-4 bg-white p-4 rounded shadow'>
          {chats.length === 0 && <div className='text-gray-500'>No chats yet</div>}
          {chats.map(chat => (
            <div key={chat._id} className='border-b py-3 flex items-start justify-between gap-4'>
              <div>
                <div className='font-medium'>{(chat.blog && chat.blog.title) || 'Unknown blog'}</div>
                <div className='text-sm text-gray-500'>Started: {new Date(chat.createdAt).toLocaleString()}</div>
                <div className='text-xs text-gray-600 mt-2'>{chat.messages && chat.messages.length} messages</div>
              </div>
              <div className='flex items-center gap-2'>
                <button onClick={() => setSelectedChat(chat)} className='px-3 py-1 border rounded text-sm'>View</button>
                <button onClick={() => deleteChat(chat._id)} className='px-3 py-1 border rounded text-sm text-red-600'>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedChat && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setSelectedChat(null)}></div>
          <div className='bg-white p-6 rounded shadow-lg z-10 max-w-2xl w-full mx-4 overflow-auto' style={{maxHeight: '80vh'}}>
            <h3 className='font-semibold mb-2'>Chat transcript</h3>
            <div className='text-sm text-gray-600 mb-4'>Blog: {(selectedChat.blog && selectedChat.blog.title) || 'Unknown'}</div>
            <div className='space-y-3'>
              {selectedChat.messages.map((m, i) => (
                <div key={i} className={`p-2 rounded ${m.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-50'}`}>
                  <div className='text-xs text-gray-500'>{m.role}</div>
                  <div className='mt-1'>{m.text}</div>
                </div>
              ))}
            </div>
            <div className='mt-4 text-right'>
              <button onClick={() => setSelectedChat(null)} className='px-3 py-1 border rounded'>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chats
