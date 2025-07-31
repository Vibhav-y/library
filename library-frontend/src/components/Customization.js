import React, { useState, useEffect, useRef } from 'react';
import { customizationAPI } from '../services/api';
import { useCustomization } from '../contexts/CustomizationContext';
import { 
  Upload, 
  Image, 
  Trash2, 
  Palette, 
  Plus, 
  Save, 
  Edit, 
  X, 
  Check, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';

const Customization = () => {
  const { refreshCustomization } = useCustomization();
  const [customization, setCustomization] = useState(null);
  const [themes, setThemes] = useState({ predefined: [], custom: [] });
  const [loading, setLoading] = useState(true);
  const [logoLoading, setLogoLoading] = useState(false);
  const [systemNameLoading, setSystemNameLoading] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
  const [logoSizeLoading, setLogoSizeLoading] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [systemName, setSystemName] = useState('');
  const [showCreateThemeModal, setShowCreateThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [newTheme, setNewTheme] = useState({
    name: '',
    colors: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#F59E0B',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    }
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customizationData, themesData] = await Promise.all([
        customizationAPI.get().catch(() => ({ systemName: 'Library System', showLogo: false })),
        customizationAPI.getThemes()
      ]);
      
      setCustomization(customizationData);
      setThemes(themesData);
      setSystemName(customizationData.systemName || 'Library System');
    } catch (error) {
      console.error('Error loading customization data:', error);
      setError('Failed to load customization settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, message) => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Logo file size must be less than 5MB');
      return;
    }

    setLogoLoading(true);
    try {
      const response = await customizationAPI.uploadLogo(file);
      showMessage('success', 'Logo uploaded successfully');
      
      // Refresh both local data and global customization context
      await Promise.all([
        loadData(),
        refreshCustomization()
      ]);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLogoLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm('Are you sure you want to delete the logo?')) return;

    setLogoLoading(true);
    try {
      await customizationAPI.deleteLogo();
      showMessage('success', 'Logo deleted successfully');
      
      // Refresh both local data and global customization context
      await Promise.all([
        loadData(),
        refreshCustomization()
      ]);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to delete logo');
    } finally {
      setLogoLoading(false);
    }
  };

  const handleSystemNameUpdate = async () => {
    if (!systemName.trim()) {
      showMessage('error', 'System name cannot be empty');
      return;
    }

    setSystemNameLoading(true);
    try {
      await customizationAPI.updateSystemName(systemName.trim());
      showMessage('success', 'System name updated successfully');
      
      // Refresh both local data and global customization context
      await Promise.all([
        loadData(),
        refreshCustomization()
      ]);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update system name');
    } finally {
      setSystemNameLoading(false);
    }
  };

  const handleThemeSelect = (themeId) => {
    setSelectedThemeId(themeId);
  };

  const handleApplyTheme = async () => {
    if (!selectedThemeId) return;
    
    setThemeLoading(true);
    try {
      await customizationAPI.setActiveTheme(selectedThemeId);
      showMessage('success', 'Theme applied successfully');
      
      // Refresh both local data and global customization context
      await Promise.all([
        loadData(),
        refreshCustomization()
      ]);
      
      setSelectedThemeId(null); // Clear selection after successful apply
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to apply theme');
    } finally {
      setThemeLoading(false);
    }
  };

  const handleToggleLogo = async () => {
    try {
      const newShowLogo = !customization.showLogo;
      await customizationAPI.toggleLogo(newShowLogo);
      showMessage('success', `Logo ${newShowLogo ? 'enabled' : 'disabled'} successfully`);
      
      // Refresh both local data and global customization context
      await Promise.all([
        loadData(),
        refreshCustomization()
      ]);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to toggle logo visibility');
    }
  };

  const handleLogoSizeChange = async (newSize) => {
    setLogoSizeLoading(true);
    try {
      await customizationAPI.updateLogoSize(newSize);
      showMessage('success', 'Logo size updated successfully');
      
      // Refresh both local data and global customization context
      await Promise.all([
        loadData(),
        refreshCustomization()
      ]);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update logo size');
    } finally {
      setLogoSizeLoading(false);
    }
  };

  const handleCreateCustomTheme = async () => {
    if (!newTheme.name.trim()) {
      showMessage('error', 'Theme name is required');
      return;
    }

    try {
      if (editingTheme) {
        await customizationAPI.updateCustomTheme(editingTheme._id, newTheme.name, newTheme.colors);
        showMessage('success', 'Custom theme updated successfully');
      } else {
        await customizationAPI.createCustomTheme(newTheme.name, newTheme.colors);
        showMessage('success', 'Custom theme created successfully');
      }
      
      setShowCreateThemeModal(false);
      setEditingTheme(null);
      setNewTheme({
        name: '',
        colors: {
          primary: '#3B82F6',
          secondary: '#1E40AF',
          accent: '#F59E0B',
          background: '#F9FAFB',
          surface: '#FFFFFF',
          text: '#111827',
          textSecondary: '#6B7280',
          border: '#E5E7EB',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6'
        }
      });
      loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to save custom theme');
    }
  };

  const handleEditCustomTheme = (theme) => {
    setEditingTheme(theme);
    setNewTheme({
      name: theme.name,
      colors: { ...theme.colors }
    });
    setShowCreateThemeModal(true);
  };

  const handleDeleteCustomTheme = async (themeId, themeName) => {
    if (!window.confirm(`Are you sure you want to delete the theme "${themeName}"?`)) return;

    try {
      await customizationAPI.deleteCustomTheme(themeId);
      showMessage('success', 'Custom theme deleted successfully');
      loadData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to delete custom theme');
    }
  };

  const handleColorChange = (colorKey, value) => {
    setNewTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const getThemePreview = (colors) => {
    return (
      <div className="flex space-x-1 rounded overflow-hidden" style={{ height: '20px' }}>
        <div style={{ backgroundColor: colors.primary, width: '25%' }}></div>
        <div style={{ backgroundColor: colors.secondary, width: '25%' }}></div>
        <div style={{ backgroundColor: colors.accent, width: '25%' }}></div>
        <div style={{ backgroundColor: colors.background, width: '25%' }}></div>
      </div>
    );
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
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-6 py-8 sm:p-10">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg mr-4">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                System Customization
              </h3>
              <p className="mt-2 text-base sm:text-lg text-gray-600">
                Customize your library system's appearance with logos, themes, and branding.
              </p>
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

      {/* System Name Section */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-green-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-6 py-8 sm:p-10">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center shadow-lg mr-4">
              <Edit3 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              System Name
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="flex-1 block w-full px-4 py-3 text-base border-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 placeholder:text-gray-400"
              placeholder="Enter system name"
            />
            <button
              onClick={handleSystemNameUpdate}
              disabled={systemNameLoading || systemName === customization?.systemName}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {systemNameLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="relative bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl border border-white/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="relative px-6 py-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-green-600 to-purple-600 flex items-center justify-center shadow-lg mr-4">
                <Image className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Logo Management
              </h3>
            </div>
            {customization?.logoUrl && (
              <button
                onClick={handleToggleLogo}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  customization.showLogo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {customization.showLogo ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hidden
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Current Logo */}
            {customization?.logoUrl && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={customization.logoUrl}
                  alt="Current Logo"
                  className="h-16 w-16 object-contain bg-white rounded border"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {customization.logoName || 'Current Logo'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {customization.showLogo ? 'Visible' : 'Hidden'}
                  </p>
                </div>
                <button
                  onClick={handleDeleteLogo}
                  disabled={logoLoading}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </button>
              </div>
            )}

            {/* Logo Size Control */}
            {customization?.logoUrl && customization.showLogo && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Logo Size</h4>
                  <span className="text-xs text-gray-500">
                    {customization.logoSize || 40}px
                  </span>
                </div>
                
                <div className="space-y-4">
                  {/* Logo Preview */}
                  <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
                    <img
                      src={customization.logoUrl}
                      alt="Logo preview"
                      style={{ height: `${customization.logoSize || 40}px` }}
                      className="w-auto object-contain"
                    />
                  </div>
                  
                  {/* Size Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Small (20px)</span>
                      <span>Large (120px)</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="5"
                      value={customization.logoSize || 40}
                      onChange={(e) => handleLogoSizeChange(Number(e.target.value))}
                      disabled={logoSizeLoading}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((customization.logoSize || 40) - 20) / (120 - 20) * 100}%, #E5E7EB ${((customization.logoSize || 40) - 20) / (120 - 20) * 100}%, #E5E7EB 100%)`
                      }}
                    />
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-900">
                        {customization.logoSize || 40}px
                      </span>
                    </div>
                  </div>
                </div>
                
                {logoSizeLoading && (
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      Updating logo size...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload New Logo */}
            <div className="border-2 border-gray-300 border-dashed rounded-lg">
              <div className="text-center py-6">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {logoLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {logoLoading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Theme Management
            </h3>
            <button
              onClick={() => {
                setEditingTheme(null);
                setNewTheme({
                  name: '',
                  colors: {
                    primary: '#3B82F6',
                    secondary: '#1E40AF',
                    accent: '#F59E0B',
                    background: '#F9FAFB',
                    surface: '#FFFFFF',
                    text: '#111827',
                    textSecondary: '#6B7280',
                    border: '#E5E7EB',
                    success: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444',
                    info: '#3B82F6'
                  }
                });
                setShowCreateThemeModal(true);
              }}
              disabled={themes.custom.length >= 10}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Theme
            </button>
          </div>

          {/* Predefined Themes */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">
                Predefined Themes
              </h4>
              {selectedThemeId && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedThemeId(null)}
                    disabled={themeLoading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyTheme}
                    disabled={themeLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {themeLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Apply Theme
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {selectedThemeId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Theme selected:</span> You have selected a theme. Click "Apply Theme" to confirm your choice.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.predefined.map((theme) => {
                const isActive = customization?.activeTheme?._id === theme._id;
                const isSelected = selectedThemeId === theme._id;
                
                return (
                  <div
                    key={theme._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      isActive
                        ? 'border-green-500 bg-green-50'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleThemeSelect(theme._id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">{theme.name}</h5>
                      <div className="flex items-center space-x-1">
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </span>
                        )}
                        {isSelected && !isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                    {getThemePreview(theme.colors)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Themes */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Custom Themes ({themes.custom.length}/10)
            </h4>
            {themes.custom.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.custom.map((theme) => {
                  const isActive = customization?.activeTheme?._id === theme._id;
                  const isSelected = selectedThemeId === theme._id;
                  
                  return (
                    <div
                      key={theme._id}
                      className={`border rounded-lg p-4 transition-all ${
                        isActive
                          ? 'border-green-500 bg-green-50'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{theme.name}</h5>
                        <div className="flex items-center space-x-1">
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          )}
                          {isSelected && !isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Selected
                            </span>
                          )}
                          <button
                            onClick={() => handleEditCustomTheme(theme)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit theme"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomTheme(theme._id, theme.name)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete theme"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    {getThemePreview(theme.colors)}
                    <div
                      className={`mt-2 text-center py-2 rounded cursor-pointer transition-all ${
                        selectedThemeId === theme._id 
                          ? 'ring-2 ring-blue-500 ring-offset-2' 
                          : ''
                      }`}
                      style={{ backgroundColor: theme.colors.primary }}
                      onClick={() => handleThemeSelect(theme._id)}
                    >
                      <span className="text-white text-xs font-medium">
                        {customization?.activeTheme?._id === theme._id 
                          ? 'Active Theme' 
                          : selectedThemeId === theme._id
                          ? 'Selected'
                          : 'Select Theme'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created by {theme.createdBy?.name || 'Unknown'}
                    </p>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Palette className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No custom themes created yet</p>
                <p className="text-sm">Create your first custom theme to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Custom Theme Modal */}
      {showCreateThemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-full overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTheme ? 'Edit Custom Theme' : 'Create Custom Theme'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateThemeModal(false);
                    setEditingTheme(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Theme Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme Name
                  </label>
                  <input
                    type="text"
                    value={newTheme.name}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter theme name"
                  />
                </div>

                {/* Color Palette */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Color Palette
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(newTheme.colors).map(([colorKey, colorValue]) => (
                      <div key={colorKey} className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600 capitalize">
                          {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={colorValue}
                            onChange={(e) => handleColorChange(colorKey, e.target.value)}
                            className="h-8 w-16 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={colorValue}
                            onChange={(e) => handleColorChange(colorKey, e.target.value)}
                            className="flex-1 text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="border rounded-lg p-4" style={{ backgroundColor: newTheme.colors.background }}>
                    <div className="space-y-3">
                      <div 
                        className="p-3 rounded" 
                        style={{ backgroundColor: newTheme.colors.surface, borderColor: newTheme.colors.border }}
                      >
                        <h4 style={{ color: newTheme.colors.text }} className="font-medium">
                          Sample Card
                        </h4>
                        <p style={{ color: newTheme.colors.textSecondary }} className="text-sm">
                          This is how your theme will look
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <button 
                            style={{ backgroundColor: newTheme.colors.primary, color: '#FFFFFF' }}
                            className="px-3 py-1 rounded text-xs"
                          >
                            Primary Button
                          </button>
                          <button 
                            style={{ backgroundColor: newTheme.colors.accent, color: '#FFFFFF' }}
                            className="px-3 py-1 rounded text-xs"
                          >
                            Accent Button
                          </button>
                        </div>
                      </div>
                      {getThemePreview(newTheme.colors)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowCreateThemeModal(false);
                    setEditingTheme(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomTheme}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  {editingTheme ? 'Update Theme' : 'Create Theme'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customization; 