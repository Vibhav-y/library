import React from 'react'
import { assets, footer_data } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-32 bg-gradient-to-br from-gray-50 to-indigo-50/30 border-t border-gray-200'>
      <div className='flex flex-col md:flex-row items-start justify-between gap-10 py-12 border-b border-gray-200 text-gray-600'>
        <div className='fade-up'>
            <img className='w-32 sm:w-44 mb-4' src={assets.logo} alt="logo" />
            <p className='max-w-md text-sm leading-relaxed'>Your creative space for sharing ideas and stories. Build, publish, and engage with a community of writers and readers.</p>
        </div>
    <div className='flex flex-wrap justify-between w-full md:w-[50%] gap-8'>
      {footer_data.map((section, index)=>(
        <div key={index} className='fade-up' style={{animationDelay: `${index * 100}ms`}}>
          <h3 className='font-semibold text-base text-gray-900 mb-4'>{section.title}</h3>
          <ul className='text-sm space-y-2'>
            {section.links.map((link, i)=>{
              // map friendly link text to internal routes
              const routeMap = {
                'Home': '/',
                'Contact Us': '/contact',
                'FAQs': '/faqs',
                'Terms of Service': '/terms',
                'Return & Refund Policy': '/returns',
                'Payment Methods': '/payment-methods'
              }
              const to = routeMap[link]
              return (
                <li key={i}>
                  {to ? (
                    <Link className='hover:text-indigo-600 transition-colors' to={to}>{link}</Link>
                  ) : (
                    <span>{link}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
      </div>
  <p className='py-6 text-center text-sm text-gray-500'>Copyright 2025 &copy; LibraFlow  | All Rights Reserved.</p>
    </div>
  )
}

export default Footer
