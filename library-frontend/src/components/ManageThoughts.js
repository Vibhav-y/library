import React, { useState, useEffect } from 'react';
import { thoughtAPI } from '../services/api';
import { 
  Lightbulb, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical, 
  Upload,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const ManageThoughts = () => {
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingThought, setEditingThought] = useState(null);
  const [formData, setFormData] = useState({
    thought: '',
    author: ''
  });
  const [bulkText, setBulkText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [todaysThought, setTodaysThought] = useState(null);

  useEffect(() => {
    loadThoughts();
    loadTodaysThought();
  }, []);

  const loadThoughts = async () => {
    try {
      const response = await thoughtAPI.getAllThoughts();
      setThoughts(response);
    } catch (error) {
      console.error('Error loading thoughts:', error);
      setError('Failed to load thoughts');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysThought = async () => {
    try {
      const response = await thoughtAPI.getTodaysThought();
      setTodaysThought(response);
    } catch (error) {
      console.error('Error loading today\'s thought:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.thought.trim()) {
      setError('Thought text is required');
      return;
    }

    try {
      if (editingThought) {
        await thoughtAPI.updateThought(editingThought._id, formData);
        setSuccess('Thought updated successfully');
      } else {
        await thoughtAPI.createThought(formData);
        setSuccess('Thought added successfully');
      }
      
      resetForm();
      loadThoughts();
      loadTodaysThought();
    } catch (error) {
      console.error('Error saving thought:', error);
      setError('Failed to save thought');
    }
  };

  const handleEdit = (thought) => {
    setEditingThought(thought);
    setFormData({
      thought: thought.thought,
      author: thought.author
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this thought?')) return;

    try {
      await thoughtAPI.deleteThought(id);
      setSuccess('Thought deleted successfully');
      loadThoughts();
      loadTodaysThought();
    } catch (error) {
      console.error('Error deleting thought:', error);
      setError('Failed to delete thought');
    }
  };

  const handleToggleActive = async (thought) => {
    try {
      await thoughtAPI.updateThought(thought._id, {
        ...thought,
        isActive: !thought.isActive
      });
      setSuccess(`Thought ${thought.isActive ? 'deactivated' : 'activated'} successfully`);
      loadThoughts();
      loadTodaysThought();
    } catch (error) {
      console.error('Error updating thought:', error);
      setError('Failed to update thought');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      setError('Please enter thoughts to import');
      return;
    }

    try {
      // Parse bulk text - each line is a thought, format: "Thought text" - Author
      const lines = bulkText.split('\n').filter(line => line.trim());
      const thoughtsToImport = lines.map(line => {
        const match = line.match(/^"(.+)"\s*-\s*(.+)$/);
        if (match) {
          return {
            thought: match[1].trim(),
            author: match[2].trim()
          };
        } else {
          return {
            thought: line.trim(),
            author: 'Anonymous'
          };
        }
      });

      await thoughtAPI.bulkImportThoughts(thoughtsToImport);
      setSuccess(`Successfully imported ${thoughtsToImport.length} thoughts`);
      setBulkText('');
      setShowBulkImport(false);
      loadThoughts();
      loadTodaysThought();
    } catch (error) {
      console.error('Error importing thoughts:', error);
      setError('Failed to import thoughts');
    }
  };

  const resetForm = () => {
    setFormData({ thought: '', author: '' });
    setEditingThought(null);
    setShowAddForm(false);
    setError('');
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newThoughts = [...thoughts];
    const draggedThought = newThoughts[dragIndex];
    newThoughts.splice(dragIndex, 1);
    newThoughts.splice(dropIndex, 0, draggedThought);

    // Update order in backend
    const thoughtsWithOrder = newThoughts.map((thought, index) => ({
      id: thought._id,
      order: index + 1
    }));

    try {
      await thoughtAPI.reorderThoughts(thoughtsWithOrder);
      setThoughts(newThoughts);
      setSuccess('Thoughts reordered successfully');
      loadTodaysThought();
    } catch (error) {
      console.error('Error reordering thoughts:', error);
      setError('Failed to reorder thoughts');
      // Reload original order on error
      loadThoughts();
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl"></div>
          <div className="relative px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center shadow-lg mr-3">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Manage Thoughts of the Day
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowBulkImport(!showBulkImport)}
                  className="inline-flex items-center px-3 py-2 bg-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all duration-300"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </button>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Thought
                </button>
              </div>
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

        {/* Today's Thought Preview */}
        {todaysThought && (
          <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 overflow-hidden shadow-2xl rounded-2xl">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative px-6 py-6">
              <div className="flex items-center mb-3">
                <Lightbulb className="h-5 w-5 text-white mr-2" />
                <span className="text-sm font-medium text-white/90 uppercase tracking-wider">Today's Thought</span>
              </div>
              <p className="text-lg text-white font-medium italic mb-2">
                "{todaysThought.thought}"
              </p>
              {todaysThought.author && (
                <p className="text-sm text-white/80">
                  — {todaysThought.author}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bulk Import Form */}
        {showBulkImport && (
          <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
            <div className="relative px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">Bulk Import Thoughts</h4>
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thoughts (one per line)
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={8}
                    className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-yellow-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                    placeholder={`Enter thoughts, one per line. You can use format:
"Thought text" - Author Name
Or just:
Thought text (will use "Anonymous" as author)`}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBulkImport(false)}
                    className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all duration-300 border border-gray-200/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkImport}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                  >
                    Import Thoughts
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
            <div className="relative px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">
                  {editingThought ? 'Edit Thought' : 'Add New Thought'}
                </h4>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="thought" className="block text-sm font-semibold text-gray-700">
                    Thought Text *
                  </label>
                  <textarea
                    id="thought"
                    value={formData.thought}
                    onChange={(e) => setFormData({ ...formData, thought: e.target.value })}
                    required
                    rows={3}
                    className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-yellow-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                    placeholder="Enter an inspiring thought..."
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="author" className="block text-sm font-semibold text-gray-700">
                    Author
                  </label>
                  <input
                    type="text"
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-yellow-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                    placeholder="Author name (optional)"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-all duration-300 border border-gray-200/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    {editingThought ? 'Update Thought' : 'Add Thought'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Thoughts List */}
        <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
          <div className="relative px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-lg font-bold text-gray-900">
                All Thoughts ({thoughts.length})
              </h4>
              <p className="text-sm text-gray-600">
                Drag to reorder • Active thoughts rotate daily
              </p>
            </div>

            {thoughts.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No thoughts added yet</p>
                <p className="text-gray-500 text-sm">Add some inspiring thoughts to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {thoughts.map((thought, index) => (
                  <div
                    key={thought._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`group relative bg-white/60 backdrop-blur-sm rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-move ${
                      thought.isActive ? 'border-white/40' : 'border-gray-300/40 opacity-75'
                    }`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          <GripVertical className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-4">
                              <p className="text-base text-gray-900 font-medium leading-relaxed">
                                "{thought.thought}"
                              </p>
                              {thought.author && (
                                <p className="text-sm text-gray-600 mt-1">
                                  — {thought.author}
                                </p>
                              )}
                              <div className="flex items-center mt-2 space-x-3 text-xs text-gray-500">
                                <span>Order: {thought.order || index + 1}</span>
                                <span>•</span>
                                <span>Created: {new Date(thought.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleActive(thought)}
                                className={`p-2 rounded-lg transition-all duration-200 ${
                                  thought.isActive 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                                title={thought.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {thought.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleEdit(thought)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit thought"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(thought._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete thought"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageThoughts;