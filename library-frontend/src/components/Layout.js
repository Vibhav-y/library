import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCustomization } from '../contexts/CustomizationContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import NoticeDisplay from './NoticeDisplay';
import { 
  LogOut, 
  Home, 
  FileText, 
  Users, 
  FolderOpen, 
  Upload,
  Menu,
  X,
  Star,
  Bell,
  Settings,
  Accessibility,
  User,
  DollarSign,
  Volume2,
  Camera
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { getSystemName, getLogo, getThemeColors } = useCustomization();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const systemName = getSystemName();
  const logo = getLogo();
  const themeColors = getThemeColors();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    ...(user?.role === 'student' ? [
      { name: 'Profile', href: '/profile', icon: User },
    ] : []),
    ...(user?.role !== 'manager' ? [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Documents', href: '/documents', icon: FileText },
    ] : []),
    ...(user?.role === 'student' ? [
      { name: 'Favorites', href: '/favorites', icon: Star },
      { name: 'Notices', href: '/notices-tab', icon: Bell },
      { name: 'Accessibility', href: '/accessibility', icon: Accessibility },
    ] : []),
    ...(user?.role === 'manager' ? [
      { name: 'Manage Users', href: '/users', icon: Users },
      { name: 'Fee Management', href: '/fees', icon: DollarSign },
      { name: 'Notices', href: '/notices', icon: Bell },
    ] : []),
    ...(isAdmin ? [
      { name: 'Upload Document', href: '/upload', icon: Upload },
      { name: 'Manage Users', href: '/users', icon: Users },
      { name: 'Categories', href: '/categories', icon: FolderOpen },
      { name: 'Fee Management', href: '/fees', icon: DollarSign },
      { name: 'Notices', href: '/notices', icon: Bell },
      { name: 'Announcements', href: '/announcements', icon: Volume2 },
      { name: 'Gallery', href: '/gallery', icon: Camera },
      { name: 'Customization', href: '/customization', icon: Settings },
      { name: 'Accessibility', href: '/accessibility', icon: Accessibility },
    ] : []),
  ];

  const isActive = (path) => location.pathname === path;
  
  const getLogoSizeStyle = (logoSize) => {
    // Use fixed size from customization, no mobile scaling
    const size = Number(logoSize) || 40;
    
    return {
      height: `${size}px`,
      width: 'auto'
    };
  };
  
  const renderSystemBranding = (isMobile = false) => {
    if (logo) {
      const logoSizeStyle = getLogoSizeStyle(logo.size);
      return (
        <div className="flex items-center">
          <img
            src={logo.url}
            alt={logo.name}
            className="w-auto object-contain"
            style={logoSizeStyle}
          />
          {!isMobile && (
            <span className="ml-3 text-xl font-bold text-gray-900">{systemName}</span>
          )}
        </div>
      );
    }
    
    return (
      <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
        {systemName}
      </h1>
    );
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* SVG Filters for Color Blindness Support */}
      <svg className="accessibility-filters" aria-hidden="true">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0,     0, 0
                                                 0.558, 0.442, 0,     0, 0
                                                 0,     0.242, 0.758, 0, 0
                                                 0,     0,     0,     1, 0"/>
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0,   0, 0
                                                 0.7,   0.3,   0,   0, 0
                                                 0,     0.3,   0.7, 0, 0
                                                 0,     0,     0,   1, 0"/>
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05,  0,     0, 0
                                                 0,    0.433, 0.567, 0, 0
                                                 0,    0.475, 0.525, 0, 0
                                                 0,    0,     0,     1, 0"/>
          </filter>
        </defs>
      </svg>
      
      {/* Notice Display */}
      <NoticeDisplay />
      
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div 
          className="relative flex-1 flex flex-col max-w-xs w-full shadow-xl"
          style={{ backgroundColor: themeColors.surface }}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 mb-4">
              {renderSystemBranding(true)}
            </div>
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'theme-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-150`}
                  style={isActive(item.href) ? { backgroundColor: themeColors.primary, color: 'white' } : {}}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

              {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div 
          className="flex-1 flex flex-col min-h-0 border-r shadow-sm"
          style={{ 
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border
          }}
        >
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-4">
              {renderSystemBranding(false)}
            </div>
            <nav 
              className="flex-1 px-2 space-y-1"
              style={{ backgroundColor: themeColors.surface }}
            >
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'theme-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150`}
                  style={isActive(item.href) ? { backgroundColor: themeColors.primary, color: 'white' } : {}}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header with menu button */}
        <div 
          className="sticky top-0 z-10 lg:hidden shadow-sm border-b"
          style={{ 
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="inline-flex items-center justify-center h-10 w-10 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {systemName}
            </h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Desktop Header */}
        <header 
          className="hidden lg:block shadow-sm"
          style={{ backgroundColor: themeColors.surface }}
        >
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  Welcome, {user?.name || user?.email}
                </h1>
                <p className="text-sm text-gray-600 capitalize">
                  {user?.email} • Role: {user?.role}
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0">
          <div className="h-full max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 