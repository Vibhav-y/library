import { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast from 'react-hot-toast'
import Moment from 'moment'

const Profile = () => {
  const { axios, user, logout, navigate } = useAppContext()
  
  const [profile, setProfile] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Profile update state
  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    bio: '',
    alternateEmail: ''
  })
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' })
  
  // Delete account state
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteData, setDeleteData] = useState({ email: '', confirmation: '' })

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const { data } = await axios.get('/api/user/profile')
      if (data.success) {
        setProfile(data.user)
        setProfileData({
          fullName: data.user.fullName || '',
          phone: data.user.phone || '',
          bio: data.user.bio || '',
          alternateEmail: data.user.alternateEmail || ''
        })
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Fetch user's blogs
  const fetchBlogs = async () => {
    try {
      const { data } = await axios.get('/api/user/my-blogs')
      if (data.success) {
        setBlogs(data.blogs)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchProfile()
    fetchBlogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Password strength calculator
  useEffect(() => {
    const pass = passwordData.newPassword
    if (!pass) {
      setPasswordStrength({ score: 0, label: '', color: '' })
      return
    }

    let score = 0
    if (pass.length >= 8) score++
    if (pass.length >= 12) score++
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++
    if (/\d/.test(pass)) score++
    if (/[^a-zA-Z0-9]/.test(pass)) score++

    const strengths = [
      { score: 0, label: 'Too weak', color: 'bg-red-500' },
      { score: 1, label: 'Weak', color: 'bg-red-400' },
      { score: 2, label: 'Fair', color: 'bg-yellow-400' },
      { score: 3, label: 'Good', color: 'bg-green-400' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Very Strong', color: 'bg-green-600' }
    ]

    const strength = strengths[score] || strengths[0]
    setPasswordStrength({ score, ...strength })
  }, [passwordData.newPassword])

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.put('/api/user/profile', profileData)
      if (data.success) {
        toast.success(data.message)
        setProfile(data.user)
        setEditMode(false)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordStrength.score < 2) {
      toast.error('Password is too weak. Please choose a stronger password.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      const { data } = await axios.post('/api/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      if (data.success) {
        toast.success(data.message)
        setShowPasswordModal(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Delete blog
  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return
    
    try {
      const { data } = await axios.delete('/api/user/my-blog', { data: { blogId } })
      if (data.success) {
        toast.success(data.message)
        setBlogs(blogs.filter(b => b._id !== blogId))
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Publish draft blog
  const handlePublishBlog = async (blogId) => {
    try {
      const { data } = await axios.post('/api/blog/toggle-publish', { id: blogId })
      if (data.success) {
        toast.success('Blog published successfully!')
        // Refresh blogs to show updated status
        fetchBlogs()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Delete account
  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    
    try {
      const { data } = await axios.post('/api/user/delete-account', deleteData)
      if (data.success) {
        toast.success(data.message)
        logout()
        navigate('/')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading || !profile) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50'>
        <div className='relative'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-indigo-200'></div>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-t-indigo-600 absolute top-0 left-0'></div>
        </div>
      </div>
    )
  }

  const publishedBlogs = blogs.filter(b => b.isPublished && !b.isTakenDown)
  const draftBlogs = blogs.filter(b => !b.isPublished && !b.isTakenDown)
  const takenDownBlogs = blogs.filter(b => b.isTakenDown)

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50'>
      <Navbar />
      
      <div className='max-w-6xl mx-auto px-4 py-12 pt-24'>
        {/* Profile Header */}
        <div className='bg-white rounded-2xl shadow-lg border border-indigo-100 p-8 mb-6 animate-slide-up hover:shadow-xl transition-shadow duration-300'>
          <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6'>
            <div className='relative group'>
              <div className='absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300'></div>
              <img 
                src={assets.user_icon} 
                className='relative w-24 h-24 rounded-full border-4 border-white shadow-lg' 
                alt='profile' 
              />
            </div>
            <div className='text-center sm:text-left flex-1'>
              <h1 className='text-3xl font-bold bg-gradient-to-r from-indigo-900 via-violet-900 to-indigo-900 bg-clip-text text-transparent mb-2'>
                {profile.fullName}
              </h1>
              <p className='text-indigo-600 font-semibold mb-1'>@{profile.username}</p>
              <p className='text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-2'>
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                </svg>
                {profile.email}
              </p>
              <div className='flex gap-4 mt-4 justify-center sm:justify-start'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-indigo-600'>{publishedBlogs.length}</p>
                  <p className='text-xs text-gray-500'>Published</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-yellow-600'>{draftBlogs.length}</p>
                  <p className='text-xs text-gray-500'>Drafts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info Display/Edit */}
          {!editMode ? (
            <div className='space-y-4 animate-scale-in'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='bg-gradient-to-br from-indigo-50 to-violet-50 p-4 rounded-xl border border-indigo-100'>
                  <p className='text-xs text-indigo-600 font-semibold mb-1 flex items-center gap-2'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                    </svg>
                    Phone
                  </p>
                  <p className='font-semibold text-gray-800'>{profile.phone || 'Not provided'}</p>
                </div>
                <div className='bg-gradient-to-br from-indigo-50 to-violet-50 p-4 rounded-xl border border-indigo-100'>
                  <p className='text-xs text-indigo-600 font-semibold mb-1 flex items-center gap-2'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207' />
                    </svg>
                    Alternate Email
                  </p>
                  <p className='font-semibold text-gray-800'>{profile.alternateEmail || 'Not provided'}</p>
                </div>
              </div>
              <div className='bg-gradient-to-br from-indigo-50 to-violet-50 p-4 rounded-xl border border-indigo-100'>
                <p className='text-xs text-indigo-600 font-semibold mb-1 flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16m-7 6h7' />
                  </svg>
                  Bio
                </p>
                <p className='font-medium text-gray-700'>{profile.bio || 'No bio yet'}</p>
              </div>
              <div className='flex flex-wrap gap-3 mt-6'>
                <button 
                  onClick={() => setEditMode(true)} 
                  className='px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                  </svg>
                  Edit Profile
                </button>
                <button 
                  onClick={() => setShowPasswordModal(true)} 
                  className='px-6 py-3 border-2 border-indigo-200 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                  </svg>
                  Change Password
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className='space-y-4 animate-scale-in'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>Full Name</label>
                  <input
                    type='text'
                    value={profileData.fullName}
                    onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                    className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-white'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>Phone</label>
                  <input
                    type='tel'
                    value={profileData.phone}
                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-white'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Alternate Email</label>
                <input
                  type='email'
                  value={profileData.alternateEmail}
                  onChange={e => setProfileData({ ...profileData, alternateEmail: e.target.value })}
                  className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-white'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Bio (max 200 characters)</label>
                <textarea
                  value={profileData.bio}
                  onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                  className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors bg-white resize-none'
                  rows={3}
                  maxLength={200}
                />
                <p className='text-xs text-gray-400 mt-1'>{profileData.bio.length}/200</p>
              </div>
              <div className='flex gap-3'>
                <button 
                  type='submit' 
                  className='px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all transform hover:scale-105 shadow-lg'
                >
                  Save Changes
                </button>
                <button 
                  type='button' 
                  onClick={() => setEditMode(false)} 
                  className='px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all'
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className='mt-6 pt-6 border-t border-indigo-100'>
            <p className='text-sm font-semibold text-indigo-600 mb-3 flex items-center gap-2'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              Account Information
            </p>
            <div className='bg-gradient-to-br from-gray-50 to-indigo-50/30 p-4 rounded-xl border border-gray-200 text-sm space-y-2'>
              <p><span className='font-semibold text-gray-700'>Username:</span> <span className='text-gray-600'>{profile.username}</span> <span className='text-gray-400 text-xs'>(cannot be changed)</span></p>
              <p><span className='font-semibold text-gray-700'>Primary Email:</span> <span className='text-gray-600'>{profile.email}</span> <span className='text-gray-400 text-xs'>(cannot be changed)</span></p>
            </div>
          </div>
        </div>

        {/* My Blogs Section */}
        <div className='bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 mb-6 animate-slide-up' style={{animationDelay: '100ms'}}>
          <h2 className='text-2xl font-bold bg-gradient-to-r from-indigo-900 to-violet-900 bg-clip-text text-transparent mb-6 flex items-center gap-2'>
            <svg className='w-6 h-6 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' />
            </svg>
            My Blogs
          </h2>
          
          {/* Published Blogs */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold mb-4 text-green-600 flex items-center gap-2'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              Published ({publishedBlogs.length})
            </h3>
            {publishedBlogs.length === 0 ? (
              <div className='text-center py-8 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl border border-dashed border-gray-300'>
                <svg className='w-16 h-16 mx-auto text-gray-300 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                <p className='text-gray-400 text-sm'>No published blogs yet</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {publishedBlogs.map((blog, index) => (
                  <div 
                    key={blog._id} 
                    className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 border-green-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl hover:shadow-md hover:border-green-200 transition-all group animate-scale-in'
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                    <div className='flex-1 mb-3 sm:mb-0'>
                      <p className='font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors'>{blog.title}</p>
                      <p className='text-xs text-gray-500 mt-1 flex items-center gap-2'>
                        <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                        </svg>
                        {Moment(blog.createdAt).format('MMM DD, YYYY')}
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <button 
                        onClick={() => navigate(`/blog/${blog._id}`)} 
                        className='px-4 py-2 text-sm bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 font-semibold transition-all flex items-center gap-1'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                        </svg>
                        View
                      </button>
                      <button 
                        onClick={() => handleDeleteBlog(blog._id)} 
                        className='px-4 py-2 text-sm text-red-600 border-2 border-red-300 bg-white rounded-lg hover:bg-red-50 font-semibold transition-all flex items-center gap-1'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Draft Blogs */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold mb-4 text-yellow-600 flex items-center gap-2'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
              </svg>
              Drafts ({draftBlogs.length})
            </h3>
            {draftBlogs.length === 0 ? (
              <div className='text-center py-8 bg-gradient-to-br from-gray-50 to-yellow-50/30 rounded-xl border border-dashed border-gray-300'>
                <svg className='w-16 h-16 mx-auto text-gray-300 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                <p className='text-gray-400 text-sm'>No drafts</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {draftBlogs.map((blog, index) => (
                  <div 
                    key={blog._id} 
                    className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 border-yellow-100 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 rounded-xl hover:shadow-md hover:border-yellow-200 transition-all group animate-scale-in'
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                    <div className='flex-1 mb-3 sm:mb-0'>
                      <p className='font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors'>{blog.title}</p>
                      <p className='text-xs text-gray-500 mt-1 flex items-center gap-2'>
                        <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        Created {Moment(blog.createdAt).format('MMM DD, YYYY')}
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      <button 
                        onClick={() => handlePublishBlog(blog._id)} 
                        className='px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-600 rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold transition-all flex items-center gap-1 shadow-md'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        Publish
                      </button>
                      <button 
                        onClick={() => handleDeleteBlog(blog._id)} 
                        className='px-4 py-2 text-sm text-red-600 border-2 border-red-300 bg-white rounded-lg hover:bg-red-50 font-semibold transition-all flex items-center gap-1'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Taken Down Blogs */}
          {takenDownBlogs.length > 0 && (
            <div>
              <h3 className='text-lg font-semibold mb-4 text-red-600 flex items-center gap-2'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                </svg>
                Removed by Admin ({takenDownBlogs.length})
              </h3>
              <div className='space-y-3'>
                {takenDownBlogs.map((blog, index) => (
                  <div 
                    key={blog._id} 
                    className='p-4 border-2 border-red-200 bg-gradient-to-r from-red-50/50 to-rose-50/50 rounded-xl animate-scale-in'
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                    <div className='flex flex-col sm:flex-row items-start justify-between'>
                      <div className='flex-1 mb-3 sm:mb-0'>
                        <p className='font-semibold text-gray-800'>{blog.title}</p>
                        <p className='text-xs text-gray-500 mt-1 flex items-center gap-2'>
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                          </svg>
                          Removed on {Moment(blog.updatedAt).format('MMM DD, YYYY')}
                        </p>
                        {blog.takedownReason && (
                          <div className='mt-3 p-3 bg-white rounded-lg border border-red-200 text-sm'>
                            <p className='font-semibold text-red-600 mb-1 flex items-center gap-1'>
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                              Reason:
                            </p>
                            <p className='text-gray-700'>{blog.takedownReason}</p>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteBlog(blog._id)} 
                        className='px-4 py-2 text-sm text-red-600 border-2 border-red-400 bg-white rounded-lg hover:bg-red-100 font-semibold transition-all flex items-center gap-1'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className='bg-white rounded-2xl shadow-lg p-6 border-4 border-red-200 animate-slide-up' style={{animationDelay: '200ms'}}>
          <h2 className='text-2xl font-bold text-red-600 mb-3 flex items-center gap-2'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
            </svg>
            Danger Zone
          </h2>
          <p className='text-sm text-gray-600 mb-4'>Once you delete your account, there is no going back. All your blogs will be permanently removed.</p>
          <button
            onClick={() => setShowDeleteWarning(true)}
            className='px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
            </svg>
            Delete My Account
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in'>
          <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-indigo-100 animate-scale-in'>
            <h3 className='text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-900 to-violet-900 bg-clip-text text-transparent flex items-center gap-2'>
              <svg className='w-6 h-6 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
              </svg>
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className='space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Current Password</label>
                <div className='relative'>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className='w-full p-3 border-2 border-indigo-200 rounded-xl pr-12 focus:outline-none focus:border-indigo-500 transition-colors'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>New Password</label>
                <div className='relative'>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className='w-full p-3 border-2 border-indigo-200 rounded-xl pr-12 focus:outline-none focus:border-indigo-500 transition-colors'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordData.newPassword && (
                  <div className='mt-3'>
                    <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                      <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }}></div>
                    </div>
                    <p className='text-xs mt-2 font-semibold' style={{color: passwordStrength.color.includes('green') ? '#16a34a' : passwordStrength.color.includes('yellow') ? '#ca8a04' : '#dc2626'}}>{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Confirm New Password</label>
                <input
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors'
                  required
                />
              </div>

              <div className='flex gap-3 pt-4'>
                <button 
                  type='submit' 
                  className='flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all transform hover:scale-105 shadow-lg'
                >
                  Update Password
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  className='px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {showDeleteWarning && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in'>
          <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-red-200 animate-scale-in'>
            <h3 className='text-2xl font-bold text-red-600 mb-4 flex items-center gap-2'>
              <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
              </svg>
              Delete Account?
            </h3>
            <p className='text-gray-700 mb-4 font-medium'>
              This action <strong className='text-red-600'>cannot be undone</strong>. You will lose:
            </p>
            <ul className='list-none text-sm text-gray-600 mb-6 space-y-2'>
              <li className='flex items-center gap-2'>
                <svg className='w-5 h-5 text-red-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
                All your published blogs
              </li>
              <li className='flex items-center gap-2'>
                <svg className='w-5 h-5 text-red-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
                All your draft blogs
              </li>
              <li className='flex items-center gap-2'>
                <svg className='w-5 h-5 text-red-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
                All your comments
              </li>
              <li className='flex items-center gap-2'>
                <svg className='w-5 h-5 text-red-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
                Your account data permanently
              </li>
            </ul>
            <p className='text-gray-700 mb-6 font-semibold'>Are you absolutely sure you want to continue?</p>
            <div className='flex gap-3'>
              <button
                onClick={() => {
                  setShowDeleteWarning(false)
                  setShowDeleteConfirm(true)
                }}
                className='flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg'
              >
                Yes, Continue
              </button>
              <button
                onClick={() => setShowDeleteWarning(false)}
                className='px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Form Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in'>
          <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-red-300 animate-scale-in'>
            <h3 className='text-2xl font-bold text-red-600 mb-4 flex items-center gap-2'>
              <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
              </svg>
              Final Confirmation
            </h3>
            <p className='text-gray-700 mb-6 font-medium'>
              To confirm account deletion, please enter your email and the exact phrase below:
            </p>
            <form onSubmit={handleDeleteAccount} className='space-y-5'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Your Email</label>
                <input
                  type='email'
                  value={deleteData.email}
                  onChange={e => setDeleteData({ ...deleteData, email: e.target.value })}
                  className='w-full p-3 border-2 border-red-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors'
                  placeholder={profile.email}
                  required
                />
              </div>
              
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Type: <span className='font-mono text-red-600 bg-red-50 px-2 py-1 rounded'>yes delete my account with {profile.email}</span>
                </label>
                <input
                  type='text'
                  value={deleteData.confirmation}
                  onChange={e => setDeleteData({ ...deleteData, confirmation: e.target.value })}
                  className='w-full p-3 border-2 border-red-200 rounded-xl font-mono text-sm focus:outline-none focus:border-red-500 transition-colors'
                  required
                />
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='submit'
                  className='flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                  </svg>
                  Delete My Account
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteData({ email: '', confirmation: '' })
                  }}
                  className='px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Profile
