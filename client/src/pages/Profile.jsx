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
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    )
  }

  const publishedBlogs = blogs.filter(b => b.isPublished && !b.isTakenDown)
  const draftBlogs = blogs.filter(b => !b.isPublished && !b.isTakenDown)
  const takenDownBlogs = blogs.filter(b => b.isTakenDown)

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      
      <div className='max-w-6xl mx-auto px-4 py-12 mt-16'>
        {/* Profile Header */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
          <div className='flex items-center gap-4 mb-6'>
            <img src={assets.user_icon} className='w-20 h-20 rounded-full border-2 border-primary' alt='profile' />
            <div>
              <h1 className='text-2xl font-bold text-gray-800'>{profile.fullName}</h1>
              <p className='text-gray-500'>@{profile.username}</p>
              <p className='text-sm text-gray-400'>{profile.email}</p>
            </div>
          </div>

          {/* Profile Info Display/Edit */}
          {!editMode ? (
            <div className='space-y-3'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>Phone</p>
                  <p className='font-medium'>{profile.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Alternate Email</p>
                  <p className='font-medium'>{profile.alternateEmail || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Bio</p>
                <p className='font-medium'>{profile.bio || 'No bio yet'}</p>
              </div>
              <div className='flex gap-3 mt-4'>
                <button onClick={() => setEditMode(true)} className='px-4 py-2 bg-primary text-white rounded hover:opacity-90'>
                  Edit Profile
                </button>
                <button onClick={() => setShowPasswordModal(true)} className='px-4 py-2 border border-gray-300 rounded hover:bg-gray-50'>
                  Change Password
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Full Name</label>
                  <input
                    type='text'
                    value={profileData.fullName}
                    onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                    className='w-full p-2 border rounded'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Phone</label>
                  <input
                    type='tel'
                    value={profileData.phone}
                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    className='w-full p-2 border rounded'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>Alternate Email</label>
                <input
                  type='email'
                  value={profileData.alternateEmail}
                  onChange={e => setProfileData({ ...profileData, alternateEmail: e.target.value })}
                  className='w-full p-2 border rounded'
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>Bio (max 200 characters)</label>
                <textarea
                  value={profileData.bio}
                  onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                  className='w-full p-2 border rounded'
                  rows={3}
                  maxLength={200}
                />
                <p className='text-xs text-gray-400 mt-1'>{profileData.bio.length}/200</p>
              </div>
              <div className='flex gap-3'>
                <button type='submit' className='px-4 py-2 bg-primary text-white rounded hover:opacity-90'>
                  Save Changes
                </button>
                <button type='button' onClick={() => setEditMode(false)} className='px-4 py-2 border border-gray-300 rounded hover:bg-gray-50'>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className='mt-6 pt-6 border-t border-gray-200'>
            <p className='text-sm text-gray-500 mb-2'>Account Information</p>
            <div className='bg-gray-50 p-3 rounded text-sm space-y-1'>
              <p><span className='font-medium'>Username:</span> {profile.username} <span className='text-gray-400'>(cannot be changed)</span></p>
              <p><span className='font-medium'>Primary Email:</span> {profile.email} <span className='text-gray-400'>(cannot be changed)</span></p>
            </div>
          </div>
        </div>

        {/* My Blogs Section */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-6'>
          <h2 className='text-xl font-bold mb-4'>My Blogs</h2>
          
          {/* Published Blogs */}
          <div className='mb-6'>
            <h3 className='text-lg font-semibold mb-3 text-green-600'>Published ({publishedBlogs.length})</h3>
            {publishedBlogs.length === 0 ? (
              <p className='text-gray-400 text-sm'>No published blogs yet</p>
            ) : (
              <div className='space-y-2'>
                {publishedBlogs.map(blog => (
                  <div key={blog._id} className='flex items-center justify-between p-3 border rounded hover:bg-gray-50'>
                    <div className='flex-1'>
                      <p className='font-medium'>{blog.title}</p>
                      <p className='text-xs text-gray-400'>{Moment(blog.createdAt).format('MMM DD, YYYY')}</p>
                    </div>
                    <div className='flex gap-2'>
                      <button onClick={() => navigate(`/blog/${blog._id}`)} className='px-3 py-1 text-sm border rounded hover:bg-gray-100'>
                        View
                      </button>
                      <button onClick={() => handleDeleteBlog(blog._id)} className='px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50'>
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
            <h3 className='text-lg font-semibold mb-3 text-yellow-600'>Drafts ({draftBlogs.length})</h3>
            {draftBlogs.length === 0 ? (
              <p className='text-gray-400 text-sm'>No drafts</p>
            ) : (
              <div className='space-y-2'>
                {draftBlogs.map(blog => (
                  <div key={blog._id} className='flex items-center justify-between p-3 border rounded hover:bg-gray-50'>
                    <div className='flex-1'>
                      <p className='font-medium'>{blog.title}</p>
                      <p className='text-xs text-gray-400'>Created {Moment(blog.createdAt).format('MMM DD, YYYY')}</p>
                    </div>
                    <div className='flex gap-2'>
                      <button onClick={() => handleDeleteBlog(blog._id)} className='px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50'>
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
              <h3 className='text-lg font-semibold mb-3 text-red-600'>Removed by Admin ({takenDownBlogs.length})</h3>
              <div className='space-y-2'>
                {takenDownBlogs.map(blog => (
                  <div key={blog._id} className='p-3 border border-red-200 rounded bg-red-50'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='font-medium text-gray-800'>{blog.title}</p>
                        <p className='text-xs text-gray-500 mt-1'>Removed on {Moment(blog.updatedAt).format('MMM DD, YYYY')}</p>
                        {blog.takedownReason && (
                          <div className='mt-2 p-2 bg-white rounded text-sm'>
                            <p className='font-medium text-red-600'>Reason:</p>
                            <p className='text-gray-700'>{blog.takedownReason}</p>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeleteBlog(blog._id)} className='px-3 py-1 text-sm text-red-600 border border-red-400 rounded hover:bg-red-100'>
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
        <div className='bg-white rounded-xl shadow-sm p-6 border-2 border-red-200'>
          <h2 className='text-xl font-bold text-red-600 mb-2'>Danger Zone</h2>
          <p className='text-sm text-gray-600 mb-4'>Once you delete your account, there is no going back. All your blogs will be permanently removed.</p>
          <button
            onClick={() => setShowDeleteWarning(true)}
            className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-bold mb-4'>Change Password</h3>
            <form onSubmit={handleChangePassword} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>Current Password</label>
                <div className='relative'>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className='w-full p-2 border rounded pr-10'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className='block text-sm font-medium mb-1'>New Password</label>
                <div className='relative'>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className='w-full p-2 border rounded pr-10'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordData.newPassword && (
                  <div className='mt-2'>
                    <div className='h-2 bg-gray-200 rounded overflow-hidden'>
                      <div className={`h-full ${passwordStrength.color} transition-all`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }}></div>
                    </div>
                    <p className='text-xs mt-1 text-gray-600'>{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Confirm New Password</label>
                <input
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className='w-full p-2 border rounded'
                  required
                />
              </div>

              <div className='flex gap-3 pt-2'>
                <button type='submit' className='flex-1 px-4 py-2 bg-primary text-white rounded hover:opacity-90'>
                  Update Password
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  className='px-4 py-2 border rounded hover:bg-gray-50'
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-bold text-red-600 mb-4'>⚠️ Delete Account?</h3>
            <p className='text-gray-700 mb-4'>
              This action <strong>cannot be undone</strong>. You will lose:
            </p>
            <ul className='list-disc list-inside text-sm text-gray-600 mb-6 space-y-1'>
              <li>All your published blogs</li>
              <li>All your draft blogs</li>
              <li>All your comments</li>
              <li>Your account data permanently</li>
            </ul>
            <p className='text-gray-700 mb-6'>Are you absolutely sure you want to continue?</p>
            <div className='flex gap-3'>
              <button
                onClick={() => {
                  setShowDeleteWarning(false)
                  setShowDeleteConfirm(true)
                }}
                className='flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
              >
                Yes, Continue
              </button>
              <button
                onClick={() => setShowDeleteWarning(false)}
                className='px-4 py-2 border rounded hover:bg-gray-50'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Form Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-bold text-red-600 mb-4'>Final Confirmation</h3>
            <p className='text-gray-700 mb-4'>
              To confirm account deletion, please enter your email and the exact phrase below:
            </p>
            <form onSubmit={handleDeleteAccount} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>Your Email</label>
                <input
                  type='email'
                  value={deleteData.email}
                  onChange={e => setDeleteData({ ...deleteData, email: e.target.value })}
                  className='w-full p-2 border rounded'
                  placeholder={profile.email}
                  required
                />
              </div>
              
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Type: <span className='font-mono text-red-600'>yes delete my account with {profile.email}</span>
                </label>
                <input
                  type='text'
                  value={deleteData.confirmation}
                  onChange={e => setDeleteData({ ...deleteData, confirmation: e.target.value })}
                  className='w-full p-2 border rounded font-mono text-sm'
                  required
                />
              </div>

              <div className='flex gap-3 pt-2'>
                <button
                  type='submit'
                  className='flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
                >
                  Delete My Account
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteData({ email: '', confirmation: '' })
                  }}
                  className='px-4 py-2 border rounded hover:bg-gray-50'
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
