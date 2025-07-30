import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Plus,
  Save,
  X
} from 'lucide-react';
import { galleryAPI } from '../services/api';

const ManageGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    order: 0,
    file: null
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await galleryAPI.getAllImages();
      setImages(data);
    } catch (error) {
      console.error('Error loading gallery images:', error);
      setError('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.title.trim()) {
      setError('Please provide both image file and title');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('image', uploadForm.file);
      formData.append('title', uploadForm.title.trim());
      formData.append('description', uploadForm.description.trim());
      formData.append('order', uploadForm.order);

      await galleryAPI.uploadImage(formData);
      
      setSuccess('Gallery image uploaded successfully!');
      setUploadForm({ title: '', description: '', order: 0, file: null });
      
      // Reset file input
      const fileInput = document.getElementById('gallery-file-input');
      if (fileInput) fileInput.value = '';
      
      loadImages();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image._id);
    setEditForm({
      title: image.title,
      description: image.description || '',
      order: image.order,
      isActive: image.isActive
    });
  };

  const handleSaveEdit = async () => {
    try {
      setError('');
      
      await galleryAPI.updateImage(editingImage, editForm);
      
      setSuccess('Gallery image updated successfully!');
      setEditingImage(null);
      loadImages();
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || 'Failed to update image');
    }
  };

  const handleDelete = async (imageId, imageTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${imageTitle}"?`)) {
      return;
    }

    try {
      setError('');
      
      await galleryAPI.deleteImage(imageId);
      
      setSuccess('Gallery image deleted successfully!');
      loadImages();
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete image');
    }
  };

  const handleToggleActive = async (imageId) => {
    const image = images.find(img => img._id === imageId);
    if (!image) return;

    try {
      setError('');
      
      await galleryAPI.updateImage(imageId, { isActive: !image.isActive });
      
      setSuccess(`Image ${!image.isActive ? 'activated' : 'deactivated'} successfully!`);
      loadImages();
    } catch (error) {
      console.error('Toggle error:', error);
      setError(error.response?.data?.message || 'Failed to update image status');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedItem];
    
    // Remove dragged item
    newImages.splice(draggedItem, 1);
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    // Update order values
    const reorderData = newImages.map((img, index) => ({
      id: img._id,
      order: index
    }));

    // Update state immediately for UI responsiveness
    setImages(newImages);
    setDraggedItem(null);

    // Save new order to backend
    galleryAPI.reorderImages(reorderData)
      .then(() => {
        setSuccess('Gallery images reordered successfully!');
      })
      .catch((error) => {
        console.error('Reorder error:', error);
        setError('Failed to save new order');
        loadImages(); // Reload to get correct order
      });
  };

  // Auto-hide messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gallery Management
          </h1>
          <p className="text-gray-600">
            Manage landing page gallery images and their display order
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-blue-600" />
            Upload New Image
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image File *
                </label>
                <input
                  id="gallery-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={uploadForm.order}
                  onChange={(e) => setUploadForm({...uploadForm, order: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter image title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter image description (optional)"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Image
                </>
              )}
            </button>
          </form>
        </div>

        {/* Gallery Images */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Camera className="h-5 w-5 mr-2 text-blue-600" />
            Gallery Images ({images.length})
          </h2>

          {images.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No gallery images uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {images.map((image, index) => (
                <div
                  key={image._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`border rounded-lg p-4 ${
                    image.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  } hover:shadow-md transition-shadow cursor-move`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 pt-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>

                    {/* Image Preview */}
                    <div className="flex-shrink-0">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Image Details */}
                    <div className="flex-1 min-w-0">
                      {editingImage === image._id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Image title"
                          />
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Image description"
                          />
                          <div className="flex items-center space-x-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Order
                              </label>
                              <input
                                type="number"
                                value={editForm.order}
                                onChange={(e) => setEditForm({...editForm, order: parseInt(e.target.value) || 0})}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editForm.isActive}
                                onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                                className="mr-2"
                              />
                              <label className="text-sm font-medium text-gray-700">
                                Active
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {image.title}
                          </h3>
                          {image.description && (
                            <p className="text-gray-600 text-sm mb-2">
                              {image.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Order: {image.order}</span>
                            <span>Uploaded by: {image.uploadedBy?.name || 'Unknown'}</span>
                            <span>
                              Status: 
                              <span className={`ml-1 ${image.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                {image.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      {editingImage === image._id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="btn-sm btn-success"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingImage(null)}
                            className="btn-sm btn-secondary"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(image)}
                            className="btn-sm btn-secondary"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(image._id)}
                            className={`btn-sm ${image.isActive ? 'btn-secondary' : 'btn-success'}`}
                            title={image.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {image.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(image._id, image.title)}
                            className="btn-sm btn-danger"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            💡 Gallery Management Tips
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Drag and drop images to reorder them in the gallery</li>
            <li>• Only active images will be displayed on the landing page</li>
            <li>• Recommended image size: 800x400px or larger</li>
            <li>• Supported formats: JPG, PNG, WebP (max 10MB per image)</li>
            <li>• Lower order numbers appear first in the gallery</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManageGallery;