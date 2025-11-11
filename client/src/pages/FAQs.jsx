import React, { useState } from 'react'
import { motion } from 'motion/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DonationBanner from '../components/DonationBanner'

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I create an account?',
          answer: 'Creating an account is easy! Click on the "Register" button in the navigation bar, fill out the registration form with your username, full name, email, and password. Make sure to choose a unique username (we\'ll check availability in real-time) and create a strong password. You\'ll also need to accept our Terms & Conditions and Privacy Policy before registering.'
        },
        {
          question: 'What are the password requirements?',
          answer: 'Your password must be at least 8 characters long and achieve a minimum strength score of 2/5. We recommend using a mix of uppercase letters, lowercase letters, numbers, and special characters for maximum security. Our password strength indicator will help you create a strong password.'
        },
        {
          question: 'Is LibraFlow free to use?',
          answer: 'Yes! LibraFlow is completely free for all users. You can create an account, write blogs, comment on posts, and engage with the community at no cost. We accept voluntary donations to help support platform operations, but this is entirely optional.'
        },
        {
          question: 'Can I use LibraFlow without creating an account?',
          answer: 'You can browse and read blog posts without an account. However, to write blogs, comment on posts, and engage with other features, you\'ll need to create a free account.'
        }
      ]
    },
    {
      category: 'Writing & Publishing',
      questions: [
        {
          question: 'How do I publish a blog post?',
          answer: 'After logging in, click on your profile icon in the navbar and select "Write a Blog" or navigate directly to the writing interface. Use our rich text editor to create your content, add a compelling title, choose a category (Technology, Startup, Lifestyle, or Finance), upload a featured image, and click "Publish" when you\'re ready to share your story with the world!'
        },
        {
          question: 'Can I save my blog as a draft?',
          answer: 'Currently, all blogs are published immediately when you submit them. We recommend composing your content in a separate document first if you need to work on it over multiple sessions. Draft functionality is planned for future updates!'
        },
        {
          question: 'What categories can I publish in?',
          answer: 'LibraFlow currently supports four main categories: Technology (for tech trends, coding, and innovation), Startup (for entrepreneurship and business insights), Lifestyle (for personal development, travel, and culture), and Finance (for money management, investing, and economics).'
        },
        {
          question: 'Can I edit or delete my published blog?',
          answer: 'Yes! You can manage your published blogs from your profile page. Simply navigate to your profile, find the blog you want to edit or delete, and use the available options. Changes are saved immediately.'
        },
        {
          question: 'What formatting options are available in the editor?',
          answer: 'Our rich text editor supports headers (H1, H2, H3), bold, italic, underline, strikethrough, text colors, background colors, ordered and unordered lists, code blocks, blockquotes, links, images, and text alignment. You can also adjust indentation for better content structure.'
        },
        {
          question: 'Is there a limit to how long my blog post can be?',
          answer: 'There\'s no strict word limit, but we recommend keeping posts focused and engaging. The editor supports long-form content, so feel free to express your thoughts fully. However, consider breaking very long topics into a series of posts for better readability.'
        }
      ]
    },
    {
      category: 'Account & Profile',
      questions: [
        {
          question: 'How do I update my profile information?',
          answer: 'Navigate to your profile page by clicking on your profile icon in the navbar. From there, you can update your display name, bio, and other profile details. Your username cannot be changed once set, so choose wisely during registration!'
        },
        {
          question: 'What appears in my author bio?',
          answer: 'Your author bio (up to 200 characters) appears at the end of every blog post you publish. It\'s a great opportunity to tell readers about yourself, your expertise, or what you\'re passionate about. Keep it concise and engaging!'
        },
        {
          question: 'Can I change my username?',
          answer: 'Usernames are permanent and cannot be changed after registration. This ensures consistency for your readers and maintains the integrity of your author profile. Please choose your username carefully during the registration process.'
        },
        {
          question: 'How do I delete my account?',
          answer: 'If you wish to delete your account, please contact our support team at info@libraflow.cc. We\'ll guide you through the process. Note that this action is permanent and your published content will be removed from the platform.'
        }
      ]
    },
    {
      category: 'Comments & Community',
      questions: [
        {
          question: 'How do comments work?',
          answer: 'Anyone can submit comments on published blog posts by filling out the comment form (name, email, and message). However, all comments go through a moderation process before appearing publicly. This helps maintain a respectful and spam-free community.'
        },
        {
          question: 'Why isn\'t my comment showing up?',
          answer: 'All comments require admin approval before being published. This helps us maintain quality discussions and prevent spam. Your comment is in the moderation queue and will be reviewed shortly. Approved comments typically appear within 24-48 hours.'
        },
        {
          question: 'What are the community guidelines?',
          answer: 'We promote respectful, constructive discussions. Comments containing hate speech, spam, personal attacks, or inappropriate content will not be approved. Share your thoughts thoughtfully and engage in meaningful conversations with fellow readers.'
        }
      ]
    },
    {
      category: 'Donations & Support',
      questions: [
        {
          question: 'How do donations work?',
          answer: 'LibraFlow accepts voluntary donations to support platform operations, server costs, and continued development. You can donate through our secure payment gateway (Razorpay) in either INR or USD. All donations are processed securely and are completely optional.'
        },
        {
          question: 'Are donations refundable?',
          answer: 'Donations are generally non-refundable as they support ongoing platform operations. However, if you believe a charge was made in error, please contact us at info@libraflow.cc within 7 days of the transaction, and we\'ll review your case.'
        },
        {
          question: 'Can I donate anonymously?',
          answer: 'Yes! When making a donation, you have the option to donate anonymously. Anonymous donations will be recorded but your name won\'t be displayed publicly on the platform.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major payment methods through Razorpay, including credit cards, debit cards, UPI, net banking, and digital wallets. All transactions are secured with industry-standard encryption.'
        }
      ]
    },
    {
      category: 'Technical & Security',
      questions: [
        {
          question: 'Is my personal information secure?',
          answer: 'Absolutely! We take security seriously. Your password is encrypted using bcrypt hashing, and we never store passwords in plain text. All data transmission is secured, and we comply with privacy regulations. Read our Privacy Policy for detailed information about how we protect your data.'
        },
        {
          question: 'What browsers are supported?',
          answer: 'LibraFlow works best on modern browsers including Chrome, Firefox, Safari, and Edge (latest versions). We recommend keeping your browser updated for the best experience and security.'
        },
        {
          question: 'Is LibraFlow mobile-friendly?',
          answer: 'Yes! LibraFlow is fully responsive and works seamlessly on mobile devices, tablets, and desktops. You can read, write, and manage your blogs from any device with an internet connection.'
        },
        {
          question: 'What should I do if I forget my password?',
          answer: 'Currently, please contact our support team at info@libraflow.cc if you need to reset your password. We\'re working on implementing an automated password reset feature for your convenience.'
        }
      ]
    },
    {
      category: 'Contact & Support',
      questions: [
        {
          question: 'How can I contact support?',
          answer: 'You can reach us through our Contact page by filling out the contact form, or email us directly at info@libraflow.cc. We aim to respond to all inquiries within 24-48 hours during business days.'
        },
        {
          question: 'What are your business hours?',
          answer: 'Our support team is available Monday through Friday, 9:00 AM to 6:00 PM. While we\'re closed on weekends, you can still submit inquiries through our contact form, and we\'ll respond on the next business day.'
        },
        {
          question: 'I found a bug. How do I report it?',
          answer: 'We appreciate bug reports! Please email us at info@libraflow.cc with a detailed description of the issue, including what you were doing when it occurred, your browser/device information, and any error messages you saw. Screenshots are very helpful!'
        },
        {
          question: 'Can I suggest new features?',
          answer: 'Absolutely! We love hearing from our community. Send your feature suggestions to info@libraflow.cc. While we can\'t implement every request, we carefully consider all feedback when planning platform updates.'
        }
      ]
    }
  ]

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50'>
      <Navbar />
      <DonationBanner />
      
      <div className='py-16 px-4'>
        <div className='max-w-5xl mx-auto'>
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
            className='text-center mb-12'
          >
            <h1 className='text-4xl md:text-5xl font-bold gradient-text mb-4'>
              Frequently Asked Questions
            </h1>
            <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
              Find answers to common questions about LibraFlow. Can't find what you're looking for? 
              <a href='/contact' className='text-indigo-600 hover:text-indigo-700 font-medium ml-1'>
                Contact us
              </a>
            </p>
          </motion.div>

          {/* FAQ Categories */}
          <div className='space-y-8'>
            {faqs.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                {/* Category Header */}
                <div className='mb-4'>
                  <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-3'>
                    <span className='w-1.5 h-8 bg-gradient-to-b from-indigo-600 to-violet-600 rounded-full'></span>
                    {category.category}
                  </h2>
                </div>

                {/* Questions in Category */}
                <div className='space-y-3'>
                  {category.questions.map((faq, questionIndex) => {
                    const index = `${categoryIndex}-${questionIndex}`
                    const isOpen = openIndex === index

                    return (
                      <div
                        key={questionIndex}
                        className='modern-card overflow-hidden transition-all duration-200 hover:shadow-lg'
                      >
                        <button
                          onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                          className='w-full px-6 py-4 flex items-center justify-between text-left gap-4 group'
                        >
                          <div className='flex items-start gap-3 flex-1'>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              isOpen 
                                ? 'bg-gradient-to-br from-indigo-600 to-violet-600' 
                                : 'bg-gray-100 group-hover:bg-indigo-50'
                            }`}>
                              <svg 
                                className={`w-5 h-5 transition-colors ${isOpen ? 'text-white' : 'text-gray-600 group-hover:text-indigo-600'}`}
                                fill='none' 
                                viewBox='0 0 24 24' 
                                stroke='currentColor'
                              >
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                            </div>
                            <span className={`font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors ${
                              isOpen ? 'text-indigo-600' : ''
                            }`}>
                              {faq.question}
                            </span>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                              isOpen ? 'rotate-180 text-indigo-600' : ''
                            }`}
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                          </svg>
                        </button>

                        {/* Answer */}
                        <motion.div
                          initial={false}
                          animate={{
                            height: isOpen ? 'auto' : 0,
                            opacity: isOpen ? 1 : 0
                          }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className='overflow-hidden'
                        >
                          <div className='px-6 pb-4 pt-0'>
                            <div className='pl-11'>
                              <p className='text-gray-700 leading-relaxed'>
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Still Have Questions CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className='mt-12 modern-card p-8 bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-100 text-center'
          >
            <div className='max-w-2xl mx-auto'>
              <div className='w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                <svg className='w-8 h-8 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                </svg>
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-3'>
                Still Have Questions?
              </h3>
              <p className='text-gray-700 mb-6'>
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <a
                  href='/contact'
                  className='btn-modern btn-gradient px-8 py-3 inline-flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                  </svg>
                  Contact Support
                </a>
                <a
                  href='mailto:info@libraflow.cc'
                  className='px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors border-2 border-indigo-200 inline-flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207' />
                  </svg>
                  Email Us
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default FAQs
