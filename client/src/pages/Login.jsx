import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'

const Login = () => {
  const { axios, setToken } = useAppContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const next = params.get('next') || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post('/api/user/login', { email, password })
      if (data.success) {
        setToken(data.token)
        toast.success('Logged in')
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
          <h1 className='text-2xl font-bold'>QuickBlog</h1>
          <p className='text-sm text-gray-500'>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-sm mb-1'>Email</label>
            <input className='w-full p-3 border rounded focus:outline-none focus:ring' type='email' value={email} onChange={e=>setEmail(e.target.value)} required placeholder='you@example.com' />
          </div>
          <div className='mb-4'>
            <label className='block text-sm mb-1'>Password</label>
            <input className='w-full p-3 border rounded focus:outline-none focus:ring' type='password' value={password} onChange={e=>setPassword(e.target.value)} required placeholder='••••••••' />
          </div>
          <div className='flex gap-2'>
            <button className='flex-1 px-4 py-2 bg-primary text-white rounded' type='submit'>Login</button>
            <button type='button' onClick={()=>navigate(`/register?next=${encodeURIComponent(next)}`)} className='flex-1 px-4 py-2 border rounded'>Register</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
