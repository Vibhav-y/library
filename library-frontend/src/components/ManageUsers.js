import React, { useState, useEffect, useRef } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Edit, Trash2, Calendar, AlertCircle, CheckCircle, Shield, User as UserIcon, Camera, Clock, MapPin, X } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Management
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add, edit, and manage user accounts.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="user@example.com"
                />
              </div>

              {(!editingUser || (editingUser && currentUser.role === 'superadmin')) && (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                    />
                    {editingUser && currentUser.role === 'superadmin' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Leave blank to keep the current password, or enter a new password to change it.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                      <p className="mt-1 text-xs text-gray-500">
                        Only superadmins can create admin accounts
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>
                </>
              )}

              {/* Student-specific fields */}
              {(!editingUser || (editingUser && currentUser.role === 'superadmin')) && formData.role === 'student' && (
                <>
                  <div className="col-span-2">
                    <h4 className="text-md font-medium text-gray-900 mb-4 border-t pt-4">
                      Student Information
                    </h4>
                  </div>

                  {/* Profile Picture */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture (Optional)
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-8 w-8 text-gray-400" />
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
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Choose Photo
                        </button>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, profilePicture: null }));
                            }}
                            className="ml-2 inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>

                  <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="dateJoinedLibrary" className="block text-sm font-medium text-gray-700">
                      Date Joined Library
                    </label>
                    <input
                      type="date"
                      id="dateJoinedLibrary"
                      name="dateJoinedLibrary"
                      value={formData.dateJoinedLibrary}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used to generate monthly fee records
                    </p>
                  </div>

                  <div>
                    <label htmlFor="slot" className="block text-sm font-medium text-gray-700">
                      Time Slot
                    </label>
                    <select
                      id="slot"
                      name="slot"
                      value={formData.slot}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select slot</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="full-day">Full Day</option>
                    </select>
                  </div>

                                     <div>
                     <label htmlFor="seatNumber" className="block text-sm font-medium text-gray-700">
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
                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                       placeholder="1-38"
                     />
                     <p className="mt-1 text-xs text-gray-500">
                       Seat numbers range from 1 to 38
                     </p>
                   </div>

                   <div>
                     <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                       Phone Number
                     </label>
                     <input
                       type="tel"
                       id="phone"
                       name="phone"
                       value={formData.phone}
                       onChange={handleInputChange}
                       className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                       placeholder="Enter phone number"
                     />
                   </div>
                 </>
               )}

              <div>
                <label htmlFor="terminationDate" className="block text-sm font-medium text-gray-700">
                  Termination Date (Optional)
                </label>
                <input
                  type="date"
                  id="terminationDate"
                  name="terminationDate"
                  value={formData.terminationDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for no expiration date
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Current Users
          </h3>
          {users.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user._id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {user.name || user.email}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">{user.role}</span>
                          </span>
                          {user.terminationDate && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isAccountExpired(user.terminationDate) 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              <Calendar className="mr-1 h-3 w-3" />
                              {isAccountExpired(user.terminationDate) ? 'Expired: ' : 'Expires: '}
                              {new Date(user.terminationDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {user.email} • Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canEditUser(user) && (
                        <button
                          onClick={() => handleEdit(user)}
                          className="btn-secondary"
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </button>
                      )}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="btn-danger"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new user account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;