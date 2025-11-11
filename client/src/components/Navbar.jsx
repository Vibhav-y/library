import React from 'react'
import {assets} from '../assets/assets'
import {useNavigate, useLocation} from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const {navigate, token, user, logout} = useAppContext()
  const location = useLocation()

  return (
    <div className='flex justify-between items-center py-6 px-8 sm:px-12 xl:px-20 app-container slide-in-right'>
        <img onClick={()=>navigate('/')} src={assets.logo} alt="logo" className='w-32 sm:w-44 cursor-pointer transition-transform hover:scale-105'/>
        <div className='flex items-center gap-4'>
          {/* Terms link removed as requested */}
          {!token && (
            <button onClick={()=>navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)} className='btn-modern btn-gradient'>
              Login
              <img src={assets.arrow} className='w-3' alt="arrow" />
            </button>
          )}

          {token && user && user.role === 'admin' && (
            <button onClick={()=>navigate('/admin')} className='btn-modern btn-gradient'>
              Dashboard
              <img src={assets.arrow} className='w-3' alt="arrow" />
            </button>
          )}

          {token && user && user.role !== 'admin' && (
            <>
              <button onClick={()=>navigate('/profile')} className='btn-modern btn-outline'>Profile</button>
              <button onClick={()=>navigate('/add')} className='btn-modern btn-outline'>Write a blog</button>
              <button onClick={()=>{logout(); navigate('/')}} className='btn-modern btn-outline'>Logout</button>
            </>
          )}
        </div>
    </div>
  )
}

export default Navbar
