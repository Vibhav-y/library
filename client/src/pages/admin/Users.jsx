import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const Users = () => {
  const { axios } = useAppContext()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/admin/users')
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async (userId, username) => {
    if (!confirm(`Are you sure you want to promote ${username} to admin?`)) return
    
    try {
      const { data } = await axios.post('/api/admin/promote-admin', { userId })
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to promote user')
    }
  }

  const handleDemote = async (userId, username) => {
    if (!confirm(`Are you sure you want to demote ${username} to regular user?`)) return
    
    try {
      const { data } = await axios.post('/api/admin/demote-admin', { userId })
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to demote user')
    }
  }

  const handleDelete = async (userId, username) => {
    const confirmation = prompt(
      `WARNING: This will permanently delete ${username} and ALL their content (blogs, comments, etc.).\n\nType "DELETE ${username}" to confirm:`
    )
    
    if (confirmation !== `DELETE ${username}`) {
      toast.error('Deletion cancelled or incorrect confirmation')
      return
    }
    
    try {
      const { data } = await axios.post('/api/admin/delete-user', { userId })
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    
    try {
      const { data } = await axios.post('/api/admin/create-admin', formData)
      if (data.success) {
        toast.success(data.message)
        setShowCreateModal(false)
        setFormData({ username: '', email: '', password: '', fullName: '' })
        fetchUsers()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800'>User Management</h1>
          <p className='text-gray-600 mt-1'>Manage users, admins, and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className='px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
          </svg>
          Create Admin
        </button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6'>
          <h3 className='text-sm font-semibold text-blue-700 mb-2'>Total Users</h3>
          <p className='text-3xl font-bold text-blue-900'>{users.length}</p>
        </div>
        <div className='bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6'>
          <h3 className='text-sm font-semibold text-purple-700 mb-2'>Admins</h3>
          <p className='text-3xl font-bold text-purple-900'>{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className='bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6'>
          <h3 className='text-sm font-semibold text-green-700 mb-2'>Regular Users</h3>
          <p className='text-3xl font-bold text-green-900'>{users.filter(u => u.role === 'user').length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <input
              type='text'
              placeholder='Search by username, email, or name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors'
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className='px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors'
          >
            <option value='all'>All Roles</option>
            <option value='admin'>Admins</option>
            <option value='user'>Users</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  User
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Contact
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Role
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Activity
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Joined
                </th>
                <th className='px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan='6' className='px-6 py-12 text-center text-gray-500'>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className='hover:bg-gray-50 transition-colors'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold'>
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>{user.username}</p>
                          <p className='text-sm text-gray-500'>{user.fullName}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <p className='text-sm text-gray-900'>{user.email}</p>
                      {user.phone && (
                        <p className='text-xs text-gray-500'>{user.phone}</p>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? (
                          <>
                            <svg className='w-4 h-4 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                              <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                            </svg>
                            Admin
                          </>
                        ) : 'User'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm'>
                        <p className='text-gray-900'>{user.blogCount || 0} blogs</p>
                        <p className='text-gray-500'>{user.commentCount || 0} comments</p>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center gap-2'>
                        {user.role === 'admin' ? (
                          <button
                            onClick={() => handleDemote(user._id, user.username)}
                            className='px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-colors'
                            title='Demote to User'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 13l-7 7-7-7m14-8l-7 7-7-7' />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromote(user._id, user.username)}
                            className='px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors'
                            title='Promote to Admin'
                          >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 11l7-7 7 7M5 19l7-7 7 7' />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          className='px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors'
                          title='Delete User'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-800'>Create Admin User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className='space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Username *</label>
                <input
                  type='text'
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className='w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Full Name *</label>
                <input
                  type='text'
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className='w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Email *</label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className='w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Password *</label>
                <input
                  type='password'
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className='w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors'
                  required
                  minLength={6}
                />
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setShowCreateModal(false)}
                  className='flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg'
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
