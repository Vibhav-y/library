import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Wifi, 
  Coffee, 
  Car, 
  Shield, 
  Zap, 
  Users, 
  Clock, 
  Star,
  ChevronLeft,
  ChevronRight,
  LogIn,
  Volume2,
  BookOpen,
  GraduationCap,
  Award,
  Menu,
  X
} from 'lucide-react';
import { useCustomization } from '../contexts/CustomizationContext';
import { announcementAPI, galleryAPI, libraryAPI } from '../services/api';

const LandingPage = () => {
  const { customization, loading: customizationLoading } = useCustomization();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState({});
  const [libraryConfig, setLibraryConfig] = useState(null);
  const observerRef = useRef();

  // Default fallback images if no gallery images are uploaded
  const defaultGalleryImages = [
    {
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
      title: 'Modern Libraries',
      description: 'Empowering libraries with cutting-edge technology'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop',
      title: 'Cloud Platform',
      description: 'Scalable solutions for growing library networks'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
      title: 'Digital Transformation',
      description: 'Transforming traditional libraries into digital hubs'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
      title: 'Smart Analytics',
      description: 'Data-driven insights for better library management'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop',
      title: 'Team Collaboration',
      description: 'Seamless communication and management tools'
    }
  ];

  const facilities = [
    { icon: Users, title: 'Multi-Tenant Support', description: 'Manage multiple libraries from one platform', color: 'from-blue-500 to-blue-600' },
    { icon: BookOpen, title: 'Digital Documents', description: 'Cloud-based document management system', color: 'from-green-500 to-green-600' },
    { icon: Wifi, title: 'Real-time Chat', description: 'Instant messaging for library communities', color: 'from-cyan-500 to-cyan-600' },
    { icon: Coffee, title: 'Smart Analytics', description: 'Comprehensive insights and reporting', color: 'from-orange-500 to-orange-600' },
    { icon: Volume2, title: 'Announcements', description: 'Broadcast important messages instantly', color: 'from-purple-500 to-purple-600' },
    { icon: Shield, title: 'Secure & Reliable', description: 'Enterprise-grade security and uptime', color: 'from-red-500 to-red-600' },
    { icon: Zap, title: 'Quick Setup', description: 'Get your library online in minutes', color: 'from-yellow-500 to-yellow-600' },
    { icon: Clock, title: 'Seat Management', description: 'Automated seat booking and scheduling', color: 'from-indigo-500 to-indigo-600' },
    { icon: Car, title: 'Mobile Ready', description: 'Access from any device, anywhere', color: 'from-gray-500 to-gray-600' },
    { icon: Star, title: 'Custom Branding', description: 'Personalize with your library\'s identity', color: 'from-pink-500 to-pink-600' },
    { icon: GraduationCap, title: 'User Management', description: 'Role-based access and permissions', color: 'from-teal-500 to-teal-600' },
    { icon: Award, title: 'Scalable Solution', description: 'Grows with your library network', color: 'from-rose-500 to-rose-600' }
  ];

  // Rotate gallery images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [galleryImages.length]);

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await announcementAPI.getPublicAnnouncements();
        const formattedAnnouncements = data.map(announcement => ({
          id: announcement._id,
          title: announcement.title,
          content: announcement.content,
          date: new Date(announcement.createdAt).toLocaleDateString()
        }));
        setAnnouncements(formattedAnnouncements);
      } catch (error) {
        console.error('Error loading announcements:', error);
        // Fallback to empty array if API fails
        setAnnouncements([]);
      }
    };

    loadAnnouncements();
  }, []);

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const data = await galleryAPI.getPublicImages();
        if (data && data.length > 0) {
          setGalleryImages(data);
        } else {
          // Use default images if no custom images are uploaded
          setGalleryImages(defaultGalleryImages);
        }
      } catch (error) {
        console.error('Error loading gallery images:', error);
        // Fallback to default images if API fails
        setGalleryImages(defaultGalleryImages);
      }
    };

    loadGalleryImages();
  }, []);

  // Load library configuration
  useEffect(() => {
    // Set default configuration - gallery visible by default
    // This ensures the landing page works even without authentication
    setLibraryConfig({
      features: {
        galleryVisibleOnHomepage: true
      }
    });

    // Optionally try to load library-specific configuration
    // This is a best-effort attempt and won't break the page if it fails
    const loadLibraryConfig = async () => {
      try {
        const data = await libraryAPI.getCurrent();
        setLibraryConfig(data);
      } catch (error) {
        // Silently fail - we already have defaults set
        console.log('Library configuration not available (this is normal for public access)');
      }
    };

    loadLibraryConfig();
  }, []);

  // Optional: Advanced scroll animations can be added later
  useEffect(() => {
    // Set all elements as visible immediately for now
    setIsVisible({
      'hero-content': true,
      'facilities-header': true,
      'stats-section': true,
      'location-header': true,
      'map-section': true,
      'announcements-section': true,
      'gallery-header': true,
      'gallery-container': true,
      'footer-contact': true,
      'footer-hours': true,
      'footer-links': true,
      'footer-social': true,
      'footer-bottom': true
    });
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? galleryImages.length - 1 : prevIndex - 1
    );
  };

  if (customizationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center transform transition-transform duration-300 hover:scale-105">
              {(customization?.logoUrl && customization?.showLogo !== false) ? (
                <div className="flex items-center">
                  <img
                    src={customization.logoUrl}
                    alt="Library Logo"
                    className="h-10 w-auto max-w-40 object-contain"
                    style={{ 
                      height: customization?.logoSize ? `${customization.logoSize}px` : '40px',
                      maxHeight: '60px'
                    }}
                  />
                  <span className="ml-3 text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {customization?.systemName || 'LibraFlow'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">L</span>
                  </div>
                  <span className="ml-3 text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {customization?.systemName || 'LibraFlow'}
                  </span>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Desktop Login Button */}
            <Link
              to="/login"
              className="hidden md:inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Link>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-xl border-t border-gray-200 animate-slide-down">
              <div className="px-4 py-4">
                <Link
                  to="/login"
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
          <div className="absolute inset-0 bg-black/20"></div>
          {/* Floating Animation Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-white/5 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute bottom-20 right-1/3 w-8 h-8 bg-white/5 rounded-full animate-float-delayed"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div 
            id="hero-content" 
            data-animate
            className="transform transition-all duration-1000 translate-y-0 opacity-100"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Welcome to
              </span>
              <span className="block bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                {customization?.systemName || 'LibraFlow'}
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl mb-8 text-blue-100 font-light max-w-4xl mx-auto leading-relaxed">
              The Ultimate SaaS Platform for Modern Library Management
            </p>
            
            <p className="text-base sm:text-lg md:text-xl text-blue-200 max-w-3xl mx-auto mb-12 leading-relaxed">
              Empower multiple libraries with one powerful platform. Streamline operations, enhance user experience, 
              and scale your library management with our cloud-based solution designed for the digital age.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                to="/login"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-2xl hover:from-yellow-300 hover:to-orange-400 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-yellow-500/25"
              >
                <LogIn className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Access Your Library
              </Link>
              
              <button className="group inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300">
                <BookOpen className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Platform Features
              </button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full p-1">
              <div className="w-1 h-3 bg-white/70 rounded-full mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Facilities Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            id="facilities-header" 
            data-animate
            className="text-center mb-16 transform transition-all duration-1000 translate-y-0 opacity-100"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Powerful Platform Features
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to manage multiple libraries efficiently with our comprehensive SaaS solution
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {facilities.map((facility, index) => (
              <div
                key={index}
                id={`facility-${index}`}
                data-animate
                className="group relative bg-white rounded-2xl p-6 text-center hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-transparent transform hover:-translate-y-2 translate-y-0 opacity-100"
                style={{ 
                  transitionDelay: `${index * 100}ms`,
                  animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${facility.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                
                {/* Icon */}
                <div className={`relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${facility.color} text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <facility.icon className="h-8 w-8" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                  {facility.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {facility.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 m-4"></div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div 
            id="stats-section"
            data-animate
            className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8 transform transition-all duration-1000 translate-y-0 opacity-100"
          >
            {[
              { number: '50+', label: 'Libraries Served', icon: Users },
              { number: '24/7', label: 'Platform Uptime', icon: Clock },
              { number: '100K+', label: 'Documents Managed', icon: BookOpen },
              { number: '99.9%', label: 'Customer Satisfaction', icon: Star }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stat.number}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Map and Announcements Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full opacity-10 transform -translate-x-24 translate-y-24"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            id="location-header"
            data-animate
            className="text-center mb-16 transform transition-all duration-1000 translate-y-0 opacity-100"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-800 via-green-600 to-blue-600 bg-clip-text text-transparent">
                Ready to Get Started?
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of libraries already using LibraFlow. Contact us to learn more or access your library portal
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact & Support */}
            <div 
              id="contact-section"
              data-animate
              className="group bg-white rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-500 transform translate-x-0 opacity-100"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Get in Touch
              </h3>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Ready to Transform Your Library?</h4>
                  <p className="text-gray-600 mb-4">Join the growing network of modern libraries using LibraFlow.</p>
                  <Link 
                    to="/login"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Access Your Library
                  </Link>
                </div>
                
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">💬</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">Live Chat:</span> Available 24/7
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✉️</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">Email:</span> support@libraflow.com
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">🌐</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">Demo:</span> Schedule a free demo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Announcements */}
            <div 
              id="announcements-section"
              data-animate
              className="group bg-white rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-500 transform translate-x-0 opacity-100"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mr-3">
                  <Volume2 className="h-6 w-6 text-white" />
                </div>
                Platform Updates
              </h3>
              
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {announcements.map((announcement, index) => (
                  <div
                    key={announcement.id}
                    className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out both'
                    }}
                  >
                    <div className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                    <h4 className="font-bold text-gray-800 mb-2 pr-6">
                      {announcement.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                      {announcement.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-lg">
                        {announcement.date}
                      </span>
                      <span className="text-xs text-gray-400">New</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {announcements.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Volume2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">No announcements</p>
                  <p className="text-sm">Check back soon for updates!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modern Image Gallery */}
      {libraryConfig?.features?.galleryVisibleOnHomepage !== false && (
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            id="gallery-header"
            data-animate
            className="text-center mb-16 transform transition-all duration-1000 translate-y-0 opacity-100"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-800 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Explore Our Library
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Take a visual tour of our modern facilities and inspiring learning spaces
            </p>
          </div>

          <div 
            id="gallery-container"
            data-animate
            className="relative max-w-5xl mx-auto transform transition-all duration-1000 scale-100 opacity-100"
          >
            {/* Main Image Container */}
            <div className="relative group">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={galleryImages[currentImageIndex]?.imageUrl}
                  alt={galleryImages[currentImageIndex]?.title}
                  className="w-full h-96 sm:h-[500px] object-cover transition-all duration-700 transform group-hover:scale-105"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                      {galleryImages[currentImageIndex]?.title}
                    </h3>
                    <p className="text-white/90 text-sm sm:text-base drop-shadow-lg">
                      {galleryImages[currentImageIndex]?.description || 'Modern facilities designed for academic excellence'}
                    </p>
                  </div>
                </div>

                {/* Image Counter */}
                <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-white text-sm font-medium">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </span>
                </div>
              </div>

              {/* Enhanced Navigation Buttons */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Enhanced Dots Indicator */}
            <div className="flex justify-center mt-8 space-x-3">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-4 h-4 rounded-full transition-all duration-300 focus:outline-none ${
                    index === currentImageIndex 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-125 shadow-lg' 
                      : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                  }`}
                >
                  {index === currentImageIndex && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-75"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Thumbnail Preview */}
            <div className="mt-8 hidden sm:block">
              <div className="flex space-x-4 justify-center overflow-x-auto pb-4">
                {galleryImages.map((image, index) => (
                  <button
                    key={image._id || index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'ring-4 ring-blue-500 scale-110' 
                        : 'ring-2 ring-gray-200 hover:ring-gray-300 hover:scale-105'
                    }`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {index === currentImageIndex && (
                      <div className="absolute inset-0 bg-blue-500/20"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Modern Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/20 to-purple-600/20 rounded-full blur-3xl transform translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-green-600/20 to-blue-600/20 rounded-full blur-3xl transform -translate-x-40 translate-y-40"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Contact Information */}
            <div 
              id="footer-contact"
              data-animate
              className="transform transition-all duration-1000 translate-y-0 opacity-100"
            >
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Gulalpur bazar, patti-chanda road<br />
                      Chanda, Sultanpur, Uttar Pradesh
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">📞</span>
                  </div>
                  <p className="text-gray-300 text-sm">+91 88969 63484</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✉️</span>
                  </div>
                  <p className="text-gray-300 text-sm">info@shreesundaraml.org</p>
                </div>
              </div>
            </div>
            
            {/* Library Hours */}
            <div 
              id="footer-hours"
              data-animate
              className="transform transition-all duration-1000 translate-y-0 opacity-100"
              style={{ transitionDelay: '100ms' }}
            >
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Library Hours
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Monday - Friday</span>
                  <span className="text-white text-sm font-medium">6:00 AM - 11:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Saturday</span>
                  <span className="text-white text-sm font-medium">7:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Sunday</span>
                  <span className="text-white text-sm font-medium">8:00 AM - 9:00 PM</span>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div 
              id="footer-links"
              data-animate
              className="transform transition-all duration-1000 translate-y-0 opacity-100"
              style={{ transitionDelay: '200ms' }}
            >
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/login" 
                    className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300"
                  >
                    <LogIn className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Member Login</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/master-admin-login" 
                    className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300"
                  >
                    <Shield className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Master Admin</span>
                  </Link>
                </li>
                <li className="flex items-center space-x-2 text-gray-300">
                  <BookOpen className="h-4 w-4" />
                  <span>Digital Resources</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-300">
                  <Clock className="h-4 w-4" />
                  <span>Study Room Booking</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-300">
                  <Shield className="h-4 w-4" />
                  <span>Library Rules</span>
                </li>
              </ul>
            </div>

            {/* Newsletter & Social */}
            <div 
              id="footer-social"
              data-animate
              className="transform transition-all duration-1000 translate-y-0 opacity-100"
              style={{ transitionDelay: '300ms' }}
            >
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Stay Connected
              </h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                Get the latest updates about platform features, new releases, and system announcements.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Join Now
              </Link>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div 
            id="footer-bottom"
            data-animate
            className="border-t border-gray-700 pt-8 transform transition-all duration-1000 translate-y-0 opacity-100"
            style={{ transitionDelay: '400ms' }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} {customization?.systemName || 'LibraFlow'}. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <span className="text-gray-400 text-sm">Made with</span>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-400 text-sm">for libraries</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 