import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DonationBanner from '../components/DonationBanner'

const Contact = () => {
  const { axios } = useAppContext()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await axios.post('/api/contact/submit', formData)
      
      if (data.success) {
        toast.success(data.message)
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        })
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50'>
      <Navbar />
      <DonationBanner />
      
      <div className='py-16 px-4'>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }} 
          className='max-w-6xl mx-auto'
        >
          {/* Header Section */}
          <div className='text-center mb-12'>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='text-4xl md:text-5xl font-bold gradient-text mb-4'
            >
              Get In Touch
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='text-gray-600 text-lg max-w-2xl mx-auto'
            >
              Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you soon.
            </motion.p>
          </div>

          <div className='grid md:grid-cols-2 gap-8'>
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className='modern-card p-8'
            >
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className='space-y-5'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Full Name <span className='text-red-500'>*</span>
                  </label>
                  <input 
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50'
                    placeholder='John Doe'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Email Address <span className='text-red-500'>*</span>
                  </label>
                  <input 
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50'
                    placeholder='you@example.com'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Phone Number <span className='text-gray-500 text-xs'>(Optional)</span>
                  </label>
                  <input 
                    type='tel'
                    name='phone'
                    value={formData.phone}
                    onChange={handleChange}
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50'
                    placeholder='+91 00000 00000'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Subject <span className='text-red-500'>*</span>
                  </label>
                  <input 
                    type='text'
                    name='subject'
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50'
                    placeholder='How can we help you?'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Message <span className='text-red-500'>*</span>
                  </label>
                  <textarea 
                    name='message'
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-gray-50 resize-none'
                    placeholder='Tell us more about your inquiry...'
                  />
                </div>

                {/* Response Time Notice */}
                <div className='bg-gradient-to-r from-indigo-50 to-violet-50 border-l-4 border-indigo-600 p-4 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <svg className='w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    <div>
                      <p className='text-sm font-semibold text-gray-900'>Expected Response Time</p>
                      <p className='text-sm text-gray-600'>We'll get back to you within 24-48 hours during business days.</p>
                    </div>
                  </div>
                </div>

                <button 
                  type='submit'
                  disabled={loading}
                  className='btn-modern btn-gradient w-full py-3.5 text-base flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? (
                    <span className='flex items-center gap-2'>
                      <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <>
                      <svg className='w-5 h-5 mr-2' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className='space-y-6'
            >
              {/* Contact Info Cards */}
              <div className='modern-card p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-6 h-6 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>Email Us</h3>
                    <p className='text-gray-600 text-sm mb-2'>Our team is here to help</p>
                    <a href='mailto:info@libraflow.cc' className='text-indigo-600 hover:text-indigo-700 font-medium'>
                      info@libraflow.cc
                    </a>
                  </div>
                </div>
              </div>

              <div className='modern-card p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-6 h-6 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>Business Hours</h3>
                    <p className='text-gray-600 text-sm mb-2'>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className='text-gray-600 text-sm'>Saturday - Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className='modern-card p-6'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0'>
                    <svg className='w-6 h-6 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                    </svg>
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>Location</h3>
                    <p className='text-gray-600 text-sm'>LibraFlow Headquarters</p>
                    <p className='text-gray-600 text-sm'>Remote-First Company</p>
                  </div>
                </div>
              </div>

              {/* FAQ Link */}
              <div className='modern-card p-6 bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-100'>
                <h3 className='font-bold text-gray-900 mb-2'>Have a Quick Question?</h3>
                <p className='text-gray-600 text-sm mb-4'>
                  Check out our FAQ page for instant answers to common questions.
                </p>
                <a 
                  href='/faqs' 
                  className='inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm'
                >
                  Visit FAQ Page
                  <svg className='w-4 h-4 ml-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default Contact
