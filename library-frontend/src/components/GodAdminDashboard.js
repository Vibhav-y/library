import React, { useEffect, useState } from 'react';
import api, { authAPI, chatAPI, libraryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ChatMonitoring from './ChatMonitoring';
import ManageGallery from './ManageGallery';
import Customization from './Customization';
// Try a simpler import approach to avoid React child errors
let Chart;
try {
  Chart = require('chart.js/auto');
  const { Bar, Doughnut, Line } = require('react-chartjs-2');
  
  // Export for use in component
  window.ChartComponents = { Bar, Doughnut, Line };
} catch (error) {
  console.error('Chart.js import error:', error);
  window.ChartComponents = null;
}

const GodAdminDashboard = () => {
  const { masterImpersonate, masterLogout } = useAuth();

  // Safe chart component that handles Chart.js rendering issues
  const SafeChart = ({ type, data, options, condition = true }) => {
    if (!condition || !window.ChartComponents) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div>Loading chart...</div>
          </div>
        </div>
      );
    }

    try {
      const ChartComponent = window.ChartComponents[type];
      if (!ChartComponent) {
        throw new Error(`Chart type ${type} not available`);
      }

      return React.createElement(ChartComponent, { data, options });
    } catch (error) {
      console.error('Chart rendering error:', error);
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <div className="text-xl mb-2">⚠️</div>
            <div>Chart unavailable</div>
          </div>
        </div>
      );
    }
  };

  // Add CSS animations for charts
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes bounceIn {
        0% {
          opacity: 0;
          transform: scale(0.3);
        }
        50% {
          transform: scale(1.05);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [libraries, setLibraries] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    handle: '', 
    totalSeats: 50, 
    numberOfSlots: 2,
    slots: [
      { name: 'Morning', startTime: '06:00', endTime: '14:00' },
      { name: 'Evening', startTime: '14:00', endTime: '22:00' }
    ], 
    contact: { phone: '', email: '', address: '', website: '' }, 
    features: { chatEnabled: true, documentUploadsEnabled: true, galleryEnabled: true, galleryVisibleOnHomepage: true },
    adminPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeLibId, setActiveLibId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [userRole, setUserRole] = useState('');
  const [updatingLib, setUpdatingLib] = useState(false);
  const [platformAnalytics, setPlatformAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deletedLibraries, setDeletedLibraries] = useState([]);
  const [showDeletedLibraries, setShowDeletedLibraries] = useState(false);
  const [manageModal, setManageModal] = useState({ 
    show: false, 
    library: null, 
    formData: {},
    deleteConfirm: { show: false, confirmName: '', masterPassword: '' },
    loading: false 
  });

  const fetchLibraries = async () => {
    setError('');
    try {
      const data = await libraryAPI.getAll();
      setLibraries(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load libraries');
    }
  };

  const fetchDeletedLibraries = async () => {
    try {
      const data = await libraryAPI.getDeletedLibraries();
      setDeletedLibraries(data);
    } catch (e) {
      console.error('Failed to load deleted libraries:', e);
    }
  };

  useEffect(() => { 
    fetchLibraries(); 
    loadPlatformAnalytics();
  }, []);

  const loadPlatformAnalytics = async () => {
    try {
      const analytics = await libraryAPI.getPlatformAnalytics();
      setPlatformAnalytics(analytics);
    } catch (e) {
      console.error('Failed to load platform analytics:', e);
    }
  };

  useEffect(() => {
    const loadMonitoring = async () => {
      if (!activeLibId) return;
      try {
        const [convs, flaggedMsgs] = await Promise.all([
          chatAPI.admin.getAllConversations(activeLibId, true),
          chatAPI.admin.getFlaggedMessages(activeLibId, true)
        ]);
        setConversations(convs);
        setFlagged(flaggedMsgs);
      } catch (e) {
        // ignore UI errors here
      }
    };
    loadMonitoring();
  }, [activeLibId]);

  useEffect(()=>{
    const loadDetails = async () => {
      if (!activeLibId) return;
      try {
        const [m, u] = await Promise.all([
          libraryAPI.getMetrics(activeLibId),
          libraryAPI.getUsers(activeLibId, userQuery, userRole)
        ]);
        setMetrics(m);
        setUsers(u);
      } catch {}
    };
    loadDetails();
  }, [activeLibId, userQuery, userRole]);

  const createLibrary = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await libraryAPI.create(form);
      setForm({ 
        name: '', 
        handle: '', 
        totalSeats: 50, 
        numberOfSlots: 2,
        slots: [
          { name: 'Morning', startTime: '06:00', endTime: '14:00' },
          { name: 'Evening', startTime: '14:00', endTime: '22:00' }
        ], 
        contact: { phone: '', email: '', address: '', website: '' }, 
        features: { chatEnabled: true, documentUploadsEnabled: true, galleryEnabled: true, galleryVisibleOnHomepage: true },
        adminPassword: ''
      });
      await fetchLibraries();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create library');
    } finally {
      setLoading(false);
    }
  };

  const addSlot = () => {
    setForm({
      ...form,
      numberOfSlots: form.numberOfSlots + 1,
      slots: [...form.slots, { name: '', startTime: '', endTime: '' }]
    });
  };

  const removeSlot = (index) => {
    if (form.numberOfSlots > 1) {
      const newSlots = form.slots.filter((_, i) => i !== index);
      setForm({
        ...form,
        numberOfSlots: form.numberOfSlots - 1,
        slots: newSlots
      });
    }
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...form.slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setForm({ ...form, slots: newSlots });
  };

  const impersonate = async (libraryId) => {
    const res = await masterImpersonate(libraryId);
    if (!res.success) {
      setError(res.error);
      return;
    }
    window.location.href = '/dashboard';
  };

  const logout = () => {
    masterLogout();
    window.location.href = '/master-admin-login';
  };

  const handleManageLibrary = (library) => {
    setManageModal({ 
      show: true, 
      library,
      formData: {
        name: library.name,
        handle: library.handle,
        totalSeats: library.totalSeats,
        numberOfSlots: library.numberOfSlots || 2,
        slots: library.slotTimings || library.slots || [],
        contact: library.contact || { phone: '', email: '', address: '', website: '' },
        features: library.features || { chatEnabled: true, documentUploadsEnabled: true, galleryEnabled: true, galleryVisibleOnHomepage: true },
        isActive: library.isActive,
        adminPassword: '' // Will be filled when changing password
      },
      deleteConfirm: { show: false, confirmName: '', masterPassword: '' },
      loading: false 
    });
  };

  const updateLibraryData = async () => {
    setManageModal(prev => ({ ...prev, loading: true }));
    try {
      await libraryAPI.updateLibraryFull(manageModal.library._id, manageModal.formData);
      setManageModal({ 
        show: false, 
        library: null, 
        formData: {},
        deleteConfirm: { show: false, confirmName: '', masterPassword: '' },
        loading: false 
      });
      await fetchLibraries();
      loadPlatformAnalytics();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update library');
    } finally {
      setManageModal(prev => ({ ...prev, loading: false }));
    }
  };

  const showDeleteConfirm = () => {
    setManageModal(prev => ({ 
      ...prev, 
      deleteConfirm: { show: true, confirmName: '', masterPassword: '' } 
    }));
  };

  const confirmDeleteLibrary = async () => {
    if (manageModal.deleteConfirm.confirmName !== manageModal.library.name) {
      setError('Library name does not match');
      return;
    }

    if (!manageModal.deleteConfirm.masterPassword) {
      setError('Master password is required');
      return;
    }

    setManageModal(prev => ({ ...prev, loading: true }));
    try {
      await libraryAPI.deleteLibrary(manageModal.library._id, manageModal.deleteConfirm.masterPassword);
      setManageModal({ 
        show: false, 
        library: null, 
        formData: {},
        deleteConfirm: { show: false, confirmName: '', masterPassword: '' },
        loading: false 
      });
      await fetchLibraries();
      loadPlatformAnalytics();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete library');
    } finally {
      setManageModal(prev => ({ ...prev, loading: false }));
    }
  };

  const cancelManageModal = () => {
    setManageModal({ 
      show: false, 
      library: null, 
      formData: {},
      deleteConfirm: { show: false, confirmName: '', masterPassword: '' },
      loading: false 
    });
    setError('');
  };

  const updateFormData = (field, value) => {
    setManageModal(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value }
    }));
  };

  const updateContactField = (field, value) => {
    setManageModal(prev => ({
      ...prev,
      formData: { 
        ...prev.formData, 
        contact: { ...prev.formData.contact, [field]: value }
      }
    }));
  };

  const updateFeatureField = (field, value) => {
    setManageModal(prev => ({
      ...prev,
      formData: { 
        ...prev.formData, 
        features: { ...prev.formData.features, [field]: value }
      }
    }));
  };

  const addManageSlot = () => {
    setManageModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        numberOfSlots: prev.formData.numberOfSlots + 1,
        slots: [...prev.formData.slots, { name: '', startTime: '', endTime: '' }]
      }
    }));
  };

  const removeManageSlot = (index) => {
    if (manageModal.formData.numberOfSlots > 1) {
      setManageModal(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          numberOfSlots: prev.formData.numberOfSlots - 1,
          slots: prev.formData.slots.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const updateManageSlot = (index, field, value) => {
    setManageModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        slots: prev.formData.slots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'onboard', name: 'Onboard Library', icon: '🏢' },
    { id: 'manage', name: 'Manage Libraries', icon: '⚙️' },
    { id: 'gallery', name: 'Gallery Management', icon: '📷' },
    { id: 'customization', name: 'Customization', icon: '🎨' },
    { id: 'monitoring', name: 'Chat Monitoring', icon: '👁️' }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Modern Animated Analytics Dashboard */}
      {platformAnalytics && platformAnalytics.overview && (
        <div className="space-y-6">
          {/* Platform Overview Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-lg">📊</span>
              </div>
              Platform Overview
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <div className="text-3xl font-bold animate-pulse">{platformAnalytics?.overview?.totalLibraries || 0}</div>
                <div className="text-blue-100 text-sm mt-1">Total Libraries</div>
                <div className="mt-2 w-full bg-blue-400 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full animate-pulse" style={{width: '85%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <div className="text-3xl font-bold animate-pulse">{platformAnalytics?.overview?.activeLibraries || 0}</div>
                <div className="text-green-100 text-sm mt-1">Active</div>
                <div className="mt-2 w-full bg-green-400 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full animate-pulse" style={{width: '92%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <div className="text-3xl font-bold animate-pulse">{platformAnalytics?.overview?.suspendedLibraries || 0}</div>
                <div className="text-red-100 text-sm mt-1">Suspended</div>
                <div className="mt-2 w-full bg-red-400 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full animate-pulse" style={{width: '15%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <div className="text-3xl font-bold animate-pulse">{platformAnalytics?.overview?.totalUsers || 0}</div>
                <div className="text-purple-100 text-sm mt-1">Total Users</div>
                <div className="mt-2 w-full bg-purple-400 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full animate-pulse" style={{width: '78%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <div className="text-3xl font-bold animate-pulse">{platformAnalytics?.overview?.totalDocuments || 0}</div>
                <div className="text-yellow-100 text-sm mt-1">Documents</div>
                <div className="mt-2 w-full bg-yellow-400 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full animate-pulse" style={{width: '65%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <div className="text-3xl font-bold animate-pulse">{platformAnalytics?.overview?.totalConversations || 0}</div>
                <div className="text-indigo-100 text-sm mt-1">Conversations</div>
                <div className="mt-2 w-full bg-indigo-400 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full animate-pulse" style={{width: '55%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <div className="text-3xl font-bold animate-pulse">{platformAnalytics?.overview?.totalMessages || 0}</div>
                <div className="text-pink-100 text-sm mt-1">Messages</div>
                <div className="mt-2 w-full bg-pink-400 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full animate-pulse" style={{width: '88%'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Libraries Status Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white text-sm">🏢</span>
                </div>
                Libraries Status
              </h3>
              <div className="h-64 flex items-center justify-center">
                <SafeChart 
                  type="Doughnut"
                  condition={platformAnalytics?.overview?.activeLibraries !== undefined && platformAnalytics?.overview?.suspendedLibraries !== undefined}
                  data={{
                    labels: ['Active Libraries', 'Suspended Libraries'],
                    datasets: [{
                      data: [
                        platformAnalytics?.overview?.activeLibraries || 0, 
                        platformAnalytics?.overview?.suspendedLibraries || 0
                      ],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                      ],
                      borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 1)'
                      ],
                      borderWidth: 2,
                      hoverOffset: 10
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      animateScale: true,
                      animateRotate: true,
                      duration: 2000,
                      easing: 'easeOutQuart'
                    },
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          font: {
                            size: 12,
                            family: 'Inter, system-ui, sans-serif'
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Users by Library Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white text-sm">👥</span>
                </div>
                Users Distribution
              </h3>
              <div className="h-64">
                <SafeChart 
                  type="Bar"
                  condition={platformAnalytics?.usersByLibrary && Array.isArray(platformAnalytics.usersByLibrary)}
                  data={{
                    labels: (platformAnalytics?.usersByLibrary || []).slice(0, 8).map(lib => 
                      lib?.library?.name ? 
                        (lib.library.name.length > 10 ? lib.library.name.substring(0, 10) + '...' : lib.library.name) 
                        : 'Unknown'
                    ),
                    datasets: [
                      {
                        label: 'Students',
                        data: (platformAnalytics?.usersByLibrary || []).slice(0, 8).map(lib => lib?.students || 0),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                      },
                      {
                        label: 'Staff',
                        data: (platformAnalytics?.usersByLibrary || []).slice(0, 8).map(lib => (lib?.managers || 0) + (lib?.admins || 0)),
                        backgroundColor: 'rgba(168, 85, 247, 0.8)',
                        borderColor: 'rgba(168, 85, 247, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 2000,
                      easing: 'easeOutQuart',
                      delay: (context) => context.dataIndex * 100
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          padding: 20,
                          font: {
                            size: 12,
                            family: 'Inter, system-ui, sans-serif'
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            size: 11
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Activity Timeline Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white text-sm">📈</span>
              </div>
              Platform Activity Trend
            </h3>
            <div className="h-80">
              <SafeChart 
                type="Line"
                condition={platformAnalytics?.overview}
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  datasets: [
                    {
                      label: 'Total Users',
                      data: [120, 190, 300, 500, 750, 920, 1100, 1300, 1450, 1600, 1800, platformAnalytics?.overview?.totalUsers || 0],
                      borderColor: 'rgba(59, 130, 246, 1)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                      pointBorderColor: 'white',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'Total Documents',
                      data: [50, 80, 150, 220, 350, 420, 580, 720, 860, 1000, 1200, platformAnalytics?.overview?.totalDocuments || 0],
                      borderColor: 'rgba(34, 197, 94, 1)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                      pointBorderColor: 'white',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    },
                    {
                      label: 'Messages',
                      data: [200, 350, 600, 950, 1400, 1800, 2300, 2900, 3500, 4200, 5000, platformAnalytics?.overview?.totalMessages || 0],
                      borderColor: 'rgba(168, 85, 247, 1)',
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.4,
                      pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                      pointBorderColor: 'white',
                      pointBorderWidth: 2,
                      pointRadius: 5,
                      pointHoverRadius: 8
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 3000,
                    easing: 'easeOutQuart',
                    delay: (context) => context.dataIndex * 50
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        padding: 20,
                        font: {
                          size: 12,
                          family: 'Inter, system-ui, sans-serif'
                        },
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      titleColor: 'white',
                      bodyColor: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                      displayColors: true
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: {
                          size: 12
                        }
                      }
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Recent Libraries with Enhanced UI */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white text-sm">🆕</span>
              </div>
              Recent Libraries
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(platformAnalytics?.recentLibraries || []).map((lib, index) => (
                <div 
                  key={lib?._id || `library-${index}`} 
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out both'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900 truncate">{lib?.name || 'Unknown Library'}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${lib?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {lib?.isActive ? '✅ Active' : '❌ Suspended'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">{lib?.handle || 'No Handle'}</div>
                  <div className="text-xs text-gray-400">
                    Created: {lib?.createdAt ? new Date(lib.createdAt).toLocaleDateString() : 'Unknown Date'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 text-white rounded-lg p-6">
          <div className="text-2xl font-bold">{libraries.length}</div>
          <div className="text-blue-100">Total Libraries</div>
        </div>
        <div className="bg-green-600 text-white rounded-lg p-6">
          <div className="text-2xl font-bold">{libraries.filter(l => l.isActive).length}</div>
          <div className="text-green-100">Active Libraries</div>
        </div>
        <div className="bg-red-600 text-white rounded-lg p-6">
          <div className="text-2xl font-bold">{libraries.filter(l => !l.isActive).length}</div>
          <div className="text-red-100">Suspended Libraries</div>
        </div>
        <div className="bg-purple-600 text-white rounded-lg p-6">
          <div className="text-2xl font-bold">{libraries.reduce((acc, lib) => acc + lib.totalSeats, 0)}</div>
          <div className="text-purple-100">Total Seats</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-gray-900">LibraFlow</h1>
          <p className="text-sm text-gray-600">Master Admin</p>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </nav>

      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {tabs.find(tab => tab.id === activeTab)?.name || 'Dashboard'}
            </h1>
            
            {/* Logout Button */}
            <button 
              onClick={logout} 
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">{error}</div>}

        {/* Tab Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        
        {activeTab === 'onboard' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏢 Onboard New Library</h2>
            <form onSubmit={createLibrary} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Library Name</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    placeholder="Central Library"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handle (e.g., @sunview.com)</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={form.handle} 
                    onChange={e => setForm({ ...form, handle: e.target.value })} 
                    placeholder="@mycompany.com"
                    required
                  />
                </div>
              </div>

          {/* Admin Credentials */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Initial Admin Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.adminEmail || ''}
                  onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                  placeholder="admin@library.com"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">This admin will login using this email address</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.adminPassword}
                  onChange={e => setForm({ ...form, adminPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> The initial admin will login using their email. When this admin creates users within the library, those users will login using username{form.handle || '@handle'} format.
              </p>
            </div>
          </div>

              {/* Capacity & Slots */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Seats</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.totalSeats} 
                      onChange={e => setForm({ ...form, totalSeats: Number(e.target.value) })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Slots</label>
                    <input 
                      type="number" 
                      min="1"
                      max="6"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.numberOfSlots} 
                      onChange={e => {
                        const newNum = Number(e.target.value);
                        const newSlots = [];
                        for (let i = 0; i < newNum; i++) {
                          newSlots.push(form.slots[i] || { name: '', startTime: '', endTime: '' });
                        }
                        setForm({ ...form, numberOfSlots: newNum, slots: newSlots });
                      }}
                    />
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Time Slots Configuration</label>
                  <div className="space-y-3">
                    {form.slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <input 
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" 
                            value={slot.name} 
                            onChange={e => updateSlot(index, 'name', e.target.value)}
                            placeholder={`Slot ${index + 1} Name`}
                          />
                        </div>
                        <div>
                          <input 
                            type="time"
                            className="border border-gray-300 rounded px-3 py-2 text-sm" 
                            value={slot.startTime} 
                            onChange={e => updateSlot(index, 'startTime', e.target.value)}
                          />
                        </div>
                        <span className="text-gray-500">to</span>
                        <div>
                          <input 
                            type="time"
                            className="border border-gray-300 rounded px-3 py-2 text-sm" 
                            value={slot.endTime} 
                            onChange={e => updateSlot(index, 'endTime', e.target.value)}
                          />
                        </div>
                        {form.numberOfSlots > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeSlot(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={addSlot}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add Slot
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input 
                      type="email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.contact.email} 
                      onChange={e => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} 
                      placeholder="contact@library.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.contact.phone} 
                      onChange={e => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} 
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.contact.address} 
                      onChange={e => setForm({ ...form, contact: { ...form.contact, address: e.target.value } })} 
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.contact.website} 
                      onChange={e => setForm({ ...form, contact: { ...form.contact, website: e.target.value } })} 
                      placeholder="https://library.com"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Library Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      checked={form.features.chatEnabled} 
                      onChange={e=> setForm({ ...form, features: { ...form.features, chatEnabled: e.target.checked } })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">💬 Enable Chat System</span>
                      <p className="text-xs text-gray-500">Allow real-time messaging between users</p>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      checked={form.features.documentUploadsEnabled} 
                      onChange={e=> setForm({ ...form, features: { ...form.features, documentUploadsEnabled: e.target.checked } })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">📁 Enable Document Uploads</span>
                      <p className="text-xs text-gray-500">Allow admins to upload documents</p>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      checked={form.features.galleryEnabled} 
                      onChange={e=> setForm({ ...form, features: { ...form.features, galleryEnabled: e.target.checked } })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">📷 Enable Gallery</span>
                      <p className="text-xs text-gray-500">Allow gallery management and display</p>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      checked={form.features.galleryVisibleOnHomepage} 
                      onChange={e=> setForm({ ...form, features: { ...form.features, galleryVisibleOnHomepage: e.target.checked } })}
                      className="w-4 h-4 text-blue-600"
                      disabled={!form.features.galleryEnabled}
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">🏠 Show Gallery on Homepage</span>
                      <p className="text-xs text-gray-500">Display gallery images on the landing page</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  disabled={loading} 
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Creating Library...' : 'Create Library'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">🏢 Manage Libraries</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeletedLibraries(!showDeletedLibraries);
                    if (!showDeletedLibraries) fetchDeletedLibraries();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  {showDeletedLibraries ? 'Hide Deleted Libraries' : 'View Deleted Libraries'}
                </button>
                <div className="text-sm text-gray-600">{libraries.length} Active Libraries</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {libraries.map(lib => (
                <div key={lib._id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{lib.name}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${lib.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {lib.isActive ? 'Active' : 'Suspended'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{lib.handle}</span>
                      </div>
                      <div>📍 {lib.totalSeats} seats</div>
                      {lib.contact?.email && <div>📧 {lib.contact.email}</div>}
                      {lib.contact?.phone && <div>📞 {lib.contact.phone}</div>}
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-xs">
                      <span className={`flex items-center ${lib.features?.chatEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        💬 Chat {lib.features?.chatEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className={`flex items-center ${lib.features?.documentUploadsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        📁 Documents {lib.features?.documentUploadsEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <div className="w-full">
                      <button 
                        onClick={() => handleManageLibrary(lib)} 
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                      >
                        ⚙️ Manage Library
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {libraries.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🏢</div>
                  <div className="text-lg font-medium mb-2">No libraries onboarded yet</div>
                  <div className="text-sm">Create your first library using the Onboard Library tab</div>
                </div>
              )}
            </div>

            {/* Deleted Libraries Section */}
            {showDeletedLibraries && (
              <div className="space-y-6">
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-red-900 mb-4">🗑️ Deleted Libraries ({deletedLibraries.length})</h3>
                  
                  {deletedLibraries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">🗑️</div>
                      <div className="text-sm">No deleted libraries</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {deletedLibraries.map(lib => (
                        <div key={lib._id} className="bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-red-900">{lib.name}</h3>
                              <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Deleted
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-red-600 mb-4">
                              <div className="flex items-center">
                                <span className="font-mono bg-red-100 px-2 py-1 rounded text-xs">{lib.handle}</span>
                              </div>
                              <div>📍 {lib.totalSeats} seats</div>
                              <div>🗑️ Deleted: {new Date(lib.deletedAt).toLocaleDateString()}</div>
                            </div>

                            <div className="space-y-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await libraryAPI.restoreLibrary(lib._id);
                                    await fetchLibraries();
                                    await fetchDeletedLibraries();
                                  } catch (e) {
                                    setError(e.response?.data?.message || 'Failed to restore library');
                                  }
                                }}
                                className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium"
                              >
                                ♻️ Restore Library
                              </button>
                              <button
                                onClick={async () => {
                                  const confirmName = prompt(`Type "${lib.name}" to permanently delete this library:`);
                                  if (confirmName === lib.name) {
                                    const masterPassword = prompt('Enter your master password:');
                                    if (masterPassword) {
                                      try {
                                        await libraryAPI.permanentDeleteLibrary(lib._id, masterPassword);
                                        await fetchDeletedLibraries();
                                      } catch (e) {
                                        setError(e.response?.data?.message || 'Failed to permanently delete library');
                                      }
                                    }
                                  }
                                }}
                                className="w-full px-3 py-2 bg-red-800 text-white rounded text-sm hover:bg-red-900 font-medium"
                              >
                                💀 Permanently Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="h-full">
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">📷 LibraFlow Landing Page Gallery</h2>
              <p className="text-gray-600 mb-4">
                Manage the gallery images that appear on the LibraFlow landing page.
              </p>
            </div>
            <ManageGallery />
          </div>
        )}

        {activeTab === 'customization' && (
          <div className="h-full">
            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">🎨 LibraFlow Landing Page Customization</h2>
              <p className="text-gray-600 mb-4">
                Customize the appearance and branding of the LibraFlow landing page.
              </p>
            </div>
            <Customization />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="h-full">
            <ChatMonitoring onBack={() => setActiveTab('dashboard')} />
          </div>
        )}
        
        </div>
      </div>

      {/* Manage Library Modal */}
      {manageModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Manage Library: {manageModal.library?.name}</h3>
              {!manageModal.deleteConfirm.show ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Library Name</label>
                      <input
                        type="text"
                        value={manageModal.formData.name || ''}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Handle</label>
                      <input
                        type="text"
                        value={manageModal.formData.handle || ''}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Handle cannot be changed after creation</p>
                    </div>
                  </div>

                  {/* Library Status */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Library Status</h4>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={manageModal.formData.isActive}
                          onChange={(e) => updateFormData('isActive', e.target.checked)}
                          className="mr-2"
                        />
                        <span className={manageModal.formData.isActive ? 'text-green-600' : 'text-red-600'}>
                          {manageModal.formData.isActive ? '✅ Active' : '❌ Suspended'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Capacity & Slots */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Capacity & Time Slots</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Seats</label>
                        <input
                          type="number"
                          min="1"
                          value={manageModal.formData.totalSeats || ''}
                          onChange={(e) => updateFormData('totalSeats', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Slots</label>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={manageModal.formData.numberOfSlots || ''}
                          onChange={(e) => {
                            const newNum = Number(e.target.value);
                            const newSlots = [];
                            for (let i = 0; i < newNum; i++) {
                              newSlots.push(manageModal.formData.slots[i] || { name: '', startTime: '', endTime: '' });
                            }
                            updateFormData('numberOfSlots', newNum);
                            updateFormData('slots', newSlots);
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Time Slots Configuration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Time Slots Configuration</label>
                      <div className="space-y-3">
                        {(manageModal.formData.slots || []).map((slot, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <input
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                value={slot.name || ''}
                                onChange={(e) => updateManageSlot(index, 'name', e.target.value)}
                                placeholder={`Slot ${index + 1} Name`}
                              />
                            </div>
                            <div>
                              <input
                                type="time"
                                className="border border-gray-300 rounded px-3 py-2 text-sm"
                                value={slot.startTime || ''}
                                onChange={(e) => updateManageSlot(index, 'startTime', e.target.value)}
                              />
                            </div>
                            <span className="text-gray-500">to</span>
                            <div>
                              <input
                                type="time"
                                className="border border-gray-300 rounded px-3 py-2 text-sm"
                                value={slot.endTime || ''}
                                onChange={(e) => updateManageSlot(index, 'endTime', e.target.value)}
                              />
                            </div>
                            {(manageModal.formData.numberOfSlots || 1) > 1 && (
                              <button
                                type="button"
                                onClick={() => removeManageSlot(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addManageSlot}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          + Add Slot
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                        <input
                          type="email"
                          value={manageModal.formData.contact?.email || ''}
                          onChange={(e) => updateContactField('email', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="contact@library.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                        <input
                          value={manageModal.formData.contact?.phone || ''}
                          onChange={(e) => updateContactField('phone', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <input
                          value={manageModal.formData.contact?.address || ''}
                          onChange={(e) => updateContactField('address', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123 Main St, City, State 12345"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          value={manageModal.formData.contact?.website || ''}
                          onChange={(e) => updateContactField('website', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://library.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Library Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={manageModal.formData.features?.chatEnabled || false}
                          onChange={(e) => updateFeatureField('chatEnabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">💬 Enable Chat System</span>
                          <p className="text-xs text-gray-500">Allow real-time messaging between users</p>
                        </div>
                      </label>
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={manageModal.formData.features?.documentUploadsEnabled || false}
                          onChange={(e) => updateFeatureField('documentUploadsEnabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">📁 Enable Document Uploads</span>
                          <p className="text-xs text-gray-500">Allow admins to upload documents</p>
                        </div>
                      </label>
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={manageModal.formData.features?.galleryEnabled || false}
                          onChange={(e) => updateFeatureField('galleryEnabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">📷 Enable Gallery</span>
                          <p className="text-xs text-gray-500">Allow gallery management and display</p>
                        </div>
                      </label>
                      <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={manageModal.formData.features?.galleryVisibleOnHomepage || false}
                          onChange={(e) => updateFeatureField('galleryVisibleOnHomepage', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                          disabled={!manageModal.formData.features?.galleryEnabled}
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">🏠 Show Gallery on Homepage</span>
                          <p className="text-xs text-gray-500">Display gallery images on the landing page</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Admin Password Change */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Admin Password</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Admin Password (optional)</label>
                      <input
                        type="password"
                        value={manageModal.formData.adminPassword || ''}
                        onChange={(e) => updateFormData('adminPassword', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Leave blank to keep current password"
                      />
                      <p className="text-xs text-gray-500 mt-1">Only fill this if you want to change the library admin's password</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-6 border-t">
                    <button
                      onClick={cancelManageModal}
                      disabled={manageModal.loading}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={showDeleteConfirm}
                      disabled={manageModal.loading}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      🗑️ Delete Library
                    </button>
                    <button
                      onClick={updateLibraryData}
                      disabled={manageModal.loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {manageModal.loading ? 'Updating...' : 'Update Library'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Delete Confirmation */
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                      <strong>Warning:</strong> This action cannot be undone. All library data, users, documents, and conversations will be permanently deleted.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type library name to confirm: <strong>{manageModal.library?.name}</strong>
                    </label>
                    <input
                      type="text"
                      value={manageModal.deleteConfirm.confirmName}
                      onChange={(e) => setManageModal(prev => ({ 
                        ...prev, 
                        deleteConfirm: { ...prev.deleteConfirm, confirmName: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder={manageModal.library?.name}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your master password
                    </label>
                    <input
                      type="password"
                      value={manageModal.deleteConfirm.masterPassword}
                      onChange={(e) => setManageModal(prev => ({ 
                        ...prev, 
                        deleteConfirm: { ...prev.deleteConfirm, masterPassword: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setManageModal(prev => ({ 
                        ...prev, 
                        deleteConfirm: { show: false, confirmName: '', masterPassword: '' }
                      }))}
                      disabled={manageModal.loading}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteLibrary}
                      disabled={manageModal.loading || manageModal.deleteConfirm.confirmName !== manageModal.library?.name || !manageModal.deleteConfirm.masterPassword}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {manageModal.loading ? 'Deleting...' : 'Delete Library'}
                    </button>
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

export default GodAdminDashboard;


