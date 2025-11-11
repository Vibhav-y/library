import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const DonationBanner = () => {
  const navigate = useNavigate()
  const { axios } = useAppContext()
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isManuallyClosed, setIsManuallyClosed] = useState(false)

  useEffect(() => {
    // Check if user manually closed the banner
    const manuallyClosed = localStorage.getItem('donation_banner_closed')
    if (manuallyClosed === 'true') {
      setIsManuallyClosed(true)
      return
    }

    // Check if banner is enabled from settings
    const checkBannerStatus = async () => {
      try {
        const { data } = await axios.get('/api/donation/settings?key=donation_banner_enabled')
        console.log('Banner settings response:', data) // Debug log
        if (data.success && data.value) {
          // Handle both string 'true' and boolean true
          const isEnabled = data.value === 'true' || data.value === true
          console.log('Banner enabled:', isEnabled) // Debug log
          setIsVisible(isEnabled)
        }
      } catch (error) {
        console.error('Error checking banner status:', error)
      }
    }
    checkBannerStatus()
  }, [axios])

  const handleClose = () => {
    setIsClosing(true)
    localStorage.setItem('donation_banner_closed', 'true')
    setTimeout(() => {
      setIsVisible(false)
      setIsManuallyClosed(true)
    }, 300)
  }

  if (!isVisible || isManuallyClosed) return null

  return (
    <div className={`w-full overflow-hidden pt-20 ${isClosing ? 'animate-slide-out' : ''}`}>
      <div className='bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white py-3 shadow-lg'>
        <div className='relative'>
          {/* Animated content */}
          <div className='animate-scroll-rtl whitespace-nowrap'>
            <span className='inline-flex items-center gap-8 px-8'>
              <span className='flex items-center gap-2 font-semibold'>
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' />
                </svg>
                Support Us - Help Keep This Platform Running!
              </span>
              <button 
                onClick={() => navigate('/donate')}
                className='px-6 py-1.5 bg-white text-purple-600 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg'
              >
                Donate Now
              </button>
              <span className='text-sm opacity-90'>
                Every contribution matters ✨
              </span>
              
              {/* Repeat for continuous scroll */}
              <span className='flex items-center gap-2 font-semibold ml-8'>
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' />
                </svg>
                Support Us - Help Keep This Platform Running!
              </span>
              <button 
                onClick={() => navigate('/donate')}
                className='px-6 py-1.5 bg-white text-purple-600 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg'
              >
                Donate Now
              </button>
              <span className='text-sm opacity-90'>
                Every contribution matters ✨
              </span>
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition-colors'
            aria-label='Close banner'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-rtl {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes slide-out {
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }

        .animate-scroll-rtl {
          animation: scroll-rtl 20s linear infinite;
        }

        .animate-slide-out {
          animation: slide-out 300ms ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-rtl {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

export default DonationBanner
