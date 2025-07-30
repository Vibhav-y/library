import axios from 'axios';
import { API_BASE_URL as BASE_URL } from '../config/environment';

const API_BASE_URL = `${BASE_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403 && error.response?.data?.expired) {
      // Handle expired account
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Store the expiration message for display on login page
      localStorage.setItem('expiredMessage', error.response.data.message);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

// Document API
export const documentAPI = {
  getAll: async () => {
    const response = await api.get('/document');
    return response.data;
  },
  
  upload: async (formData) => {
    const response = await api.post('/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Get download URL for document access
  getDownloadUrl: async (documentId) => {
    const response = await api.get(`/document/${documentId}/download`);
    return response.data;
  },
  
  // Legacy download function for backwards compatibility
  download: (filePath) => {
    // For legacy documents that might still use local storage
    return `${API_BASE_URL.replace('/api', '')}/${filePath}`;
  },
  
  // Delete document (admin only)
  delete: async (documentId) => {
    const response = await api.delete(`/document/${documentId}`);
    return response.data;
  },
  
  addToFavorites: async (documentId) => {
    const response = await api.post(`/document/${documentId}/favorite`);
    return response.data;
  },
  
  removeFromFavorites: async (documentId) => {
    const response = await api.delete(`/document/${documentId}/favorite`);
    return response.data;
  },
  
  getFavorites: async () => {
    const response = await api.get('/document/favorites');
    return response.data;
  },
  
  getFavoritesCount: async () => {
    const response = await api.get('/document/favorites/count');
    return response.data;
  },
};

// Category API
export const categoryAPI = {
  getAll: async () => {
    const response = await api.get('/category');
    return response.data;
  },
  
  getTree: async () => {
    const response = await api.get('/category/tree');
    return response.data;
  },
  
  getByParent: async (parentId = null) => {
    const endpoint = parentId ? `/category/by-parent/${parentId}` : '/category/by-parent';
    const response = await api.get(endpoint);
    return response.data;
  },
  
  create: async (formData) => {
    const response = await api.post('/category', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/category/${id}`);
    return response.data;
  },
  
  updateImage: async (id, formData) => {
    const response = await api.put(`/category/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  deleteImage: async (id) => {
    const response = await api.delete(`/category/${id}/image`);
    return response.data;
  },
};

// User API
export const userAPI = {
  getDashboard: async () => {
    const response = await api.get('/user/dashboard');
    return response.data;
  },
  
  getAll: async () => {
    const response = await api.get('/user');
    return response.data;
  },
  
  create: async (formData) => {
    const response = await api.post('/user', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  updateTermination: async (id, terminationDate) => {
    const response = await api.put(`/user/${id}/termination`, { terminationDate });
    return response.data;
  },
  
  update: async (userId, userData) => {
    const response = await api.put(`/user/${userId}`, userData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  },
  
  // Profile management
  getProfile: async (userId) => {
    const response = await api.get(`/user/profile/${userId}`);
    return response.data;
  },
  
  updateProfile: async (userId, formData) => {
    const response = await api.put(`/user/profile/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Fee management
  getAllFees: async () => {
    const response = await api.get('/user/fees');
    return response.data;
  },
  
  getStudentFees: async (studentId) => {
    const response = await api.get(`/user/fees/${studentId}`);
    return response.data;
  },
  
  updateFee: async (feeId, feeData) => {
    const response = await api.put(`/user/fees/${feeId}`, feeData);
    return response.data;
  },
  
  generateFees: async (studentId, feeAmount) => {
    const response = await api.post(`/user/fees/generate/${studentId}`, { feeAmount });
    return response.data;
  },
};

// Student API (kept for backward compatibility)
export const studentAPI = {
  getAll: async () => {
    const response = await api.get('/students');
    return response.data;
  },
  
  create: async (name, email, password, terminationDate) => {
    const response = await api.post('/students', { name, email, password, terminationDate });
    return response.data;
  },
  
  updateTermination: async (id, terminationDate) => {
    const response = await api.put(`/students/${id}/termination`, { terminationDate });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};

// Customization API
export const customizationAPI = {
  get: async () => {
    const response = await api.get('/customization');
    return response.data;
  },
  
  getThemes: async () => {
    const response = await api.get('/customization/themes');
    return response.data;
  },
  
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/customization/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  deleteLogo: async () => {
    const response = await api.delete('/customization/logo');
    return response.data;
  },
  
  updateSystemName: async (systemName) => {
    const response = await api.put('/customization/system-name', { systemName });
    return response.data;
  },
  
  setActiveTheme: async (themeId) => {
    const response = await api.put('/customization/theme', { themeId });
    return response.data;
  },
  
  createCustomTheme: async (name, colors) => {
    const response = await api.post('/customization/themes/custom', { name, colors });
    return response.data;
  },
  
  updateCustomTheme: async (id, name, colors) => {
    const response = await api.put(`/customization/themes/custom/${id}`, { name, colors });
    return response.data;
  },
  
  deleteCustomTheme: async (id) => {
    const response = await api.delete(`/customization/themes/custom/${id}`);
    return response.data;
  },
  
  updateLogoSize: async (logoSize) => {
    const response = await api.put('/customization/logo/size', { logoSize });
    return response.data;
  },
  
  toggleLogo: async (showLogo) => {
    const response = await api.put('/customization/logo/toggle', { showLogo });
    return response.data;
  },
};

export default api; 