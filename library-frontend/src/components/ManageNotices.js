import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Bell, AlertCircle, Users, Calendar, Eye } from 'lucide-react';
import noticeAPI from '../services/noticeAPI';

const ManageNotices = () => {
  const [notices, setNotices] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'tab',
    targetAllUsers: true,
    targetUsers: [],
    priority: 0,
    expiresAt: '',
    isActive: true
  });

  useEffect(() => {
    loadNotices();
    loadUsers();
  }, []);

  const loadNotices = async () => {
    try {
      const data = await noticeAPI.getAllNotices();
      setNotices(data);
    } catch (error) {
      setError('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await noticeAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const noticeData = {
        ...formData,
        targetUsers: formData.targetAllUsers ? [] : formData.targetUsers,
        expiresAt: formData.expiresAt || null
      };

      if (editingNotice) {
        await noticeAPI.updateNotice(editingNotice._id, noticeData);
        setSuccess('Notice updated successfully');
      } else {
        await noticeAPI.createNotice(noticeData);
        setSuccess('Notice created successfully');
      }

      resetForm();
      loadNotices();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save notice');
    }
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      targetAllUsers: notice.targetAllUsers,
      targetUsers: notice.targetUsers.map(u => u._id),
      priority: notice.priority,
      expiresAt: notice.expiresAt ? new Date(notice.expiresAt).toISOString().split('T')[0] : '',
      isActive: notice.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await noticeAPI.deleteNotice(id);
        setSuccess('Notice deleted successfully');
        loadNotices();
      } catch (error) {
        setError('Failed to delete notice');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'tab',
      targetAllUsers: true,
      targetUsers: [],
      priority: 0,
      expiresAt: '',
      isActive: true
    });
    setEditingNotice(null);
    setShowForm(false);
  };

  const handleUserSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      targetUsers: prev.targetUsers.includes(userId)
        ? prev.targetUsers.filter(id => id !== userId)
        : [...prev.targetUsers, userId]
    }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'banner':
        return <AlertCircle className="h-4 w-4" />;
      case 'marquee':
        return <Bell className="h-4 w-4" />;
      case 'tab':
        return <Eye className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      banner: 'bg-red-100 text-red-800',
      marquee: 'bg-yellow-100 text-yellow-800',
      tab: 'bg-blue-100 text-blue-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Manage Notices</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-700">
            Create and manage notices for users. Notices can be displayed as banners, marquees, or in the notices tab.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Notice
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notice Form */}
      {showForm && (
        <div className="mt-6 sm:mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
              {editingNotice ? 'Edit Notice' : 'Create New Notice'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter notice title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="banner">Banner (Top of page)</option>
                    <option value="marquee">Marquee (Scrolling text)</option>
                    <option value="tab">Tab (Notices section)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter notice content"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expires At (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="flex items-center justify-center sm:justify-start">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>

              {/* Target Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Users
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="targetAllUsers"
                      checked={formData.targetAllUsers}
                      onChange={(e) => setFormData({...formData, targetAllUsers: e.target.checked, targetUsers: []})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="targetAllUsers" className="ml-2 block text-sm text-gray-900">
                      All Users
                    </label>
                  </div>

                  {!formData.targetAllUsers && (
                    <div className="border border-gray-300 rounded-md p-3 max-h-32 sm:max-h-40 overflow-y-auto">
                      <p className="text-sm text-gray-600 mb-2">Select specific users:</p>
                      <div className="space-y-1">
                        {users.map(user => (
                          <div key={user._id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`user-${user._id}`}
                              checked={formData.targetUsers.includes(user._id)}
                              onChange={() => handleUserSelection(user._id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                            />
                            <label htmlFor={`user-${user._id}`} className="ml-2 block text-sm text-gray-900 truncate">
                              {user.name || user.email} ({user.role})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingNotice ? 'Update Notice' : 'Create Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notices List */}
      <div className="mt-6 sm:mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {notices.map((notice) => (
              <li key={notice._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(notice.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{notice.title}</p>
                        <p className="text-sm text-gray-500 mt-1" style={{ 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden' 
                        }}>{notice.content}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 ml-3 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(notice.type)}`}>
                        {notice.type}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        notice.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {notice.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 sm:flex sm:justify-between">
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-6">
                      <p className="flex items-center text-xs sm:text-sm text-gray-500">
                        <Users className="flex-shrink-0 mr-1.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        {notice.targetAllUsers ? 'All Users' : `${notice.targetUsers.length} specific users`}
                      </p>
                      {notice.expiresAt && (
                        <p className="flex items-center text-xs sm:text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          Expires: {new Date(notice.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-1 sm:mt-0 flex items-center text-xs sm:text-sm text-gray-500">
                      <p>Priority: {notice.priority}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => handleEdit(notice)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(notice._id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {notices.length === 0 && (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notices</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new notice.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageNotices; 