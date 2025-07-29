import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  // Default accessibility settings
  const [settings, setSettings] = useState({
    fontSize: 100,        // Base font size percentage (50% to 200%)
    zoom: 100,           // Page zoom percentage (75% to 150%)
    lineHeight: 150,     // Line height percentage (100% to 250%)
    letterSpacing: 0,    // Letter spacing in pixels (-2 to 5)
    wordSpacing: 0,      // Word spacing in pixels (-2 to 10)
    highContrast: false, // High contrast mode
    darkMode: false,     // Dark mode (different from theme dark mode)
    dyslexiaFont: false, // Dyslexia-friendly font
    reduceMotion: false, // Reduce animations
    focusOutline: false, // Enhanced focus outlines
    readingMode: false,  // Reading mode (simplified layout)
    colorBlindMode: 'none' // Color blind assistance: 'none', 'protanopia', 'deuteranopia', 'tritanopia'
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Apply settings whenever they change
  useEffect(() => {
    if (!isLoading) {
      applySettings(settings);
      saveSettings(settings);
    }
  }, [settings, isLoading]);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('accessibilitySettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = (newSettings) => {
    try {
      localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const applySettings = (newSettings) => {
    const root = document.documentElement;
    const body = document.body;

    // Apply font size
    root.style.setProperty('--accessibility-font-size', `${newSettings.fontSize}%`);
    
    // Apply zoom
    root.style.setProperty('--accessibility-zoom', `${newSettings.zoom}%`);
    body.style.zoom = `${newSettings.zoom}%`;
    
    // Apply line height
    root.style.setProperty('--accessibility-line-height', `${newSettings.lineHeight}%`);
    
    // Apply letter spacing
    root.style.setProperty('--accessibility-letter-spacing', `${newSettings.letterSpacing}px`);
    
    // Apply word spacing
    root.style.setProperty('--accessibility-word-spacing', `${newSettings.wordSpacing}px`);

    // Apply accessibility classes
    body.classList.toggle('accessibility-high-contrast', newSettings.highContrast);
    body.classList.toggle('accessibility-dark-mode', newSettings.darkMode);
    body.classList.toggle('accessibility-dyslexia-font', newSettings.dyslexiaFont);
    body.classList.toggle('accessibility-reduce-motion', newSettings.reduceMotion);
    body.classList.toggle('accessibility-focus-outline', newSettings.focusOutline);
    body.classList.toggle('accessibility-reading-mode', newSettings.readingMode);
    
    // Color blind modes
    body.classList.remove('accessibility-protanopia', 'accessibility-deuteranopia', 'accessibility-tritanopia');
    if (newSettings.colorBlindMode !== 'none') {
      body.classList.add(`accessibility-${newSettings.colorBlindMode}`);
    }

    // Set CSS custom properties for relative sizing
    root.style.setProperty('--base-font-size', `${16 * (newSettings.fontSize / 100)}px`);
    root.style.setProperty('--base-line-height', `${newSettings.lineHeight / 100}`);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    const defaultSettings = {
      fontSize: 100,
      zoom: 100,
      lineHeight: 150,
      letterSpacing: 0,
      wordSpacing: 0,
      highContrast: false,
      darkMode: false,
      dyslexiaFont: false,
      reduceMotion: false,
      focusOutline: false,
      readingMode: false,
      colorBlindMode: 'none'
    };
    setSettings(defaultSettings);
  };

  const getReadingModeStyles = () => {
    if (!settings.readingMode) return {};
    
    return {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: settings.darkMode ? '#1a1a1a' : '#ffffff',
      color: settings.darkMode ? '#ffffff' : '#000000',
      lineHeight: '1.8',
      fontSize: '1.1em'
    };
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
    getReadingModeStyles,
    isLoading
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}; 