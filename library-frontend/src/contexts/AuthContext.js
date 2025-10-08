import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentLibrary, setCurrentLibrary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const libraryData = localStorage.getItem('library');
    
    console.log('🚀 AuthContext: Initializing from localStorage');
    console.log('🔑 Token exists:', !!token);
    console.log('👤 User data:', userData);
    console.log('🏛️ Library data:', libraryData);
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      if (libraryData) {
        setCurrentLibrary(JSON.parse(libraryData));
        console.log('✅ AuthContext: Library data loaded from localStorage');
      } else {
        console.log('❌ AuthContext: No library data in localStorage');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user: userData, library: libraryData } = response;
      
      console.log('🔐 AuthContext: Login response:', response);
      console.log('👤 AuthContext: User data:', userData);
      console.log('🏛️ AuthContext: Library data:', libraryData);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      if (libraryData) {
        localStorage.setItem('library', JSON.stringify(libraryData));
        setCurrentLibrary(libraryData);
        console.log('✅ AuthContext: Library data stored successfully');
      } else {
        console.log('❌ AuthContext: No library data in response');
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Master admin flows
  const masterLogin = async (email, password) => {
    try {
      console.log('AuthContext: Attempting master login API call'); // Debug
      const response = await authAPI.masterLogin(email, password);
      console.log('AuthContext: Master login API response:', response); // Debug
      
      // Store master token separately to avoid overriding normal token
      localStorage.setItem('master_token', response.token);
      localStorage.setItem('master_user', JSON.stringify(response.user));
      // Set app user context so ProtectedRoutes and UI work in master mode
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      console.log('AuthContext: Master login successful, tokens stored'); // Debug
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Master login failed:', error); // Debug
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const masterImpersonate = async (libraryId) => {
    try {
      const masterToken = localStorage.getItem('master_token');
      if (!masterToken) return { success: false, error: 'Not authenticated as master admin' };
      const data = await authAPI.masterImpersonate(masterToken, libraryId);
      // Set acting token as normal token; keep master token intact
      localStorage.setItem('token', data.token);
      // Preserve the current user but flag acting library
      const acting = { ...(JSON.parse(localStorage.getItem('master_user')) || {}), actingLibrary: data.library };
      localStorage.setItem('user', JSON.stringify(acting));
      setUser(acting);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Impersonation failed' };
    }
  };

  const masterLogout = () => {
    localStorage.removeItem('master_token');
    localStorage.removeItem('master_user');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('library');
    setUser(null);
    setCurrentLibrary(null);
  };

  const value = {
    user,
    currentLibrary,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    isManager: user?.role === 'manager',
    isAdminOrManager: user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager',
    // Master mode if superadmin logged in via master login and not impersonating a library
    isGodMode: user?.role === 'superadmin' && !user?.actingLibrary && !!localStorage.getItem('master_token'),
    masterLogin,
    masterLogout,
    masterImpersonate
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 