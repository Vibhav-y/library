import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const Donations = () => {
  const { axios } = useAppContext()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState(null)
  const [stats, setStats] = useState({
    totalINR: 0,
    totalUSD: 0,
    count: 0
  })

  useEffect(() => {
    fetchDonations()
    fetchSettings()
  }, [])

  const fetchDonations = async () => {
    try {
      const { data } = await axios.get('/api/donation/all')
      if (data.success) {
        setDonations(data.donations)
        calculateStats(data.donations)
      }
    } catch (error) {
      toast.error('Failed to fetch donations')
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/donation/settings?key=donation_banner_enabled')
      if (data.success) {
        setBannerEnabled(data.value === 'true')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const calculateStats = (donationList) => {
    const stats = {
      totalINR: 0,
      totalUSD: 0,
      count: donationList.length
    }

    donationList.forEach(d => {
      if (d.status === 'completed') {
        if (d.currency === 'INR') {
          stats.totalINR += d.amount
        } else {
          stats.totalUSD += d.amount
        }
      }
    })

    setStats(stats)
  }

  const toggleBanner = async () => {
    try {
      const { data } = await axios.post('/api/donation/settings', {
        key: 'donation_banner_enabled',
        value: !bannerEnabled ? 'true' : 'false',
        description: 'Enable/disable donation banner'
      })
      
      if (data.success) {
        setBannerEnabled(!bannerEnabled)
        toast.success(`Donation banner ${!bannerEnabled ? 'enabled' : 'disabled'}`)
      }
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const deleteDonation = async (id) => {
    if (!confirm('Are you sure you want to delete this donation?')) return

    try {
      const { data } = await axios.post('/api/donation/delete', { id })
      
      if (data.success) {
        toast.success('Donation deleted successfully')
        fetchDonations()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to delete donation')
      console.error(error)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const showPaymentDetails = (donation) => {
    setSelectedDonation(donation)
    setShowPaymentModal(true)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent'></div>
      </div>
    )
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold text-gray-800'>Donations</h1>
        
        {/* Banner Toggle */}
        <label className='flex items-center gap-3 cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200'>
          <span className='text-sm font-semibold text-gray-700'>Donation Banner</span>
          <div className='relative'>
            <input
              type='checkbox'
              checked={bannerEnabled}
              onChange={toggleBanner}
              className='sr-only'
            />
            <div className={`w-12 h-6 rounded-full transition-colors ${
              bannerEnabled ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-gray-300'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                bannerEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </div>
          </div>
        </label>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-semibold text-green-700'>Total Raised (INR)</h3>
            <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <p className='text-3xl font-bold text-green-900'>₹ {stats.totalINR.toLocaleString()}</p>
        </div>

        <div className='bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-semibold text-blue-700'>Total Raised (USD)</h3>
            <svg className='w-8 h-8 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <p className='text-3xl font-bold text-blue-900'>$ {stats.totalUSD.toLocaleString()}</p>
        </div>

        <div className='bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-sm font-semibold text-purple-700'>Total Donations</h3>
            <svg className='w-8 h-8 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
            </svg>
          </div>
          <p className='text-3xl font-bold text-purple-900'>{stats.count}</p>
        </div>
      </div>

      {/* Donations Table */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Donor
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Email
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Amount
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Message
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Date
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {donations.length === 0 ? (
                <tr>
                  <td colSpan='7' className='px-6 py-12 text-center text-gray-500'>
                    No donations yet
                  </td>
                </tr>
              ) : (
                donations.map((donation) => (
                  <tr key={donation._id} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold'>
                          {donation.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>{donation.name}</p>
                          {donation.isAnonymous && (
                            <span className='text-xs text-gray-500'>(Anonymous)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                      {donation.email}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='font-bold text-lg text-gray-900'>
                        {donation.currency === 'INR' ? '₹' : '$'} {donation.amount}
                      </span>
                      <span className='text-xs text-gray-500 ml-1'>{donation.currency}</span>
                    </td>
                    <td className='px-6 py-4 max-w-xs'>
                      <p className='text-sm text-gray-600 truncate'>
                        {donation.message || '-'}
                      </p>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        donation.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : donation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                      {formatDate(donation.createdAt)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center gap-2'>
                        {donation.status === 'completed' && (
                          <button
                            onClick={() => showPaymentDetails(donation)}
                            className='p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
                            title='View payment details'
                          >
                            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                            </svg>
                          </button>
                        )}
                        {donation.status === 'pending' && (
                          <button
                            onClick={() => deleteDonation(donation._id)}
                            className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                            title='Delete donation'
                          >
                            <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedDonation && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-lg w-full'>
            <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-900'>Payment Details</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <div className='p-4 space-y-3'>
              {/* Donor Info */}
              <div className='bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-3 border border-indigo-100'>
                <h3 className='font-semibold text-gray-900 mb-1.5 text-sm'>Donor Information</h3>
                <div className='space-y-0.5 text-sm'>
                  <p><span className='text-gray-600'>Name:</span> <span className='font-medium text-gray-900'>{selectedDonation.name}</span></p>
                  <p><span className='text-gray-600'>Email:</span> <span className='font-medium text-gray-900'>{selectedDonation.email}</span></p>
                  <p><span className='text-gray-600'>Amount:</span> <span className='font-bold text-lg text-indigo-600'>{selectedDonation.currency === 'INR' ? '₹' : '$'} {selectedDonation.amount}</span></p>
                </div>
              </div>

              {/* Payment Gateway Info */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Payment Gateway</label>
                <div className='flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200'>
                  <svg className='w-5 h-5 text-indigo-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' />
                  </svg>
                  <span className='font-medium text-gray-900'>Razorpay (PG)</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Payment Method</label>
                <div className='p-2.5 bg-gray-50 rounded-lg border border-gray-200'>
                  <span className='font-medium text-gray-900 text-sm'>Online Payment (Razorpay)</span>
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Razorpay Transaction ID</label>
                <div className='flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200'>
                  <span className='font-mono text-sm text-gray-900 flex-1 truncate'>
                    {selectedDonation.razorpayPaymentId || 'N/A'}
                  </span>
                  {selectedDonation.razorpayPaymentId && (
                    <button
                      onClick={() => copyToClipboard(selectedDonation.razorpayPaymentId)}
                      className='p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors flex-shrink-0'
                      title='Copy to clipboard'
                    >
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Order ID */}
              <div>
                <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Razorpay Order ID</label>
                <div className='flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200'>
                  <span className='font-mono text-sm text-gray-900 flex-1 truncate'>
                    {selectedDonation.razorpayOrderId || 'N/A'}
                  </span>
                  {selectedDonation.razorpayOrderId && (
                    <button
                      onClick={() => copyToClipboard(selectedDonation.razorpayOrderId)}
                      className='p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors flex-shrink-0'
                      title='Copy to clipboard'
                    >
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Status and Date */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Status</label>
                  <span className='inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800'>
                    {selectedDonation.status}
                  </span>
                </div>
                <div>
                  <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Date</label>
                  <p className='text-sm text-gray-900'>{formatDate(selectedDonation.createdAt)}</p>
                </div>
              </div>

              {/* Message */}
              {selectedDonation.message && (
                <div>
                  <label className='block text-xs font-semibold text-gray-600 mb-1.5'>Message</label>
                  <div className='p-2.5 bg-gray-50 rounded-lg border border-gray-200'>
                    <p className='text-sm text-gray-900'>{selectedDonation.message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className='p-4 border-t border-gray-200'>
              <button
                onClick={() => setShowPaymentModal(false)}
                className='w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all font-medium'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Donations
