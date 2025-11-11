/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../../assets/assets'

const Sidebar = () => {
  return (
    <div className='flex flex-col border-r border-gray-200 min-h-full pt-6 bg-gradient-to-b from-gray-50 to-white'>

      <NavLink className={ ({isActive}) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer transition-all ${isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-r-4 border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50 text-gray-600"}`} end={true} to='/admin'>
        <img className='min-w-4 w-5' src={assets.home_icon} alt="" />
        <p className='hidden md:inline-block'>Dashboard</p>
      </NavLink>
      
      <NavLink className={ ({isActive}) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer transition-all ${isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-r-4 border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50 text-gray-600"}`} to='/admin/addBlog'>
        <img className='min-w-4 w-5' src={assets.add_icon} alt="" />
        <p className='hidden md:inline-block'>Add blogs</p>
      </NavLink>
      
      <NavLink className={ ({isActive}) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer transition-all ${isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-r-4 border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50 text-gray-600"}`} to='/admin/listBlog'>
        <img className='min-w-4 w-5' src={assets.list_icon} alt="" />
        <p className='hidden md:inline-block'>Blog lists</p>
      </NavLink>
      
      <NavLink className={ ({isActive}) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer transition-all ${isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-r-4 border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50 text-gray-600"}`} to='/admin/comments'>
        <img className='min-w-4 w-5' src={assets.comment_icon} alt="" />
        <p className='hidden md:inline-block'>Comments</p>
      </NavLink>
      
      <NavLink className={ ({isActive}) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer transition-all ${isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-r-4 border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50 text-gray-600"}`} to='/admin/chats'>
        <img className='min-w-4 w-5' src={assets.comment_icon} alt="" />
        <p className='hidden md:inline-block'>Assistant chats</p>
      </NavLink>
      
    </div>
  )
}

export default Sidebar
