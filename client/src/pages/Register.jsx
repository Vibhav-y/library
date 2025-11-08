import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'

const Register = () => {
  const { axios, setToken } = useAppContext()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const next = params.get('next') || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post('/api/user/register', { username, email, password })
      if (data.success) {
        setToken(data.token)
        toast.success('Registered and logged in')
        navigate(next)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md p-8 bg-white rounded-lg shadow'>
        <div className='text-center mb-6'>
          <h1 className='text-2xl font-bold'>Create account</h1>
          <p className='text-sm text-gray-500'>Join QuickBlog to comment and post</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-sm mb-1'>Username</label>
            <input className='w-full p-3 border rounded focus:outline-none focus:ring' value={username} onChange={e=>setUsername(e.target.value)} required placeholder='Your display name' />
          </div>
          <div className='mb-4'>
            <label className='block text-sm mb-1'>Email</label>
            <input className='w-full p-3 border rounded focus:outline-none focus:ring' type='email' value={email} onChange={e=>setEmail(e.target.value)} required placeholder='you@example.com' />
          </div>
          <div className='mb-4'>
            <label className='block text-sm mb-1'>Password</label>
            <input className='w-full p-3 border rounded focus:outline-none focus:ring' type='password' value={password} onChange={e=>setPassword(e.target.value)} required placeholder='Create a password' />
          </div>
          <div className='flex gap-2'>
            <button className='flex-1 px-4 py-2 bg-primary text-white rounded' type='submit'>Register</button>
            <button type='button' onClick={()=>navigate(`/login?next=${encodeURIComponent(next)}`)} className='flex-1 px-4 py-2 border rounded'>Login</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
