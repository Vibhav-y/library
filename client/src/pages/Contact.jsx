import React from 'react'
import { motion } from 'motion/react'

const Contact = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-12 px-4'>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className='app-container max-w-3xl'>
        <div className='modern-card p-8 sm:p-10'>
          <h1 className='text-3xl font-bold gradient-text mb-4'>Contact Us</h1>
          <p className='text-gray-700 mb-6'>Need help? Fill out the form below or email us at <a href='mailto:support@libraflow.local' className='text-indigo-600 underline'>support@libraflow.local</a>.</p>
          <form className='space-y-4'>
            <input className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50' placeholder='Your name' />
            <input className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50' placeholder='Your email' />
            <textarea className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50' rows={5} placeholder='How can we help?' />
            <div className='text-right'>
              <button type='button' className='btn-modern btn-gradient'>Send Message</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Contact
