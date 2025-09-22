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
  godLogin: async (email, password) => {
    const response = await api.post('/auth/master/login', { email, password });
    return response.data;
  },
  godImpersonate: async (godToken, libraryId) => {
    // Use a direct axios call without interceptor token replacement
    const response = await axios.post(`${API_BASE_URL}/auth/master/impersonate`, { token: godToken, libraryId });
    return response.data;
  }
};

// Library API
export const libraryAPI = {
  getCurrent: async () => {
    const response = await api.get('/library/me');
    return response.data;
  },
  getPublicByHandle: async (handle) => {
    const response = await api.get(`/library/public/by-handle/${encodeURIComponent(handle)}`);
    return response.data;
  },
  getMetrics: async (libraryId) => {
    const headers = localStorage.getItem('god_token') ? { Authorization: localStorage.getItem('god_token') } : undefined;
    const response = await api.get(`/library/${libraryId}/metrics`, { headers });
    return response.data;
  },
  getUsers: async (libraryId, q = '', role = '') => {
    const headers = localStorage.getItem('god_token') ? { Authorization: localStorage.getItem('god_token') } : undefined;
    const response = await api.get(`/library/${libraryId}/users`, { params: { q, role }, headers });
    return response.data;
  }
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
  // E2EE: set user's public key
  setPublicKey: async (publicKeyPem) => {
    const response = await api.put('/user/encryption/public-key', { publicKeyPem });
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

// Announcement API
export const announcementAPI = {
  // Public endpoints
  getPublicAnnouncements: async () => {
    const response = await api.get('/announcement/public');
    return response.data;
  },

  // Admin endpoints
  getAllAnnouncements: async () => {
    const response = await api.get('/announcement/admin');
    return response.data;
  },

  createAnnouncement: async (announcementData) => {
    const response = await api.post('/announcement', announcementData);
    return response.data;
  },

  updateAnnouncement: async (id, announcementData) => {
    const response = await api.put(`/announcement/${id}`, announcementData);
    return response.data;
  },

  deleteAnnouncement: async (id) => {
    const response = await api.delete(`/announcement/${id}`);
    return response.data;
  },

  toggleAnnouncement: async (id) => {
    const response = await api.patch(`/announcement/${id}/toggle`);
    return response.data;
  }
};

// Gallery API
export const galleryAPI = {
  // Public endpoints
  getPublicImages: async () => {
    const response = await api.get('/gallery/public');
    return response.data;
  },

  // Admin endpoints
  getAllImages: async () => {
    const response = await api.get('/gallery/admin');
    return response.data;
  },

  uploadImage: async (formData) => {
    const response = await api.post('/gallery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateImage: async (id, imageData) => {
    const response = await api.put(`/gallery/${id}`, imageData);
    return response.data;
  },

  deleteImage: async (id) => {
    const response = await api.delete(`/gallery/${id}`);
    return response.data;
  },

  reorderImages: async (images) => {
    const response = await api.put('/gallery/reorder/bulk', { images });
    return response.data;
  }
};

// Thought of the Day API
export const thoughtAPI = {
  // Public endpoint for students
  getTodaysThought: async () => {
    const response = await api.get('/thought/today');
    return response.data;
  },

  // Admin endpoints
  getAllThoughts: async () => {
    const response = await api.get('/thought');
    return response.data;
  },

  createThought: async (thoughtData) => {
    const response = await api.post('/thought', thoughtData);
    return response.data;
  },

  updateThought: async (id, thoughtData) => {
    const response = await api.put(`/thought/${id}`, thoughtData);
    return response.data;
  },

  deleteThought: async (id) => {
    const response = await api.delete(`/thought/${id}`);
    return response.data;
  },

  reorderThoughts: async (thoughts) => {
    const response = await api.put('/thought/reorder/bulk', { thoughts });
    return response.data;
  },

  bulkImportThoughts: async (thoughts) => {
    const response = await api.post('/thought/bulk-import', { thoughts });
    return response.data;
  }
};

// Chat API
export const chatAPI = {
  // Get user's conversations
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // Create or get private conversation
  createPrivateConversation: async (userId) => {
    const response = await api.post('/chat/conversations/private', { userId });
    return response.data;
  },

  // Join main group chat
  joinGroupChat: async () => {
    const response = await api.post('/chat/conversations/group/join');
    return response.data;
  },

  // Get conversation messages
  getMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get new messages after a specific timestamp (for polling)
  getNewMessages: async (conversationId, afterTimestamp) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { after: afterTimestamp }
    });
    return response.data;
  },

  // Send message
  sendMessage: async (conversationId, content, type = 'text', replyTo = null, encryption = null) => {
    const body = { content, type, replyTo };
    if (encryption) body.encryption = encryption;
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, body);
    return response.data;
  },

  // Send attachment (image/file)
  sendAttachment: async (conversationId, file, replyTo = null) => {
    const form = new FormData();
    form.append('file', file);
    if (replyTo) form.append('replyTo', replyTo);
    const response = await api.post(`/chat/conversations/${conversationId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // E2EE: get conversation encryption metadata
  getConversationEncryption: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}/encryption`);
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (conversationId) => {
    const response = await api.put(`/chat/conversations/${conversationId}/read`);
    return response.data;
  },

  // 🚀 PREMIUM: Add reaction to message
  addReaction: async (messageId, emoji) => {
    const response = await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
    return response.data;
  },

  // 🚀 PREMIUM: Edit message
  editMessage: async (messageId, content) => {
    const response = await api.put(`/chat/messages/${messageId}`, { content });
    return response.data;
  },

  // 🚀 PREMIUM: Get message reactions
  getMessageReactions: async (messageId) => {
    const response = await api.get(`/chat/messages/${messageId}/reactions`);
    return response.data;
  },

  // Get online users
  getOnlineUsers: async () => {
    const response = await api.get('/chat/users/online');
    return response.data;
  },

  // Search users to start private chat (exclude superadmin)
  searchUsers: async (query) => {
    const response = await api.get('/chat/users/search', { params: { q: query } });
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },

  // Admin APIs
  admin: {
    // Get all conversations (admin monitoring)
    getAllConversations: async (libraryId = undefined, useGodToken = false) => {
      const headers = useGodToken && localStorage.getItem('god_token') ? { Authorization: localStorage.getItem('god_token') } : undefined;
      const response = await api.get('/chat/admin/conversations', { params: { libraryId }, headers });
      return response.data;
    },

    // Get messages from any conversation
    getConversationMessages: async (conversationId, page = 1, limit = 50, useGodToken = false) => {
      const headers = useGodToken && localStorage.getItem('god_token') ? { Authorization: localStorage.getItem('god_token') } : undefined;
      const response = await api.get(`/chat/admin/conversations/${conversationId}/messages`, {
        params: { page, limit },
        headers
      });
      return response.data;
    },

    // Get flagged messages
    getFlaggedMessages: async (libraryId = undefined, useGodToken = false) => {
      const headers = useGodToken && localStorage.getItem('god_token') ? { Authorization: localStorage.getItem('god_token') } : undefined;
      const response = await api.get('/chat/admin/messages/flagged', { params: { libraryId }, headers });
      return response.data;
    },

    // Flag/unflag message
    flagMessage: async (messageId, flag, reason = '') => {
      const response = await api.put(`/chat/messages/${messageId}/flag`, {
        flag,
        reason
      });
      return response.data;
    },

    // Group Management APIs
    // Create custom group
    createGroup: async (name, description, participants = []) => {
      const response = await api.post('/chat/admin/groups', {
        name,
        description,
        participants
      });
      return response.data;
    },

    // Update group details
    updateGroup: async (groupId, name, description) => {
      const response = await api.put(`/chat/admin/groups/${groupId}`, {
        name,
        description
      });
      return response.data;
    },

    // Add members to group
    addGroupMembers: async (groupId, userIds) => {
      const response = await api.post(`/chat/admin/groups/${groupId}/members`, {
        userIds
      });
      return response.data;
    },

    // Remove member from group
    removeGroupMember: async (groupId, userId) => {
      const response = await api.delete(`/chat/admin/groups/${groupId}/members/${userId}`);
      return response.data;
    },

    // Delete group
    deleteGroup: async (groupId) => {
      const response = await api.delete(`/chat/admin/groups/${groupId}`);
      return response.data;
    },

    // Get all users for group management
    getAllUsers: async () => {
      const response = await api.get('/chat/admin/users');
      return response.data;
    },

    // E2EE: rotate conversation key (superadmin only)
    rotateConversationKey: async (conversationId, superAdminPublicKeyPem = null, useGodToken = false) => {
      const body = superAdminPublicKeyPem ? { superAdminPublicKeyPem } : {};
      const headers = useGodToken && localStorage.getItem('god_token') ? { Authorization: localStorage.getItem('god_token') } : undefined;
      const response = await api.post(`/chat/admin/conversations/${conversationId}/keys/rotate`, body, { headers });
      return response.data;
    },

    // E2EE: grant user access to conversation key (superadmin only)
    grantConversationKey: async (conversationId, userId, useGodToken = false) => {
      const headers = useGodToken && localStorage.getItem('god_token') ? { Authorization: localStorage.getItem('god_token') } : undefined;
      const response = await api.post(`/chat/admin/conversations/${conversationId}/keys/grant`, { userId }, { headers });
      return response.data;
    },

    // E2EE: superadmin fetch raw symmetric key
    getRawConversationKey: async (conversationId, useGodToken = false) => {
      const headers = useGodToken && localStorage.getItem('god_token') ? { Authorization: localStorage.getItem('god_token') } : undefined;
      const response = await api.get(`/chat/admin/conversations/${conversationId}/keys/raw`, { headers });
      return response.data;
    }
  }
};

export default api; 