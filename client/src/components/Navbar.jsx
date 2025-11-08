/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import React from 'react'
import {assets} from '../assets/assets'
import {useNavigate, useLocation} from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const {navigate, token, user, logout} = useAppContext()
  const location = useLocation()

  return (
    <div className='flex justify-between items-center py-5 px-8 sm:mx-20 xl:mx-32 cursor-pointer'>
        <img onClick={()=>navigate('/')} src={assets.logo} alt="logo" className='w32 sm:w-44 '/>
        <div className='flex items-center gap-3'>
          {!token && (
            <button onClick={()=>navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)} className='flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary text-white px-10 py-2.5'>
              Login
              <img src={assets.arrow} className='w-3' alt="arrow" />
            </button>
          )}

          {token && user && user.role === 'admin' && (
            <button onClick={()=>navigate('/admin')} className='flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary text-white px-10 py-2.5'>
              Dashboard
              <img src={assets.arrow} className='w-3' alt="arrow" />
            </button>
          )}

          {token && user && user.role !== 'admin' && (
            <>
              <button onClick={()=>navigate('/add')} className='px-4 py-2 rounded-full text-sm border'>Write a blog</button>
              <button onClick={()=>{logout(); navigate('/')}} className='px-4 py-2 rounded-full text-sm border'>Logout</button>
            </>
          )}
        </div>
    </div>
  )
}

export default Navbar
