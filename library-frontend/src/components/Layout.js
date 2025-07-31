import React, { useState } from 'react';
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
  Camera,
  Lightbulb
} from 'lucide-react';

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
      { name: 'Thoughts', href: '/thoughts', icon: Lightbulb },
    ] : []),
    ...(isAdmin ? [
      { name: 'Upload Document', href: '/upload', icon: Upload },
      { name: 'Manage Users', href: '/users', icon: Users },
      { name: 'Categories', href: '/categories', icon: FolderOpen },
      { name: 'Fee Management', href: '/fees', icon: DollarSign },
      { name: 'Notices', href: '/notices', icon: Bell },
      { name: 'Thoughts', href: '/thoughts', icon: Lightbulb },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
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
      <div className={`fixed inset-0 flex z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full">
          <div className="relative bg-white shadow-2xl h-full">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/90 text-gray-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 mb-5">
                {renderSystemBranding(true)}
              </div>
              <nav className="px-3 space-y-1">
                {navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-40">
        <div className="relative flex-1 flex flex-col min-h-0">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-md shadow-2xl border-r border-white/20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/70"></div>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 blur-3xl"></div>
          <div className="relative flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6 mb-8">
              {renderSystemBranding(false)}
            </div>
            <nav className="flex-1 px-4 space-y-1.5">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105 border border-blue-400/20'
                      : 'text-gray-700 hover:bg-white/70 hover:shadow-lg hover:scale-105 hover:border-white/40 border border-transparent'
                  }`}
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <div className={`mr-3 p-1.5 rounded-xl transition-all duration-300 ${
                    isActive(item.href) 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 group-hover:bg-white group-hover:shadow-md'
                  }`}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <span className="truncate font-medium">{item.name}</span>
                  {isActive(item.href) && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-sm"></div>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Mobile header with menu button */}
        <div className="sticky top-0 z-40 lg:hidden bg-white shadow-xl border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 truncate px-4">
              {systemName || 'Library Management System'}
            </h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Desktop Header */}
        <header className="hidden lg:block bg-white/80 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/70"></div>
            <div className="absolute top-0 right-0 w-64 h-20 bg-gradient-to-l from-blue-400/10 to-purple-400/10 blur-2xl"></div>
            <div className="relative max-w-7xl mx-auto py-6 px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                    Welcome, {user?.name || user?.email}
                  </h1>
                  <p className="text-base text-gray-600 capitalize mt-1 flex items-center">
                    <div className="h-2 w-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-2"></div>
                    {user?.email} • Role: <span className="font-semibold ml-1">{user?.role}</span>
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={handleLogout}
                    className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-300"
                  >
                    <LogOut className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 