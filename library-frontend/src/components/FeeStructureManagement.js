import React, { useState, useEffect } from 'react';
import { feeStructureAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  Calendar, 
  Plus,
  Edit3,
  Trash2,
  Eye,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  History,
  TrendingUp
} from 'lucide-react';

const FeeStructureManagement = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [currentStructure, setCurrentStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    effectiveFrom: '',
    applyToFutureFees: true,
    slotFees: [
      { slotType: 'morning', slotName: 'Morning Slot', amount: 800, description: '' },
      { slotType: 'afternoon', slotName: 'Afternoon Slot', amount: 800, description: '' },
      { slotType: 'full-day', slotName: 'Full Day', amount: 1200, description: '' }
    ]
  });

  useEffect(() => {
    loadFeeStructures();
  }, []);

  const loadFeeStructures = async () => {
    try {
      setLoading(true);
      const [structures, current] = await Promise.all([
        feeStructureAPI.getAll(),
        feeStructureAPI.getCurrent().catch(() => null)
      ]);
      setFeeStructures(structures);
      setCurrentStructure(current);
    } catch (error) {
      setError('Failed to load fee structures');
      console.error('Fee structures load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSlotFeeChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      slotFees: prev.slotFees.map((slot, i) => 
        i === index ? { ...slot, [field]: field === 'amount' ? Number(value) : value } : slot
      )
    }));
  };

  const addSlotFee = () => {
    setFormData(prev => ({
      ...prev,
      slotFees: [...prev.slotFees, { 
        slotType: 'custom', 
        slotName: '', 
        amount: 0, 
        description: '' 
      }]
    }));
  };

  const removeSlotFee = (index) => {
    setFormData(prev => ({
      ...prev,
      slotFees: prev.slotFees.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!formData.name.trim()) {
        setError('Structure name is required');
        return;
      }

      if (formData.slotFees.length === 0) {
        setError('At least one slot fee is required');
        return;
      }

      for (const slot of formData.slotFees) {
        if (!slot.slotName.trim() || slot.amount < 0) {
          setError('All slots must have valid names and non-negative amounts');
          return;
        }
      }

      // Set effective date to tomorrow if not specified
      const effectiveDate = formData.effectiveFrom || 
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const submissionData = {
        ...formData,
        effectiveFrom: effectiveDate
      };

      let result;
      if (editingStructure) {
        result = await feeStructureAPI.update(editingStructure._id, submissionData);
      } else {
        result = await feeStructureAPI.create(submissionData);
      }

      setSuccess(
        `Fee structure ${editingStructure ? 'updated' : 'created'} successfully! ` +
        (result.updatedFeesCount ? `${result.updatedFeesCount} existing fees updated.` : '')
      );
      
      resetForm();
      loadFeeStructures();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save fee structure');
    }
  };

  const handleEdit = (structure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      description: structure.description || '',
      effectiveFrom: structure.effectiveFrom ? 
        new Date(structure.effectiveFrom).toISOString().split('T')[0] : '',
      applyToFutureFees: false, // Default to false for edits
      slotFees: structure.slotFees || []
    });
    setShowCreateForm(true);
  };

  const handlePreview = async (structure) => {
    try {
      setError('');
      const preview = await feeStructureAPI.preview(structure._id, {
        effectiveFrom: structure.effectiveFrom
      });
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate preview');
    }
  };

  const handleDeactivate = async (structure) => {
    if (!window.confirm(`Are you sure you want to deactivate "${structure.name}"?`)) {
      return;
    }

    try {
      await feeStructureAPI.deactivate(structure._id);
      setSuccess('Fee structure deactivated successfully');
      loadFeeStructures();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to deactivate fee structure');
    }
  };

  const handleDelete = async (structure) => {
    if (!window.confirm(`Are you sure you want to delete "${structure.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await feeStructureAPI.delete(structure._id);
      setSuccess('Fee structure deleted successfully');
      loadFeeStructures();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete fee structure');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      effectiveFrom: '',
      applyToFutureFees: true,
      slotFees: [
        { slotType: 'morning', slotName: 'Morning Slot', amount: 800, description: '' },
        { slotType: 'afternoon', slotName: 'Afternoon Slot', amount: 800, description: '' },
        { slotType: 'full-day', slotName: 'Full Day', amount: 1200, description: '' }
      ]
    });
    setEditingStructure(null);
    setShowCreateForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (structure) => {
    const now = new Date();
    const effectiveFrom = new Date(structure.effectiveFrom);
    const effectiveTo = structure.effectiveTo ? new Date(structure.effectiveTo) : null;

    if (!structure.isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
    }

    if (effectiveFrom > now) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Scheduled</span>;
    }

    if (effectiveTo && effectiveTo <= now) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>;
    }

    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
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
      <div className="bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center mr-3">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Fee Structure Management</h1>
                <p className="text-sm text-gray-600">Manage slot-based fee rates with effective dates</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Structure
            </button>
          </div>
        </div>

        {/* Current Active Structure */}
        {currentStructure && (
          <div className="px-6 py-4 bg-green-50 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  Currently Active: {currentStructure.name}
                </h3>
                <p className="text-sm text-green-600">
                  Effective from {formatDate(currentStructure.effectiveFrom)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePreview(currentStructure)}
                  className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStructure ? 'Edit Fee Structure' : 'Create New Fee Structure'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Structure Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2024 Updated Rates"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective From *
                </label>
                <input
                  type="date"
                  name="effectiveFrom"
                  value={formData.effectiveFrom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to default to tomorrow
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description of this fee structure"
              />
            </div>

            {/* Slot Fees */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Slot Fee Rates</h4>
                <button
                  type="button"
                  onClick={addSlotFee}
                  className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Custom Slot
                </button>
              </div>

              <div className="space-y-4">
                {formData.slotFees.map((slot, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slot Type
                        </label>
                        <select
                          value={slot.slotType}
                          onChange={(e) => handleSlotFeeChange(index, 'slotType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="full-day">Full Day</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Slot Name *
                        </label>
                        <input
                          type="text"
                          value={slot.slotName}
                          onChange={(e) => handleSlotFeeChange(index, 'slotName', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Display name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount (₹) *
                        </label>
                        <input
                          type="number"
                          value={slot.amount}
                          onChange={(e) => handleSlotFeeChange(index, 'amount', e.target.value)}
                          required
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeSlotFee(index)}
                          className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {slot.slotType === 'custom' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={slot.description || ''}
                          onChange={(e) => handleSlotFeeChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Optional description for custom slot"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="applyToFutureFees"
                  name="applyToFutureFees"
                  checked={formData.applyToFutureFees}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="applyToFutureFees" className="ml-2 text-sm text-gray-700">
                  Apply to existing unpaid fees from effective date
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                This will update all unpaid fees from the effective date with the new rates
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {editingStructure ? 'Update Structure' : 'Create Structure'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fee Structures List */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <History className="h-5 w-5 mr-2" />
            Fee Structure History
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          {feeStructures.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Structure Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slot Rates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeStructures.map((structure) => (
                  <tr key={structure._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {structure.name}
                        </div>
                        {structure.description && (
                          <div className="text-sm text-gray-500">
                            {structure.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(structure)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span>
                          {formatDate(structure.effectiveFrom)}
                          {structure.effectiveTo && ` - ${formatDate(structure.effectiveTo)}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {structure.slotFees.slice(0, 2).map((slot, i) => (
                          <div key={i} className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">{slot.slotName}:</span>
                            <span className="font-medium">₹{slot.amount}</span>
                          </div>
                        ))}
                        {structure.slotFees.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{structure.slotFees.length - 2} more...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePreview(structure)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Preview changes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {currentUser.role === 'admin' || currentUser.role === 'superadmin' ? (
                          <>
                            <button
                              onClick={() => handleEdit(structure)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit structure"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {structure.isActive && (
                              <button
                                onClick={() => handleDeactivate(structure)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Deactivate structure"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            {!structure.isActive && new Date(structure.effectiveFrom) > new Date() && (
                              <button
                                onClick={() => handleDelete(structure)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete structure"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No fee structures</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first fee structure.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Fee Change Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600">Total Fees Affected</div>
                  <div className="text-2xl font-semibold text-blue-900">
                    {previewData.summary.totalFeesAffected}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600">Current Total</div>
                  <div className="text-2xl font-semibold text-green-900">
                    ₹{previewData.summary.totalCurrentAmount}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600">New Total</div>
                  <div className="text-2xl font-semibold text-purple-900">
                    ₹{previewData.summary.totalNewAmount}
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${
                  previewData.summary.totalDifference >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className={`text-sm ${
                    previewData.summary.totalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Net Change
                  </div>
                  <div className={`text-2xl font-semibold ${
                    previewData.summary.totalDifference >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {previewData.summary.totalDifference >= 0 ? '+' : ''}₹{previewData.summary.totalDifference}
                  </div>
                </div>
              </div>

              {/* Detailed Changes */}
              {previewData.preview.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Changes</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month/Year</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.preview.slice(0, 10).map((change, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {change.studentName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {change.month}/{change.year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {change.slotType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{change.currentAmount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{change.newAmount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`${
                                change.difference >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {change.difference >= 0 ? '+' : ''}₹{change.difference}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.preview.length > 10 && (
                      <div className="text-center py-3 text-sm text-gray-500">
                        Showing first 10 of {previewData.preview.length} changes
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructureManagement;
