import React from 'react'
import { motion } from 'motion/react'

const Terms = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-12 px-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className='app-container max-w-3xl'
      >
        <div className='modern-card p-8 sm:p-10'>
          <h1 className='text-3xl font-bold gradient-text mb-4'>Terms of Service</h1>
          <p className='text-sm text-gray-500 mb-8'>Last updated: {new Date().toLocaleDateString()}</p>

          <section className='space-y-6 text-gray-700'>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>1. Acceptance of Terms</h2>
              <p>By accessing or using LibraFlow, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please discontinue use.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>2. Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Provide accurate information and notify us of any unauthorized use.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>3. Content</h2>
              <p>You retain ownership of content you post. By posting, you grant LibraFlow a non-exclusive license to host and display your content to provide the service. Do not post unlawful or infringing content.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>4. Prohibited Uses</h2>
              <ul className='list-disc pl-6 space-y-2'>
                <li>Attempting to disrupt or compromise the service or other users</li>
                <li>Posting spam, malware, or content that violates rights of others</li>
                <li>Scraping, reverse engineering, or abusing rate limits</li>
              </ul>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>5. Termination</h2>
              <p>We may suspend or terminate accounts that violate these terms. You may stop using the service at any time.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>6. Disclaimer of Warranties</h2>
              <p>The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free operation.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>7. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, LibraFlow is not liable for any indirect or consequential damages arising from your use of the service.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>8. Changes to Terms</h2>
              <p>We may update these terms from time to time. Continued use after changes take effect constitutes acceptance of the updated terms.</p>
            </div>
            <div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>9. Contact</h2>
              <p>For questions, contact us at support@libraflow.local.</p>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  )
}

export default Terms
