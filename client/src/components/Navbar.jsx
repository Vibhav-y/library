import React, { useState, useRef, useEffect } from 'react'
import {assets} from '../assets/assets'
import {useNavigate, useLocation} from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const {navigate, token, user, logout} = useAppContext()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'>
      <div className='flex justify-between items-center py-4 px-6 sm:px-12 xl:px-20 app-container'>
        <img 
          onClick={()=>navigate('/')} 
          src={assets.logo} 
          alt="logo" 
          className='w-32 sm:w-44 cursor-pointer transition-transform hover:scale-105'
        />
        
        <div className='flex items-center gap-3'>
          {!token && (
            <button 
              onClick={()=>navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)} 
              className='btn-modern btn-gradient'
            >
              Login
              <img src={assets.arrow} className='w-3' alt="arrow" />
            </button>
          )}

          {token && user && user.role === 'admin' && (
            <button 
              onClick={()=>navigate('/admin')} 
              className='btn-modern btn-gradient'
            >
              Dashboard
              <img src={assets.arrow} className='w-3' alt="arrow" />
            </button>
          )}

          {token && user && user.role !== 'admin' && (
            <>
              <button 
                onClick={()=>navigate('/add')} 
                className='btn-modern btn-gradient'
              >
                <span className='hidden sm:inline'>Write a blog</span>
                <span className='sm:hidden'>Write</span>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                </svg>
              </button>

              {/* Hamburger Menu Button */}
              <div className='relative' ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className='p-2 rounded-lg border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 transition-all duration-200'
                  aria-label='User menu'
                >
                  <div className='w-6 h-6 flex flex-col justify-center items-center gap-1'>
                    <span className={`w-5 h-0.5 bg-indigo-700 rounded-full transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                    <span className={`w-5 h-0.5 bg-indigo-700 rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`w-5 h-0.5 bg-indigo-700 rounded-full transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className='absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-menu-drop'>
                    {/* User Info Header */}
                    <div className='px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-white/20 flex items-center justify-center'>
                          <img src={assets.user_icon} className='w-8 h-8' alt='user' />
                        </div>
                        <div>
                          <p className='font-semibold text-sm'>{user.name}</p>
                          <p className='text-xs text-indigo-100'>{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className='py-2'>
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          navigate('/profile')
                        }}
                        className='w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center gap-3 group'
                      >
                        <svg className='w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                        <span className='font-medium text-gray-700'>My Profile</span>
                      </button>

                      <div className='my-2 border-t border-gray-100'></div>

                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          logout()
                          navigate('/')
                        }}
                        className='w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 group'
                      >
                        <svg className='w-5 h-5 text-red-600 group-hover:scale-110 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                        </svg>
                        <span className='font-medium text-red-600'>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar
