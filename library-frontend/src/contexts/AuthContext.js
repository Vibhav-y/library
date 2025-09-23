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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Master admin flows
  const godLogin = async (email, password) => {
    try {
      const response = await authAPI.godLogin(email, password);
      // Store master token separately to avoid overriding normal token
      localStorage.setItem('god_token', response.token);
      localStorage.setItem('god_user', JSON.stringify(response.user));
      // Set app user context so ProtectedRoutes and UI work in master mode
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const godImpersonate = async (libraryId) => {
    try {
      const godToken = localStorage.getItem('god_token');
      if (!godToken) return { success: false, error: 'Not authenticated as god admin' };
      const data = await authAPI.godImpersonate(godToken, libraryId);
      // Set acting token as normal token; keep god token intact
      localStorage.setItem('token', data.token);
      // Preserve the current user but flag acting library
      const acting = { ...(JSON.parse(localStorage.getItem('god_user')) || {}), actingLibrary: data.library };
      localStorage.setItem('user', JSON.stringify(acting));
      setUser(acting);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Impersonation failed' };
    }
  };

  const godLogout = () => {
    localStorage.removeItem('god_token');
    localStorage.removeItem('god_user');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    isManager: user?.role === 'manager',
    isAdminOrManager: user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager',
    // Master mode if superadmin logged in via master login and not impersonating a library
    isGodMode: user?.role === 'superadmin' && !user?.actingLibrary && !!localStorage.getItem('god_token'),
    godLogin,
    godLogout,
    godImpersonate
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 