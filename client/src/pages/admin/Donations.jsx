import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const Donations = () => {
  const { axios } = useAppContext()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerEnabled, setBannerEnabled] = useState(false)
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
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {donations.length === 0 ? (
                <tr>
                  <td colSpan='6' className='px-6 py-12 text-center text-gray-500'>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Donations
