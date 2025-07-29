import React, { createContext, useContext, useState, useEffect } from 'react';
import { customizationAPI } from '../services/api';

const CustomizationContext = createContext();

export const useCustomization = () => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};

export const CustomizationProvider = ({ children }) => {
  const [customization, setCustomization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default theme colors (fallback)
  const defaultTheme = {
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
  };

  const loadCustomization = async () => {
    try {
      setLoading(true);
      const data = await customizationAPI.get();
      setCustomization(data);
      setError(null);
      
      // Apply theme to CSS variables
      if (data.activeTheme?.colors) {
        applyTheme(data.activeTheme.colors);
      } else {
        applyTheme(defaultTheme.colors);
      }
    } catch (err) {
      console.error('Error loading customization:', err);
      
      // If it's a 404 error (no customization exists), that's normal for first time
      if (err.response?.status === 404) {
        console.log('No customization found, using defaults');
      } else {
        setError(err.message);
      }
      
      // Always apply default theme and settings when API fails
      applyTheme(defaultTheme.colors);
      
      // Set default customization
      setCustomization({
        systemName: 'Library System',
        showLogo: false,
        logoUrl: null,
        activeTheme: defaultTheme
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (colors) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });
    
    // Apply Tailwind-compatible classes through CSS variables
    root.style.setProperty('--tw-color-primary', colors.primary);
    root.style.setProperty('--tw-color-secondary', colors.secondary);
    root.style.setProperty('--tw-color-accent', colors.accent);
    root.style.setProperty('--tw-color-surface', colors.surface);
    root.style.setProperty('--tw-color-background', colors.background);
    
    // Force update body background
    document.body.style.backgroundColor = colors.background;
  };

  const refreshCustomization = () => {
    loadCustomization();
  };

  const getSystemName = () => {
    return customization?.systemName || 'Library System';
  };

  const getLogo = () => {
    if (customization?.showLogo && customization?.logoUrl) {
      return {
        url: customization.logoUrl,
        name: customization.logoName || 'Logo',
        size: customization.logoSize || 40
      };
    }
    return null;
  };

  const getThemeColors = () => {
    return customization?.activeTheme?.colors || defaultTheme.colors;
  };

  const isThemeLoaded = () => {
    return !loading && customization !== null;
  };

  useEffect(() => {
    loadCustomization();
  }, []);

  const value = {
    customization,
    loading,
    error,
    refreshCustomization,
    getSystemName,
    getLogo,
    getThemeColors,
    isThemeLoaded
  };

  return (
    <CustomizationContext.Provider value={value}>
      {children}
    </CustomizationContext.Provider>
  );
}; 