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
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-6 py-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center shadow-lg mr-4">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fee Management</h1>
                <p className="mt-2 text-base sm:text-lg text-gray-600">
                  Manage student fees, payments, and generate comprehensive reports
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="group inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 border border-gray-200/50"
            >
              <RefreshCw className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-300" />
              Refresh
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="group relative bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-blue-100/40"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-blue-500/10 rounded-full blur-2xl"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-blue-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900 group-hover:text-blue-600 transition-colors duration-300">₹{stats.totalAmount}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-green-100/40"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400/20 to-green-500/10 rounded-full blur-2xl"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-green-600">Paid</p>
                <p className="text-2xl font-bold text-green-900 group-hover:text-green-600 transition-colors duration-300">₹{stats.paidAmount}</p>
                <p className="text-xs text-green-600 mt-1">{stats.paidCount} records</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="group relative bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 to-red-100/40"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-400/20 to-red-500/10 rounded-full blur-2xl"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-red-600">Unpaid</p>
                <p className="text-2xl font-bold text-red-900 group-hover:text-red-600 transition-colors duration-300">₹{stats.unpaidAmount}</p>
                <p className="text-xs text-red-600 mt-1">{stats.unpaidCount} records</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 to-purple-100/40"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-purple-500/10 rounded-full blur-2xl"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-purple-600">Students</p>
                <p className="text-2xl font-bold text-purple-900 group-hover:text-purple-600 transition-colors duration-300">{students.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 to-gray-100/40"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-400/20 to-gray-500/10 rounded-full blur-2xl"></div>
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors duration-300">{stats.totalCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl border border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center mb-5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg mr-3">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Filters & Search
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Search Student
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Payment Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
              >
                <option value="all">All Students</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.seatNumber ? `Seat ${student.seatNumber}` : 'No seat'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Actions
              </label>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSelectedStudent('all');
                }}
                className="w-full inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all duration-300"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl border border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-green-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center mb-5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-green-600 flex items-center justify-center shadow-lg mr-3">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Fee Records ({filteredFees.length})
            </h3>
          </div>
          
          {filteredFees.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl">
              <table className="min-w-full divide-y divide-white/40">
                <thead className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Month/Year
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Paid Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-white/40">
                  {filteredFees.map((fee, index) => (
                    <tr 
                      key={fee._id} 
                      className="hover:bg-white/80 transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
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