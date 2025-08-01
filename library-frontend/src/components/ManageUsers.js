import React, { useState, useEffect, useRef } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Edit, Trash2, Calendar, AlertCircle, CheckCircle, Shield, User as UserIcon, Users, Camera, Clock, MapPin, X } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    terminationDate: '',
    dob: '',
    dateJoinedLibrary: '',
    slot: '',
    seatNumber: '',
    phone: '',
    profilePicture: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user: currentUser, isAdminOrManager, isSuperAdmin } = useAuth();
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setError('Password is required');
      return;
    }

    // Check if non-superadmin is trying to create admin accounts
    if ((formData.role === 'admin' || formData.role === 'superadmin') && currentUser.role !== 'superadmin') {
      setError('Only superadmins can create admin accounts');
      return;
    }

    // Check if manager is trying to create non-student accounts
    if (currentUser.role === 'manager' && formData.role !== 'student') {
      setError('Managers can only create student accounts');
      return;
    }

    try {
      if (editingUser) {
        // Update user (superadmin can edit all fields, others only termination)
        if (currentUser.role === 'superadmin') {
          const updateData = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            terminationDate: formData.terminationDate,
            phone: formData.phone
          };
          
          // Only include password if it's provided
          if (formData.password.trim()) {
            updateData.password = formData.password;
          }
          
          await userAPI.update(editingUser._id, updateData);
        } else {
          // Regular admins can only update termination date
          await userAPI.updateTermination(editingUser._id, formData.terminationDate);
        }
        setSuccess('User updated successfully');
      } else {
        // Create new user with FormData
        const submitData = new FormData();
        submitData.append('name', formData.name.trim());
        submitData.append('email', formData.email.trim());
        submitData.append('password', formData.password.trim());
        submitData.append('role', formData.role);
        if (formData.terminationDate) submitData.append('terminationDate', formData.terminationDate);
        
        // Add student-specific fields if role is student
        if (formData.role === 'student') {
          if (formData.dob) submitData.append('dob', formData.dob);
          if (formData.dateJoinedLibrary) submitData.append('dateJoinedLibrary', formData.dateJoinedLibrary);
          if (formData.slot) submitData.append('slot', formData.slot);
          if (formData.seatNumber) submitData.append('seatNumber', formData.seatNumber);
          if (formData.phone) submitData.append('phone', formData.phone);
          if (formData.profilePicture) submitData.append('profilePicture', formData.profilePicture);
        }
        
        await userAPI.create(submitData);
        setSuccess('User created successfully');
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        terminationDate: '',
        dob: '',
        dateJoinedLibrary: '',
        slot: '',
        seatNumber: '',
        phone: '',
        profilePicture: null
      });
      setImagePreview(null);
      setShowAddForm(false);
      setEditingUser(null);
      loadUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
      terminationDate: user.terminationDate ? 
        new Date(user.terminationDate).toISOString().split('T')[0] : '',
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      dateJoinedLibrary: user.dateJoinedLibrary ? 
        new Date(user.dateJoinedLibrary).toISOString().split('T')[0] : '',
      slot: user.slot || '',
      seatNumber: user.seatNumber || '',
      phone: user.phone || '',
      profilePicture: null
    });
    setShowAddForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(userId);
        setSuccess('User deleted successfully');
        loadUsers();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      terminationDate: '',
      dob: '',
      dateJoinedLibrary: '',
      slot: '',
      seatNumber: '',
      phone: '',
      profilePicture: null
    });
    setImagePreview(null);
    setError('');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      superadmin: 'bg-red-100 text-red-800',
      admin: 'bg-blue-100 text-blue-800',
      manager: 'bg-purple-100 text-purple-800',
      student: 'bg-green-100 text-green-800'
    };
    return badges[role] || badges.student;
  };

  const isAccountExpired = (terminationDate) => {
    if (!terminationDate) return false;
    const currentDate = new Date();
    const termDate = new Date(terminationDate);
    termDate.setHours(23, 59, 59, 999);
    return currentDate > termDate;
  };

  const canEditUser = (user) => {
    if (currentUser.role === 'manager') return false; // Managers cannot edit users
    if (currentUser.role === 'superadmin') return true;
    return user.role === 'student';
  };

  const canDeleteUser = (user) => {
    if (user._id === currentUser.id) return false; // Can't delete self
    if (currentUser.role === 'manager') return false; // Managers cannot delete users
    if (currentUser.role === 'superadmin') return true;
    return user.role === 'student';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-6 py-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  User Management
                </h3>
                <p className="mt-2 text-base sm:text-lg text-gray-600">
                  Add, edit, and manage user accounts with role-based permissions.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
            >
              <UserPlus className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="relative bg-green-50/80 backdrop-blur-sm border border-green-200/60 rounded-2xl p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50/90 to-green-100/60 rounded-2xl"></div>
          <div className="relative flex items-center">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg mr-4">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <p className="text-base font-semibold text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="relative bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl p-6 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/90 to-red-100/60 rounded-2xl"></div>
          <div className="relative flex items-center">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg mr-4">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <p className="text-base font-semibold text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
          <div className="relative px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center mb-5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg mr-3">
                {editingUser ? <Edit className="h-4 w-4 text-white" /> : <UserPlus className="h-4 w-4 text-white" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={editingUser && currentUser.role !== 'superadmin'}
                  required
                  className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400 disabled:bg-gray-100/80 disabled:cursor-not-allowed"
                  placeholder="user@example.com"
                />
              </div>

              {(!editingUser || (editingUser && currentUser.role === 'superadmin')) && (
                <>
                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                    />
                    {editingUser && currentUser.role === 'superadmin' && (
                      <p className="text-xs text-gray-600 bg-blue-50/80 px-2 py-1 rounded-lg">
                        Leave blank to keep the current password, or enter a new password to change it.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                    >
                      <option value="student">Student</option>
                      {currentUser.role === 'superadmin' && (
                        <>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </>
                      )}
                    </select>
                    {currentUser.role !== 'superadmin' && (
                      <p className="text-xs text-gray-600 bg-amber-50/80 px-2 py-1 rounded-lg">
                        Only superadmins can create admin accounts
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                      placeholder="Enter phone number"
                    />
                  </div>
                </>
              )}

              {/* Student-specific fields */}
              {(!editingUser || (editingUser && currentUser.role === 'superadmin')) && formData.role === 'student' && (
                <>
                  <div className="col-span-2">
                    <div className="border-t border-gray-200/50 pt-3 mb-3">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center">
                        <div className="h-2 w-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-3"></div>
                        Student Information
                      </h4>
                    </div>
                  </div>

                  {/* Profile Picture */}
                  <div className="col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Profile Picture (Optional)
                    </label>
                    <div className="flex items-center space-x-6">
                      <div className="h-20 w-20 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg border border-white/40">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-10 w-10 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          name="profilePicture"
                          accept="image/*"
                          onChange={handleInputChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-3 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 border border-gray-200/50"
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Choose Photo
                        </button>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, profilePicture: null }));
                            }}
                            className="ml-3 inline-flex items-center px-3 py-2 bg-red-50/80 backdrop-blur-sm text-red-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-300"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50/80 px-3 py-2 rounded-xl">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dob" className="block text-base font-semibold text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 text-base border-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dateJoinedLibrary" className="block text-base font-semibold text-gray-700">
                      Date Joined Library
                    </label>
                    <input
                      type="date"
                      id="dateJoinedLibrary"
                      name="dateJoinedLibrary"
                      value={formData.dateJoinedLibrary}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 text-base border-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                    />
                    <p className="text-sm text-gray-600 bg-blue-50/80 px-3 py-2 rounded-xl">
                      Used to generate monthly fee records
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="slot" className="block text-base font-semibold text-gray-700">
                      Time Slot
                    </label>
                    <select
                      id="slot"
                      name="slot"
                      value={formData.slot}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 text-base border-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                    >
                      <option value="">Select slot</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="full-day">Full Day</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="seatNumber" className="block text-base font-semibold text-gray-700">
                      Seat Number
                    </label>
                    <input
                      type="number"
                      id="seatNumber"
                      name="seatNumber"
                      value={formData.seatNumber}
                      onChange={handleInputChange}
                      min="1"
                      max="38"
                      className="block w-full px-4 py-3 text-base border-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                      placeholder="1-38"
                    />
                    <p className="text-sm text-gray-600 bg-amber-50/80 px-3 py-2 rounded-xl">
                      Seat numbers range from 1 to 38
                    </p>
                  </div>
                 </>
               )}

              <div className="space-y-1">
                <label htmlFor="terminationDate" className="block text-sm font-semibold text-gray-700">
                  Termination Date (Optional)
                </label>
                <input
                  type="date"
                  id="terminationDate"
                  name="terminationDate"
                  value={formData.terminationDate}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                />
                <p className="text-xs text-gray-600 bg-gray-50/80 px-2 py-1 rounded-lg">
                  Leave empty for no expiration date
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all duration-300 border border-gray-200/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="group px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">{editingUser ? 'Update User' : 'Add User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl border border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-6 py-8 sm:p-10">
          <div className="flex items-center mb-8">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center shadow-lg mr-4">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Current Users
            </h3>
          </div>
          {users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user, index) => (
                <div 
                  key={user._id} 
                  className="group relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent rounded-2xl"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <span className="text-base font-bold text-white">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                            {user.name || user.email}
                          </p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-sm ${getRoleBadge(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-2 capitalize">{user.role}</span>
                          </span>
                          {user.terminationDate && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-sm ${
                              isAccountExpired(user.terminationDate) 
                                ? 'bg-red-100/80 text-red-800' 
                                : 'bg-yellow-100/80 text-yellow-800'
                            }`}>
                              <Calendar className="mr-2 h-4 w-4" />
                              {isAccountExpired(user.terminationDate) ? 'Expired: ' : 'Expires: '}
                              {new Date(user.terminationDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-base text-gray-600">
                          {user.email} • Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {canEditUser(user) && (
                        <button
                          onClick={() => handleEdit(user)}
                          className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 border border-gray-200/50"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </button>
                      )}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="inline-flex items-center px-4 py-2 bg-red-50/80 backdrop-blur-sm text-red-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-300"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-lg">
                <UserPlus className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No users yet</h3>
              <p className="text-base text-gray-600 max-w-md mx-auto">
                Get started by adding your first user account to the system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;