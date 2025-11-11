import React from 'react'
import { motion } from 'motion/react'

const Returns = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-12 px-4'>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className='app-container max-w-3xl'>
        <div className='modern-card p-8 sm:p-10'>
          <h1 className='text-3xl font-bold gradient-text mb-4'>Return & Refund Policy</h1>
          <section className='space-y-4 text-gray-700'>
            <p>Our policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately we can't offer you a refund or exchange.</p>
            <p>To be eligible for a return, your item must be unused and in the same condition that you received it.</p>
            <p>For questions regarding returns, contact <a href='mailto:info@libraflow.cc' className='text-indigo-600 underline'>info@libraflow.cc</a>.</p>
          </section>
        </div>
      </motion.div>
    </div>
  )
}

export default Returns
