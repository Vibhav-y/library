import React from 'react'
import { motion } from 'motion/react'

const FAQs = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-12 px-4'>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className='app-container max-w-3xl'>
        <div className='modern-card p-8 sm:p-10'>
          <h1 className='text-3xl font-bold gradient-text mb-4'>Frequently Asked Questions</h1>
          <section className='space-y-6 text-gray-700'>
            <div>
              <h2 className='text-xl font-semibold mb-2'>How do I create an account?</h2>
              <p>Go to the Register page, fill out your details, choose an available username, and submit the form.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold mb-2'>How do I publish a blog?</h2>
              <p>After logging in, use the 'Write a blog' action in the navbar (available for authenticated users) to create and publish posts.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold mb-2'>How can I contact support?</h2>
              <p>Use the Contact Us page or email support@libraflow.local for assistance.</p>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  )
}

export default FAQs
