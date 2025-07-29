import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  MapPin,
  Edit3,
  Save,
  X
} from 'lucide-react';

const FeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [editingFee, setEditingFee] = useState(null);
  const [editData, setEditData] = useState({ amount: '', notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feesData, studentsData] = await Promise.all([
        userAPI.getAllFees(),
        userAPI.getAll()
      ]);
      setFees(feesData);
      setStudents(studentsData.filter(user => user.role === 'student'));
    } catch (error) {
      setError('Failed to load fee data');
      console.error('Fee data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (feeId, paid) => {
    setUpdating(prev => ({ ...prev, [feeId]: true }));
    try {
      await userAPI.updateFee(feeId, { paid });
      setFees(prev => prev.map(fee => 
        fee._id === feeId 
          ? { ...fee, paid, paidDate: paid ? new Date() : null }
          : fee
      ));
      setSuccess(`Fee marked as ${paid ? 'paid' : 'unpaid'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update fee status');
    } finally {
      setUpdating(prev => ({ ...prev, [feeId]: false }));
    }
  };

  const handleEditFee = (fee) => {
    setEditingFee(fee._id);
    setEditData({
      amount: fee.amount.toString(),
      notes: fee.notes || ''
    });
  };

  const handleSaveEdit = async (feeId) => {
    try {
      await userAPI.updateFee(feeId, {
        amount: Number(editData.amount),
        notes: editData.notes
      });
      setFees(prev => prev.map(fee => 
        fee._id === feeId 
          ? { ...fee, amount: Number(editData.amount), notes: editData.notes }
          : fee
      ));
      setEditingFee(null);
      setSuccess('Fee updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update fee');
    }
  };

  const handleCancelEdit = () => {
    setEditingFee(null);
    setEditData({ amount: '', notes: '' });
  };

  const generateFeesForStudent = async (studentId) => {
    try {
      await userAPI.generateFees(studentId, 1000);
      await loadData();
      setSuccess('Fees generated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate fees');
    }
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fee.student?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'paid' && fee.paid) ||
                         (filterStatus === 'unpaid' && !fee.paid);
    const matchesStudent = selectedStudent === 'all' || fee.student?._id === selectedStudent;
    
    return matchesSearch && matchesStatus && matchesStudent;
  });

  const getStats = () => {
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees.filter(fee => fee.paid).reduce((sum, fee) => sum + fee.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    const paidCount = fees.filter(fee => fee.paid).length;
    const unpaidCount = fees.filter(fee => !fee.paid).length;

    return { totalAmount, paidAmount, unpaidAmount, paidCount, unpaidCount, totalCount: fees.length };
  };

  const stats = getStats();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthYear = (month, year) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[month - 1]} ${year}`;
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
              <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage student fees, payments, and generate reports
              </p>
            </div>
            <button
              onClick={loadData}
              className="btn-secondary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Amount</p>
              <p className="text-xl font-bold text-blue-900">₹{stats.totalAmount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Paid</p>
              <p className="text-xl font-bold text-green-900">₹{stats.paidAmount}</p>
              <p className="text-xs text-green-600">{stats.paidCount} records</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Unpaid</p>
              <p className="text-xl font-bold text-red-900">₹{stats.unpaidAmount}</p>
              <p className="text-xs text-red-600">{stats.unpaidCount} records</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Students</p>
              <p className="text-xl font-bold text-purple-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Student
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Students</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.seatNumber ? `Seat ${student.seatNumber}` : 'No seat'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actions
              </label>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSelectedStudent('all');
                }}
                className="w-full btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Fee Records ({filteredFees.length})
          </h3>
          
          {filteredFees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month/Year
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFees.map((fee) => (
                    <tr key={fee._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {fee.student?.profilePictureUrl ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={fee.student.profilePictureUrl}
                                alt={fee.student.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {fee.student?.name || 'Unknown Student'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              {fee.student?.email}
                              {fee.student?.seatNumber && (
                                <>
                                  <MapPin className="h-3 w-3 ml-2 mr-1" />
                                  Seat {fee.student.seatNumber}
                                </>
                              )}
                              {fee.student?.slot && (
                                <>
                                  <Clock className="h-3 w-3 ml-2 mr-1" />
                                  {fee.student.slot.charAt(0).toUpperCase() + fee.student.slot.slice(1)}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getMonthYear(fee.month, fee.year)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingFee === fee._id ? (
                          <input
                            type="number"
                            value={editData.amount}
                            onChange={(e) => setEditData(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          `₹${fee.amount}`
                        )}
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
                        {formatDate(fee.paidDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {editingFee === fee._id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(fee._id)}
                                className="btn-success btn-sm"
                                title="Save changes"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn-secondary btn-sm"
                                title="Cancel editing"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditFee(fee)}
                                className="btn-secondary btn-sm"
                                title="Edit fee"
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(fee._id, !fee.paid)}
                                disabled={updating[fee._id]}
                                className={`btn-sm ${
                                  fee.paid 
                                    ? 'btn-danger' 
                                    : 'btn-success'
                                }`}
                                title={fee.paid ? 'Mark as unpaid' : 'Mark as paid'}
                              >
                                {updating[fee._id] ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                                    Updating...
                                  </>
                                ) : fee.paid ? (
                                  <>
                                    <X className="h-3 w-3 mr-1" />
                                    Mark Unpaid
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Mark Paid
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No fee records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' || selectedStudent !== 'all'
                  ? 'Try adjusting your filters to see more records.'
                  : 'Fee records will appear here once students are created with join dates.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Student List for Fee Generation */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Generate Missing Fees
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Generate fee records for students who don't have all their monthly fees created yet.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.filter(student => student.dateJoinedLibrary).map(student => (
              <div key={student._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      {student.profilePictureUrl ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={student.profilePictureUrl}
                          alt={student.name}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">
                        Joined: {formatDate(student.dateJoinedLibrary)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => generateFeesForStudent(student._id)}
                    className="btn-primary btn-sm"
                  >
                    Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {students.filter(student => student.dateJoinedLibrary).length === 0 && (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students with join dates</h3>
              <p className="mt-1 text-sm text-gray-500">
                Students need to have a library join date set to generate fees.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeManagement; 