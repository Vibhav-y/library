import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notice';

// Create axios instance with auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: token } : {};
};

const noticeAPI = {
  // Admin endpoints
  getAllNotices: async () => {
    const response = await axios.get(`${API_URL}/admin`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  createNotice: async (noticeData) => {
    const response = await axios.post(API_URL, noticeData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateNotice: async (id, noticeData) => {
    const response = await axios.put(`${API_URL}/${id}`, noticeData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteNotice: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getUsers: async () => {
    const response = await axios.get(`${API_URL}/users`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // User endpoints
  getUserNotices: async () => {
    const response = await axios.get(`${API_URL}/user`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getBannerMarqueeNotices: async () => {
    const response = await axios.get(`${API_URL}/banner-marquee`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getTabNotices: async () => {
    const response = await axios.get(`${API_URL}/tab`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await axios.post(`${API_URL}/${id}/read`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

export default noticeAPI; 