import React, { useRef } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Header = () => {
  
  const {setInput, input} = useAppContext()
  const inputRef = useRef()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setInput(inputRef.current.value)
  }

  const onClear = async () => {
    setInput('')
    inputRef.current.value = ''
  }

  return (
    <div className='app-container relative py-12 pt-24'>
      <div className='text-center mt-12 mb-12 fade-up'>
        
        <div className='inline-flex items-center justify-center gap-3 px-5 py-2 mb-6 border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-full text-sm text-indigo-700 font-medium shadow-sm'>
            <p>New: AI-powered blog assistant</p>
            <img className='w-3' src={assets.star_icon} alt="" />
        </div>
        
        <h1 className='text-4xl sm:text-6xl lg:text-7xl font-bold sm:leading-tight bg-gradient-to-r from-gray-900 via-indigo-900 to-violet-900 bg-clip-text text-transparent mb-6'>
          Your own <span className='gradient-text'>blogging</span> <br/> platform.
        </h1>

        <p className='my-6 sm:my-8 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed'>
          This is your space to think out loud, to share what matters, and to write without filters. Whether it's one word or a thousand, your story starts right here.
        </p>

        <form onSubmit={onSubmitHandler} className='flex justify-between max-w-xl mx-auto border-2 border-gray-200 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow pop-in' style={{animationDelay: '200ms'}}>
            <input ref={inputRef} className='w-full pl-6 outline-none text-gray-700' type="text" placeholder='Search for blogs...' required />
            <button className='btn-modern btn-gradient m-2' type='submit'>Search</button>
        </form>
      </div>
      <div className='text-center'>
        {input && <button onClick={onClear} className='btn-modern btn-outline text-sm'>Clear Search</button>}
      </div>
      <img className='absolute -top-50 -z-10 opacity-30' src={assets.gradientBackground} alt="" />
    </div>
  )
}

export default Header
