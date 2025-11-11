import React, { useState } from 'react'
import { blog_data, blogCategories } from '../assets/assets'
import {motion} from 'motion/react'
import BlogCard from './BlogCard';
import { useAppContext } from '../context/AppContext';

const BlogList = () => {

  const [menu, setMenu] = useState("All");
  const {blogs, input} = useAppContext();

  const filteredBlogs = () => {
    if(input === '') {
      return blogs
    }
    return blogs.filter((blog) => blog.title.toLowerCase().includes(input.toLowerCase()) || blog.category.toLowerCase().includes(input.toLowerCase()))
  }

  return (
    <div className='app-container'>
      <div className='flex justify-center gap-4 sm:gap-8 my-10 relative'>
        {blogCategories.map((item, idx) => (
            <div className='relative fade-up' key={item} style={{animationDelay: `${idx * 50}ms`}}>
                <button onClick={()=>setMenu(item)} className={`text-gray-600 cursor-pointer font-medium transition-colors ${menu === item && 'text-white px-4 pt-0.5'}`}>
                    {item}
                    { menu === item && (<motion.div layoutId='underline' transition={{type: 'spring', stiffness: 500, damping: 30}} className='absolute left-0 right-0 top-0 h-7 -z-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-lg'></motion.div>)}
                </button>
            </div>
        ))}
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24'>
        {filteredBlogs().filter((blog) => menu === "All" ? true : blog.category === menu).map((blog, idx) => (
          <div key={blog._id} className='fade-up' style={{animationDelay: `${idx * 80}ms`}}>
            <BlogCard blog={blog}/>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BlogList
