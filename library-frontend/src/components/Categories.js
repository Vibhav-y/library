import React, { useState, useEffect } from 'react';
import { categoryAPI } from '../services/api';
import { FolderOpen, Plus, AlertCircle, CheckCircle, Trash2, ChevronRight, ChevronDown, Image, Upload, X } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    parentCategory: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const [allCategories, tree] = await Promise.all([
        categoryAPI.getAll(),
        categoryAPI.getTree()
      ]);
      setCategories(allCategories);
      setCategoryTree(tree);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      
      // Create preview for image
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
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

    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      if (formData.parentCategory) {
        submitData.append('parentCategory', formData.parentCategory);
      }
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await categoryAPI.create(submitData);
      setSuccess('Category created successfully');
      setFormData({ name: '', parentCategory: '', image: null });
      setImagePreview(null);
      setShowAddForm(false);
      loadCategories();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      try {
        await categoryAPI.delete(categoryId);
        setSuccess('Category deleted successfully');
        loadCategories();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setFormData({ name: '', parentCategory: '', image: null });
    setImagePreview(null);
    setError('');
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map((category, index) => (
      <div key={category._id} className="mb-3">
        <div 
          className="group relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          style={{ 
            marginLeft: level * 32,
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent rounded-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {category.subcategories && category.subcategories.length > 0 && (
                <button
                  onClick={() => toggleExpanded(category._id)}
                  className="p-2 rounded-xl bg-white/80 backdrop-blur-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 hover:scale-110 transition-all duration-300 shadow-lg"
                >
                  {expandedCategories.has(category._id) ? 
                    <ChevronDown size={18} /> : 
                    <ChevronRight size={18} />
                  }
                </button>
              )}
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                level === 0 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                  : level === 1 
                    ? 'bg-gradient-to-br from-green-500 to-green-600' 
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
              }`}>
                {category.imagePublicUrl ? (
                  <img 
                    src={category.imagePublicUrl} 
                    alt={category.name}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                ) : (
                  <FolderOpen size={20} className="text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {category.name}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold shadow-sm ${
                    level === 0 
                      ? 'bg-blue-100/80 text-blue-800' 
                      : level === 1 
                        ? 'bg-green-100/80 text-green-800' 
                        : 'bg-purple-100/80 text-purple-800'
                  }`}>
                    Level {category.level || 0}
                  </span>
                </div>
                {category.path && (
                  <p className="text-sm text-gray-600 mb-1">
                    Path: <span className="font-medium">{category.path}</span>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {category.subcategories?.length || 0} subcategories
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {category.level < 2 && (
                <button
                  onClick={() => {
                    setFormData({ name: '', parentCategory: category._id, image: null });
                    setImagePreview(null);
                    setShowAddForm(true);
                  }}
                  className="inline-flex items-center px-3 py-2 bg-blue-50/80 backdrop-blur-sm text-blue-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300"
                  title="Add subcategory"
                >
                  <Plus size={16} />
                </button>
              )}
              <button
                onClick={() => handleDelete(category._id, category.name)}
                className="inline-flex items-center px-3 py-2 bg-red-50/80 backdrop-blur-sm text-red-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-300"
                title="Delete category"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
        {category.subcategories && 
         category.subcategories.length > 0 && 
         expandedCategories.has(category._id) && (
          <div className="mt-4">
            {renderCategoryTree(category.subcategories, level + 1)}
          </div>
        )}
      </div>
    ));
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
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Category Management
                </h3>
                <p className="mt-2 text-base sm:text-lg text-gray-600">
                  Create and manage document categories with hierarchical structure and unlimited levels.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFormData({ name: '', parentCategory: '', image: null });
                setImagePreview(null);
                setShowAddForm(true);
              }}
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all duration-300"
            >
              <Plus className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
              Add Category
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

      {/* Add Form */}
      {showAddForm && (
        <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-green-400/10 rounded-full blur-3xl"></div>
          <div className="relative px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center mb-5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-600 to-green-600 flex items-center justify-center shadow-lg mr-3">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {formData.parentCategory ? 'Add Subcategory' : 'Add New Category'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="categoryName" className="block text-sm font-semibold text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  id="categoryName"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
                  placeholder="Enter category name"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="parentCategory" className="block text-sm font-semibold text-gray-700">
                  Parent Category (Optional)
                </label>
                <select
                  id="parentCategory"
                  name="parentCategory"
                  value={formData.parentCategory}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 text-sm border-0 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all duration-300"
                >
                  <option value="">-- Root Category --</option>
                  {categories
                    .filter(cat => cat.level < 2) // Limit to 3 levels
                    .map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.path ? `${category.path}/${category.name}` : category.name}
                        {' (Level ' + category.level + ')'}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-600 bg-amber-50/80 px-2 py-1 rounded-lg">
                  Maximum 3 levels of nesting allowed
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryImage" className="block text-sm font-semibold text-gray-700">
                  Category Image (Optional)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    id="categoryImage"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="block w-full text-sm text-gray-700 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 border-0 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all duration-300"
                  />
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-16 w-16 rounded-xl object-cover border-2 border-white shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 hover:scale-110 transition-all duration-300 shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-600 bg-blue-50/80 px-2 py-1 rounded-lg">
                    PNG, JPG, GIF up to 5MB. Images will be displayed next to category names in the tree view.
                  </p>
                </div>
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
                  className="group px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">{formData.parentCategory ? 'Add Subcategory' : 'Add Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Tree */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl border border-white/30">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-6 py-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center shadow-lg mr-4">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Category Hierarchy
              </h3>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-3"></div>
              <span className="text-base font-semibold text-gray-700">
                Total: {categories.length} categories
              </span>
            </div>
          </div>
          
          {categoryTree.length > 0 ? (
            <div className="space-y-4">
              {renderCategoryTree(categoryTree)}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-20 w-20 mx-auto rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-lg">
                <FolderOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No categories yet</h3>
              <p className="text-base text-gray-600 max-w-md mx-auto">
                Get started by creating your first category to organize your documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories; 