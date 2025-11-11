/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
 */

import React from 'react'
import Navbar from '../components/Navbar'
import DonationBanner from '../components/DonationBanner'
import Footer from '../components/Footer'

const Terms = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <DonationBanner />
      
      <div className='max-w-4xl mx-auto px-4 py-12 pt-28'>
        {/* Header */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8'>
          <div className='border-l-4 border-indigo-600 pl-6'>
            <h1 className='text-4xl font-bold text-gray-900 mb-2'>Terms of Service</h1>
            <p className='text-gray-600'>Last Updated: November 11, 2025</p>
          </div>
        </div>

        {/* Content */}
        <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-8'>
          
          {/* Introduction */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              1. Acceptance of Terms
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              Welcome to LibraFlow. By accessing or using our website and services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, you must not access or use the Service.
            </p>
            <div className='bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-lg mt-4'>
              <p className='text-sm text-indigo-900'>
                <strong>Important:</strong> These Terms constitute a legally binding agreement between you and LibraFlow. Please read them carefully.
              </p>
            </div>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              2. Account Registration and Security
            </h2>
            
            <h3 className='text-xl font-semibold text-gray-800 mt-6 mb-3'>2.1 Account Creation</h3>
            <p className='text-gray-700 leading-relaxed mb-3'>
              To access certain features of the Service, you must register for an account. When creating an account, you agree to:
            </p>
            <ul className='space-y-2 text-gray-700'>
              <li className='flex gap-2'>
                <svg className='w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span>Provide accurate, current, and complete information</span>
              </li>
              <li className='flex gap-2'>
                <svg className='w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span>Maintain and promptly update your account information</span>
              </li>
              <li className='flex gap-2'>
                <svg className='w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span>Maintain the security and confidentiality of your password</span>
              </li>
              <li className='flex gap-2'>
                <svg className='w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span>Notify us immediately of any unauthorized access to your account</span>
              </li>
            </ul>

            <h3 className='text-xl font-semibold text-gray-800 mt-6 mb-3'>2.2 Account Responsibility</h3>
            <p className='text-gray-700 leading-relaxed'>
              You are responsible for all activities that occur under your account. You agree to notify LibraFlow immediately of any unauthorized use of your account or any other breach of security. LibraFlow will not be liable for any loss or damage arising from your failure to comply with this security obligation.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              3. User Content and Intellectual Property
            </h2>
            
            <h3 className='text-xl font-semibold text-gray-800 mt-6 mb-3'>3.1 Your Content</h3>
            <p className='text-gray-700 leading-relaxed mb-3'>
              You retain all ownership rights to content you submit, post, or display on or through the Service ("User Content"). By posting User Content, you grant LibraFlow a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your User Content in connection with providing the Service.
            </p>

            <h3 className='text-xl font-semibold text-gray-800 mt-6 mb-3'>3.2 Content Guidelines</h3>
            <p className='text-gray-700 leading-relaxed mb-3'>You agree that your User Content will not:</p>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <ul className='space-y-2 text-sm text-gray-700'>
                <li>• Violate any applicable law or regulation</li>
                <li>• Infringe any intellectual property or other proprietary rights</li>
                <li>• Contain hate speech, harassment, or threatening material</li>
                <li>• Include malicious code, viruses, or harmful software</li>
                <li>• Impersonate any person or entity</li>
                <li>• Include spam, unsolicited promotions, or commercial content without authorization</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Conduct */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              4. Prohibited Uses and Conduct
            </h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              You agree not to engage in any of the following prohibited activities:
            </p>
            <div className='grid md:grid-cols-2 gap-4'>
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h4 className='font-semibold text-gray-800 mb-2 flex items-center gap-2'>
                  <svg className='w-5 h-5 text-red-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z' clipRule='evenodd' />
                  </svg>
                  System Abuse
                </h4>
                <p className='text-sm text-gray-700'>Attempting to disrupt, compromise, or gain unauthorized access to the Service or our systems.</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h4 className='font-semibold text-gray-800 mb-2 flex items-center gap-2'>
                  <svg className='w-5 h-5 text-red-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z' clipRule='evenodd' />
                  </svg>
                  Data Mining
                </h4>
                <p className='text-sm text-gray-700'>Scraping, crawling, or using automated tools to extract data without permission.</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h4 className='font-semibold text-gray-800 mb-2 flex items-center gap-2'>
                  <svg className='w-5 h-5 text-red-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z' clipRule='evenodd' />
                  </svg>
                  Reverse Engineering
                </h4>
                <p className='text-sm text-gray-700'>Decompiling, disassembling, or reverse engineering the Service or its components.</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h4 className='font-semibold text-gray-800 mb-2 flex items-center gap-2'>
                  <svg className='w-5 h-5 text-red-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z' clipRule='evenodd' />
                  </svg>
                  Rate Limit Abuse
                </h4>
                <p className='text-sm text-gray-700'>Exceeding reasonable request volumes or circumventing rate limiting mechanisms.</p>
              </div>
            </div>
          </section>

          {/* Donations and Payments */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              5. Donations and Payments
            </h2>
            <p className='text-gray-700 leading-relaxed mb-3'>
              LibraFlow accepts voluntary donations to support platform operations. All donations are processed through secure third-party payment processors (Razorpay).
            </p>
            <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg'>
              <p className='text-sm text-yellow-800'>
                <strong>Refund Policy:</strong> Donations are generally non-refundable. If you believe a charge was made in error, please contact us at info@libraflow.cc within 7 days of the transaction.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              6. Account Termination
            </h2>
            
            <h3 className='text-xl font-semibold text-gray-800 mt-6 mb-3'>6.1 Termination by You</h3>
            <p className='text-gray-700 leading-relaxed'>
              You may stop using the Service at any time and request account deletion through your account settings. Upon deletion, your User Content will be removed from public display, though some data may be retained in backups for a limited period.
            </p>

            <h3 className='text-xl font-semibold text-gray-800 mt-6 mb-3'>6.2 Termination by LibraFlow</h3>
            <p className='text-gray-700 leading-relaxed'>
              We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for any reason, including but not limited to violation of these Terms. We may also remove any User Content that violates these Terms or is otherwise objectionable.
            </p>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              7. Disclaimer of Warranties
            </h2>
            <div className='bg-gray-50 border border-gray-300 rounded-lg p-6'>
              <p className='text-gray-700 leading-relaxed mb-4 uppercase text-sm font-semibold'>
                IMPORTANT LEGAL NOTICE
              </p>
              <p className='text-gray-700 leading-relaxed'>
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className='text-gray-700 leading-relaxed mt-4'>
                LibraFlow does not warrant that the Service will be uninterrupted, error-free, secure, or free from viruses or other harmful components. You use the Service at your own risk.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              8. Limitation of Liability
            </h2>
            <div className='bg-gray-50 border border-gray-300 rounded-lg p-6'>
              <p className='text-gray-700 leading-relaxed'>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LIBRAFLOW, ITS AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className='mt-3 space-y-1 text-sm text-gray-700 ml-4'>
                <li>• Your access to or use of (or inability to access or use) the Service</li>
                <li>• Any conduct or content of any third party on the Service</li>
                <li>• Any content obtained from the Service</li>
                <li>• Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              9. Indemnification
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              You agree to indemnify, defend, and hold harmless LibraFlow and its affiliates, directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal and accounting fees, arising out of or in any way connected with your access to or use of the Service or your violation of these Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              10. Governing Law and Dispute Resolution
            </h2>
            <p className='text-gray-700 leading-relaxed mb-3'>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which LibraFlow operates, without regard to its conflict of law provisions.
            </p>
            <p className='text-gray-700 leading-relaxed'>
              Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration, except that either party may seek injunctive or other equitable relief in any court of competent jurisdiction.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-100'>
              11. Changes to These Terms
            </h2>
            <p className='text-gray-700 leading-relaxed'>
              We reserve the right to modify or replace these Terms at any time at our sole discretion. If we make material changes, we will provide notice through the Service or by other means. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
            </p>
            <div className='bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-lg mt-4'>
              <p className='text-sm text-indigo-900'>
                <strong>Recommendation:</strong> We encourage you to review these Terms periodically to stay informed about your rights and obligations.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className='bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-6 border border-indigo-100'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              12. Contact Information
            </h2>
            <p className='text-gray-700 leading-relaxed mb-4'>
              If you have any questions, concerns, or feedback regarding these Terms of Service, please contact us:
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
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' />
                </svg>
                <span className='text-gray-700'>Technical Support: info@libraflow.cc</span>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Notice */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6 text-center'>
          <p className='text-sm text-gray-600'>
            By using LibraFlow, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Terms
