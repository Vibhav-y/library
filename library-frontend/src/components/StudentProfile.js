import React, { useState, useEffect, useRef } from 'react';
import { userAPI } from '../services/api';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const StudentProfile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    slot: '',
    seatNumber: '',
    phone: '',
    profilePicture: null
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileData, feesData] = await Promise.all([
        userAPI.getProfile(user.id),
        userAPI.getStudentFees(user.id)
      ]);
      
      setProfile(profileData);
      setFees(feesData);
      
      // Initialize form data
      setFormData({
        name: profileData.name || '',
        dob: profileData.dob ? new Date(profileData.dob).toISOString().split('T')[0] : '',
        slot: profileData.slot || '',
        seatNumber: profileData.seatNumber || '',
        phone: profileData.phone || '',
        profilePicture: null
      });
    } catch (error) {
      setError('Failed to load profile data');
      console.error('Profile load error:', error);
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
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      if (formData.dob) submitData.append('dob', formData.dob);
      if (formData.slot) submitData.append('slot', formData.slot);
      if (formData.seatNumber) submitData.append('seatNumber', formData.seatNumber);
      if (formData.phone) submitData.append('phone', formData.phone);
      if (formData.profilePicture) submitData.append('profilePicture', formData.profilePicture);

      const response = await userAPI.updateProfile(user.id, submitData);
      setProfile(response.user);
      setEditing(false);
      setImagePreview(null);
      setSuccess('Profile updated successfully');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setImagePreview(null);
    setFormData({
      name: profile.name || '',
      dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
      slot: profile.slot || '',
      seatNumber: profile.seatNumber || '',
      phone: profile.phone || '',
      profilePicture: null
    });
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  };

  const getSlotDisplay = (slot) => {
    if (!slot) return 'Not assigned';
    return slot.charAt(0).toUpperCase() + slot.slice(1).replace('-', ' ');
  };

  const getTotalAmount = () => {
    return fees.reduce((total, fee) => total + fee.amount, 0);
  };

  const getPaidAmount = () => {
    return fees.filter(fee => fee.paid).reduce((total, fee) => total + fee.amount, 0);
  };

  const getUnpaidAmount = () => {
    return fees.filter(fee => !fee.paid).reduce((total, fee) => total + fee.amount, 0);
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
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div className="text-sm text-red-500">
              Contact an administrator to update your profile information
            </div>
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

      {/* Profile Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Personal Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {imagePreview || profile?.profilePictureUrl ? (
                    <img
                      src={imagePreview || profile.profilePictureUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                {editing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  name="profilePicture"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Profile Picture
              </p>
            </div>

            {/* Basic Information */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{profile?.name || 'Not set'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-900">{profile?.email}</span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Cannot be changed
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(profile?.dob)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date Joined Library
                  </label>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(profile?.dateJoinedLibrary)}</span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Set by admin
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time Slot
                  </label>
                  <div className="mt-1 flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{getSlotDisplay(profile?.slot)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seat Number
                  </label>
                  <div className="mt-1 flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {profile?.seatNumber ? `Seat ${profile.seatNumber}` : 'Not assigned'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-900">
                      {profile?.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* Fee Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Fee Information
          </h3>
          
          {/* Fee Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-900">₹{getTotalAmount()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-900">₹{getPaidAmount()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-red-900">₹{getUnpaidAmount()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fee History */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Fee History</h4>
            {fees.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fees.map((fee) => (
                      <tr key={fee._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getMonthName(fee.month)} {fee.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{fee.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {fee.paid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fee.paid && fee.paidDate ? formatDate(fee.paidDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No fee records</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fee records will appear here once they are generated by admin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile; 