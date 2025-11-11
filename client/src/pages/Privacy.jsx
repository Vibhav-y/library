/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
 */

import React from 'react'
import Navbar from '../components/Navbar'
import DonationBanner from '../components/DonationBanner'
import Footer from '../components/Footer'

const Privacy = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <DonationBanner />
      
      <div className='max-w-4xl mx-auto px-4 py-12 pt-28'>
        {/* Header */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8'>
          <div className='border-l-4 border-indigo-600 pl-6'>
            <h1 className='text-4xl font-bold text-gray-900 mb-2'>Privacy Policy</h1>
            <p className='text-gray-600'>Last Updated: November 11, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-8'>
          
          {/* Introduction */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              1. Introduction
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              Welcome to LibraFlow ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p className='text-gray-700 leading-relaxed mt-4'>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              2. Information We Collect
            </h2>
            
            <h3 className='text-xl font-semibold text-gray-800 mt-6 mb-3'>2.1 Personal Information</h3>
            <p className='text-gray-700 leading-relaxed mb-3'>
              We collect personal information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our services, or otherwise contact us.
            </p>
            <div className='bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-lg'>
              <p className='text-sm font-semibold text-indigo-900 mb-2'>Personal data collected includes:</p>
              <ul className='list-disc list-inside text-gray-700 space-y-1 text-sm'>
                <li>Full name and username</li>
                <li>Email address</li>
                <li>Phone number (optional)</li>
                <li>Bio and profile information</li>
                <li>Password (encrypted)</li>
              </ul>
            </div>

            <h3 className='text-xl font-semibold text-gray-800 mt-6 mb-3'>2.2 Automatically Collected Information</h3>
            <p className='text-gray-700 leading-relaxed'>
              When you visit our website, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies installed on your device. This information is used to improve our services and user experience.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              3. How We Use Your Information
            </h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              We use the information we collect or receive for the following purposes:
            </p>
            <div className='space-y-3'>
              <div className='flex gap-3'>
                <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mt-1'>
                  <span className='text-indigo-600 font-bold text-sm'>1</span>
                </div>
                <div>
                  <h4 className='font-semibold text-gray-800'>Account Management</h4>
                  <p className='text-gray-700 text-sm'>To facilitate account creation, authentication, and maintain your account.</p>
                </div>
              </div>
              <div className='flex gap-3'>
                <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mt-1'>
                  <span className='text-indigo-600 font-bold text-sm'>2</span>
                </div>
                <div>
                  <h4 className='font-semibold text-gray-800'>Service Delivery</h4>
                  <p className='text-gray-700 text-sm'>To provide you with blog publishing, commenting, and other platform features.</p>
                </div>
              </div>
              <div className='flex gap-3'>
                <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mt-1'>
                  <span className='text-indigo-600 font-bold text-sm'>3</span>
                </div>
                <div>
                  <h4 className='font-semibold text-gray-800'>Communication</h4>
                  <p className='text-gray-700 text-sm'>To send administrative information, updates, and security alerts.</p>
                </div>
              </div>
              <div className='flex gap-3'>
                <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mt-1'>
                  <span className='text-indigo-600 font-bold text-sm'>4</span>
                </div>
                <div>
                  <h4 className='font-semibold text-gray-800'>Platform Improvement</h4>
                  <p className='text-gray-700 text-sm'>To analyze usage patterns and improve our services and user experience.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sharing Your Information */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              4. Sharing Your Information
            </h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              We only share information in the following situations:
            </p>
            <ul className='space-y-2 text-gray-700'>
              <li className='flex gap-2'>
                <svg className='w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span><strong>With your consent:</strong> We share your information when you give us explicit permission.</span>
              </li>
              <li className='flex gap-2'>
                <svg className='w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span><strong>Legal compliance:</strong> When required by law or to respond to legal processes.</span>
              </li>
              <li className='flex gap-2'>
                <svg className='w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span><strong>Service providers:</strong> With third-party service providers who perform services on our behalf.</span>
              </li>
            </ul>
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4'>
              <p className='text-sm text-yellow-800'>
                <strong>Note:</strong> We will never sell your personal information to third parties.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              5. Data Security
            </h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please note that no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
            </p>
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <p className='text-sm font-semibold text-gray-800 mb-2'>Security measures include:</p>
              <ul className='text-sm text-gray-700 space-y-1'>
                <li>• Password encryption using industry-standard bcrypt hashing</li>
                <li>• Secure JWT token-based authentication</li>
                <li>• HTTPS encryption for data transmission</li>
                <li>• Regular security audits and updates</li>
              </ul>
            </div>
          </section>

          {/* Your Privacy Rights */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              6. Your Privacy Rights
            </h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <div className='grid md:grid-cols-2 gap-4'>
              <div className='bg-indigo-50 rounded-lg p-4 border border-indigo-100'>
                <h4 className='font-semibold text-indigo-900 mb-2'>Access & Portability</h4>
                <p className='text-sm text-gray-700'>Request a copy of your personal data in a portable format.</p>
              </div>
              <div className='bg-indigo-50 rounded-lg p-4 border border-indigo-100'>
                <h4 className='font-semibold text-indigo-900 mb-2'>Correction</h4>
                <p className='text-sm text-gray-700'>Request correction of inaccurate or incomplete data.</p>
              </div>
              <div className='bg-indigo-50 rounded-lg p-4 border border-indigo-100'>
                <h4 className='font-semibold text-indigo-900 mb-2'>Deletion</h4>
                <p className='text-sm text-gray-700'>Request deletion of your personal data from our systems.</p>
              </div>
              <div className='bg-indigo-50 rounded-lg p-4 border border-indigo-100'>
                <h4 className='font-semibold text-indigo-900 mb-2'>Objection</h4>
                <p className='text-sm text-gray-700'>Object to processing of your personal data in certain circumstances.</p>
              </div>
            </div>
            <p className='text-gray-700 leading-relaxed mt-4 text-sm'>
              To exercise these rights, please access your account settings or contact us using the information provided below.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              7. Cookies and Tracking Technologies
            </h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              We use cookies and similar tracking technologies to track activity on our service and store certain information. Cookies are files with small amount of data which may include an anonymous unique identifier.
            </p>
            <p className='text-gray-700 leading-relaxed'>
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              8. Data Retention
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              9. Children's Privacy
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              Our service is not intended for children under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              10. Changes to This Privacy Policy
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact Information */}
          <section className='bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-6 border border-indigo-100'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              11. Contact Us
            </h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <svg className='w-5 h-5 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                </svg>
                <a href='mailto:info@libraflow.cc' className='text-indigo-600 hover:text-indigo-700 font-medium'>
                  info@libraflow.cc
                </a>
              </div>
              <div className='flex items-center gap-3'>
                <svg className='w-5 h-5 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' />
                </svg>
                <span className='text-gray-700'>www.libraflow.cc</span>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Notice */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6 text-center'>
          <p className='text-sm text-gray-600'>
            By using our service, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Privacy
