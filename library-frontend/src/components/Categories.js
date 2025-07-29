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
    return categories.map((category) => (
      <div key={category._id} className="mb-2">
        <div 
          className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors bg-white`}
          style={{ marginLeft: level * 24 }}
        >
          <div className="flex items-center gap-3">
            {category.subcategories && category.subcategories.length > 0 && (
              <button
                onClick={() => toggleExpanded(category._id)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {expandedCategories.has(category._id) ? 
                  <ChevronDown size={16} /> : 
                  <ChevronRight size={16} />
                }
              </button>
            )}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              level === 0 ? 'bg-blue-100' : level === 1 ? 'bg-green-100' : 'bg-purple-100'
            }`}>
              {category.imagePublicUrl ? (
                <img 
                  src={category.imagePublicUrl} 
                  alt={category.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <FolderOpen size={16} className={`${
                  level === 0 ? 'text-blue-600' : level === 1 ? 'text-green-600' : 'text-purple-600'
                }`} />
              )}
            </div>
            <div>
              <span className="font-medium text-gray-900">{category.name}</span>
              {category.path && (
                <div className="text-xs text-gray-500 mt-1">
                  Path: {category.path}
                </div>
              )}
              <div className="text-xs text-gray-400">
                Level {category.level || 0}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {category.level < 2 && (
              <button
                onClick={() => {
                  setFormData({ name: '', parentCategory: category._id, image: null });
                  setImagePreview(null);
                  setShowAddForm(true);
                }}
                className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                title="Add subcategory"
              >
                <Plus size={16} />
              </button>
            )}
            <button
              onClick={() => handleDelete(category._id, category.name)}
              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
              title="Delete category"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {category.subcategories && 
         category.subcategories.length > 0 && 
         expandedCategories.has(category._id) && (
          <div className="mt-2">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Category Management
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage document categories with hierarchical structure.
              </p>
            </div>
            <button
              onClick={() => {
                setFormData({ name: '', parentCategory: '', image: null });
                setImagePreview(null);
                setShowAddForm(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
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

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {formData.parentCategory ? 'Add Subcategory' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  id="categoryName"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700">
                  Parent Category (Optional)
                </label>
                <select
                  id="parentCategory"
                  name="parentCategory"
                  value={formData.parentCategory}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 3 levels of nesting allowed
                </p>
              </div>

              <div>
                <label htmlFor="categoryImage" className="block text-sm font-medium text-gray-700">
                  Category Image (Optional)
                </label>
                <div className="mt-1 space-y-3">
                  <input
                    type="file"
                    id="categoryImage"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-16 w-16 rounded-md object-cover border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB. Images will be displayed next to category names.
                  </p>
                </div>
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
                  {formData.parentCategory ? 'Add Subcategory' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Tree */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Category Hierarchy
            </h3>
            <div className="text-sm text-gray-500">
              Total: {categories.length} categories
            </div>
          </div>
          
          {categoryTree.length > 0 ? (
            <div className="space-y-2">
              {renderCategoryTree(categoryTree)}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first category.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories; 