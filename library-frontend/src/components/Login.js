import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertTriangle, ArrowLeft, Shield, Users, BookOpen } from 'lucide-react';
import { useCustomization } from '../contexts/CustomizationContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [expiredMessage, setExpiredMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { customization, loading: customizationLoading } = useCustomization();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for expired account message
    const expiredMsg = localStorage.getItem('expiredMessage');
    if (expiredMsg) {
      setExpiredMessage(expiredMsg);
      localStorage.removeItem('expiredMessage');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExpiredMessage('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
              // Get user data from localStorage to check role
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData?.role === 'manager') {
          navigate('/users');
        } else {
          navigate('/dashboard');
        }
    } else {
      // Check if it's an expired account error
      if (result.error && result.error.includes('expired')) {
        setExpiredMessage(result.error);
      } else {
        setError(result.error);
      }
    }
    
    setLoading(false);
  };

  if (customizationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating Animation Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-white/5 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/2 left-20 w-12 h-12 bg-white/5 rounded-full animate-float"></div>
        <div className="absolute top-1/4 right-40 w-8 h-8 bg-white/10 rounded-full animate-float-delayed"></div>
      </div>

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 transform hover:scale-105"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          
          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20 transform transition-all duration-500 hover:shadow-3xl">
            
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6 transform transition-transform duration-300 hover:scale-105">
                {(customization?.logoUrl && customization?.showLogo !== false) ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={customization.logoUrl}
                      alt="Library Logo"
                      className="w-auto object-contain mb-3"
                      style={{ 
                        height: customization?.logoSize ? `${Math.min(customization.logoSize * 1.5, 80)}px` : '60px',
                        maxHeight: '80px'
                      }}
                    />
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {customization?.systemName || 'LibraFlow'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-white font-bold text-3xl">L</span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {customization?.systemName || 'LibraFlow'}
                    </span>
                  </div>
                )}
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                Welcome Back
              </h2>
              <p className="text-gray-600 text-lg">
                Sign in to access your library account
              </p>
            </div>

            {/* Alerts */}
            {expiredMessage && (
              <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-2xl animate-slide-down">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Account Expired</p>
                    <p className="text-sm mt-1">{expiredMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-4 py-4 rounded-2xl animate-slide-down">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
            
            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 text-lg group-hover:border-gray-300"
                    placeholder="Enter your email address"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-xl"></div>
                </div>
              </div>
              
              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 text-lg group-hover:border-gray-300"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-2xl transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10 blur-xl"></div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="modern-button w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-3" />
                      Sign In
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Features Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500 mb-4">Secure access to</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-2">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Documents</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Community</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-2">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Security</span>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Login; 