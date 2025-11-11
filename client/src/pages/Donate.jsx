import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast from 'react-hot-toast'

const Donate = () => {
  const { axios } = useAppContext()
  const [currency, setCurrency] = useState('INR')
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    isAnonymous: false
  })
  const [recentDonations, setRecentDonations] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Amount, 2: Details

  const amountsINR = [100, 250, 500, 1000, 2500, 5000]
  const amountsUSD = [5, 10, 20, 50, 100, 200]

  useEffect(() => {
    fetchRecentDonations()
  }, [])

  const fetchRecentDonations = async () => {
    try {
      const { data } = await axios.get('/api/donation/recent')
      if (data.success) {
        setRecentDonations(data.donations)
      }
    } catch (error) {
      console.error('Error fetching donations:', error)
    }
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleDonate = async () => {
    const amount = selectedAmount || parseFloat(customAmount)
    
    if (!amount || amount < 1) {
      toast.error('Please select or enter a valid amount')
      return
    }

    if (!formData.name && !formData.isAnonymous) {
      toast.error('Please enter your name or donate anonymously')
      return
    }

    if (!formData.email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.')
        setLoading(false)
        return
      }

      // Create order
      const { data } = await axios.post('/api/donation/create-order', {
        amount,
        currency,
        ...formData
      })

      if (!data.success) {
        toast.error(data.message)
        setLoading(false)
        return
      }

      // Razorpay options
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'LibraFlow',
        description: 'Support us in keeping the platform running',
        order_id: data.orderId,
        handler: async function (response) {
          try {
            const verifyData = await axios.post('/api/donation/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donationId: data.donationId
            })

            if (verifyData.data.success) {
              toast.success('Thank you for your generous donation! 🎉')
              // Reset form
              setSelectedAmount(null)
              setCustomAmount('')
              setFormData({ name: '', email: '', message: '', isAnonymous: false })
              setStep(1)
              fetchRecentDonations()
            } else {
              toast.error('Payment verification failed')
            }
          } catch (error) {
            toast.error('Payment verification failed')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: formData.isAnonymous ? 'Anonymous' : formData.name,
          email: formData.email
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function() {
            setLoading(false)
            toast.error('Payment cancelled')
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Donation error:', error)
      toast.error(error.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const amounts = currency === 'INR' ? amountsINR : amountsUSD

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50'>
      <Navbar />
      
      <div className='max-w-6xl mx-auto px-4 py-12 pt-24'>
        {/* Hero Section */}
        <div className='text-center mb-12 animate-slide-up'>
          <h1 className='text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-900 via-purple-900 to-violet-900 bg-clip-text text-transparent mb-4'>
            Support LibraFlow
          </h1>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Help us deliver solutions and keep this platform running. Your contribution makes a real difference in maintaining and improving our services.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Donation Form */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 animate-scale-in'>
              {step === 1 ? (
                <>
                  {/* Currency Toggle */}
                  <div className='flex justify-center mb-8'>
                    <div className='inline-flex bg-gray-100 rounded-xl p-1'>
                      <button
                        onClick={() => {setCurrency('INR'); setSelectedAmount(null); setCustomAmount('')}}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                          currency === 'INR'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        ₹ INR
                      </button>
                      <button
                        onClick={() => {setCurrency('USD'); setSelectedAmount(null); setCustomAmount('')}}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                          currency === 'USD'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        $ USD
                      </button>
                    </div>
                  </div>

                  {/* Choose Amount */}
                  <h3 className='text-xl font-bold text-gray-800 mb-4'>Choose Amount</h3>
                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6'>
                    {amounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setSelectedAmount(amount)
                          setCustomAmount('')
                        }}
                        className={`p-4 rounded-xl font-semibold text-lg border-2 transition-all transform hover:scale-105 ${
                          selectedAmount === amount
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-lg'
                            : 'bg-white border-indigo-200 text-gray-700 hover:border-indigo-400'
                        }`}
                      >
                        {currency === 'INR' ? '₹' : '$'} {amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className='mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>
                      Or enter custom amount
                    </label>
                    <div className='relative'>
                      <span className='absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-500'>
                        {currency === 'INR' ? '₹' : '$'}
                      </span>
                      <input
                        type='number'
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value)
                          setSelectedAmount(null)
                        }}
                        placeholder='Custom Amount'
                        className='w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-xl text-lg font-semibold focus:outline-none focus:border-indigo-500 transition-colors'
                        min='1'
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedAmount && !customAmount}
                    className='w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-violet-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2'
                  >
                    Next
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  {/* Step 2: Details */}
                  <button
                    onClick={() => setStep(1)}
                    className='mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                    Back
                  </button>

                  <div className='mb-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-200'>
                    <p className='text-sm text-gray-600'>Donation Amount</p>
                    <p className='text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent'>
                      {currency === 'INR' ? '₹' : '$'} {selectedAmount || customAmount}
                    </p>
                  </div>

                  <h3 className='text-xl font-bold text-gray-800 mb-4'>Your Details</h3>
                  
                  <div className='space-y-4 mb-6'>
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>
                        Name {!formData.isAnonymous && <span className='text-red-500'>*</span>}
                      </label>
                      <input
                        type='text'
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={formData.isAnonymous}
                        className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors disabled:bg-gray-100'
                        placeholder='Your name'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>
                        Email <span className='text-red-500'>*</span>
                      </label>
                      <input
                        type='email'
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors'
                        placeholder='your@email.com'
                        required
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-2'>
                        Message (Optional)
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors resize-none'
                        rows={3}
                        placeholder='Leave a message (optional)'
                      />
                    </div>

                    <label className='flex items-center gap-3 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={formData.isAnonymous}
                        onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                        className='w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-indigo-500'
                      />
                      <span className='text-sm font-medium text-gray-700'>
                        Make my donation anonymous
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handleDonate}
                    disabled={loading}
                    className='w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-violet-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2'
                  >
                    {loading ? (
                      <>
                        <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent'></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                          <path d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' />
                        </svg>
                        Complete Donation
                      </>
                    )}
                  </button>

                  <p className='text-xs text-gray-500 text-center mt-4'>
                    Secure payment powered by Razorpay
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Impact */}
            <div className='bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 animate-scale-in' style={{animationDelay: '100ms'}}>
              <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
                Your Impact
              </h3>
              <ul className='space-y-3 text-sm text-gray-600'>
                <li className='flex items-start gap-2'>
                  <svg className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  Keep the platform running 24/7
                </li>
                <li className='flex items-start gap-2'>
                  <svg className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  Support new feature development
                </li>
                <li className='flex items-start gap-2'>
                  <svg className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  Maintain server and infrastructure
                </li>
                <li className='flex items-start gap-2'>
                  <svg className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                  Help us grow and improve
                </li>
              </ul>
            </div>

            {/* Recent Supporters */}
            <div className='bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 animate-scale-in' style={{animationDelay: '200ms'}}>
              <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5 text-indigo-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
                </svg>
                Recent Supporters
              </h3>
              <div className='space-y-3 max-h-64 overflow-y-auto'>
                {recentDonations.length === 0 ? (
                  <p className='text-sm text-gray-500 text-center py-4'>Be the first to donate!</p>
                ) : (
                  recentDonations.map((donation, index) => (
                    <div key={index} className='flex items-start gap-3 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg'>
                      <div className='w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0'>
                        {donation.name[0].toUpperCase()}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-semibold text-sm text-gray-800 truncate'>
                          {donation.name}
                        </p>
                        <p className='text-xs text-gray-600'>
                          {donation.currency === 'INR' ? '₹' : '$'}{donation.amount}
                        </p>
                        {donation.message && (
                          <p className='text-xs text-gray-500 mt-1 line-clamp-2'>
                            "{donation.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Donate
