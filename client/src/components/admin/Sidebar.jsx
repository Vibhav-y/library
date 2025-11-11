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
      
      <NavLink className={ ({isActive}) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer transition-all ${isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-r-4 border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50 text-gray-600"}`} to='/admin/donations'>
        <svg className='min-w-4 w-5' fill='currentColor' viewBox='0 0 20 20'>
          <path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' />
        </svg>
        <p className='hidden md:inline-block'>Donations</p>
      </NavLink>
      
      <NavLink className={ ({isActive}) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-64 cursor-pointer transition-all ${isActive ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-r-4 border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50 text-gray-600"}`} to='/admin/users'>
        <svg className='min-w-4 w-5' fill='currentColor' viewBox='0 0 20 20'>
          <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
        </svg>
        <p className='hidden md:inline-block'>Users</p>
      </NavLink>
      
    </div>
  )
}

export default Sidebar
