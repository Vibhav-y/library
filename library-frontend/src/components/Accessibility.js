import React, { useState } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { 
  Type, 
  ZoomIn, 
  Eye, 
  Contrast, 
  Moon, 
  RotateCcw, 
  Settings, 
  BookOpen,
  Focus,
  Palette,
  CheckCircle,
  AlertCircle,
  Minus,
  Plus,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const Accessibility = () => {
  const { settings, updateSetting, resetSettings, isLoading } = useAccessibility();
  const [activePreset, setActivePreset] = useState(null);

  const handleSliderChange = (key, value) => {
    updateSetting(key, parseInt(value));
  };

  const handleToggle = (key) => {
    updateSetting(key, !settings[key]);
  };

  const handlePreset = (presetName, presetSettings) => {
    Object.entries(presetSettings).forEach(([key, value]) => {
      updateSetting(key, value);
    });
    setActivePreset(presetName);
    setTimeout(() => setActivePreset(null), 2000); // Clear active state after 2 seconds
  };

  const presets = [
    {
      name: 'Default',
      description: 'Reset all settings to default',
      icon: RotateCcw,
      settings: {
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
      }
    },
    {
      name: 'Large Text',
      description: 'Larger text for better readability',
      icon: Type,
      settings: {
        fontSize: 140,
        zoom: 110,
        lineHeight: 170,
        letterSpacing: 1,
        wordSpacing: 2
      }
    },
    {
      name: 'High Contrast',
      description: 'High contrast mode for better visibility',
      icon: Contrast,
      settings: {
        highContrast: true,
        fontSize: 120,
        focusOutline: true
      }
    },
    {
      name: 'Dyslexia Friendly',
      description: 'Optimized for dyslexic users',
      icon: BookOpen,
      settings: {
        dyslexiaFont: true,
        fontSize: 120,
        lineHeight: 200,
        letterSpacing: 2,
        wordSpacing: 3,
        focusOutline: true
      }
    },
    {
      name: 'Reading Mode',
      description: 'Focused reading experience',
      icon: Eye,
      settings: {
        readingMode: true,
        fontSize: 115,
        lineHeight: 180,
        letterSpacing: 1,
        reduceMotion: true
      }
    },
    {
      name: 'Motion Sensitive',
      description: 'Reduced animations and motion',
      icon: Focus,
      settings: {
        reduceMotion: true,
        focusOutline: true
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-gray-400 mr-3" />
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Accessibility Settings
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Customize your reading and viewing experience for better accessibility.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Quick Presets
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePreset(preset.name, preset.settings)}
                className={`relative flex items-center p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                  activePreset === preset.name 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}
              >
                <preset.icon className={`h-5 w-5 mr-3 ${
                  activePreset === preset.name ? 'text-green-600' : 'text-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    activePreset === preset.name ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {preset.name}
                  </p>
                  <p className={`text-xs ${
                    activePreset === preset.name ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {preset.description}
                  </p>
                </div>
                {activePreset === preset.name && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Text and Display Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-6">
            Text and Display
          </h4>

          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size: {settings.fontSize}%
              </label>
              <div className="flex items-center space-x-3">
                <Minus className="h-4 w-4 text-gray-400" />
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={settings.fontSize}
                  onChange={(e) => handleSliderChange('fontSize', e.target.value)}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <Plus className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Zoom Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Zoom: {settings.zoom}%
              </label>
              <div className="flex items-center space-x-3">
                <ZoomIn className="h-4 w-4 text-gray-400" />
                <input
                  type="range"
                  min="75"
                  max="150"
                  step="5"
                  value={settings.zoom}
                  onChange={(e) => handleSliderChange('zoom', e.target.value)}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <ZoomIn className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>75%</span>
                <span>150%</span>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Height: {settings.lineHeight}%
              </label>
              <div className="flex items-center space-x-3">
                <Type className="h-4 w-4 text-gray-400" />
                <input
                  type="range"
                  min="100"
                  max="250"
                  step="10"
                  value={settings.lineHeight}
                  onChange={(e) => handleSliderChange('lineHeight', e.target.value)}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <Type className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100%</span>
                <span>250%</span>
              </div>
            </div>

            {/* Letter Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Letter Spacing: {settings.letterSpacing}px
              </label>
              <input
                type="range"
                min="-2"
                max="5"
                step="0.5"
                value={settings.letterSpacing}
                onChange={(e) => handleSliderChange('letterSpacing', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-2px</span>
                <span>5px</span>
              </div>
            </div>

            {/* Word Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Word Spacing: {settings.wordSpacing}px
              </label>
              <input
                type="range"
                min="-2"
                max="10"
                step="1"
                value={settings.wordSpacing}
                onChange={(e) => handleSliderChange('wordSpacing', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-2px</span>
                <span>10px</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual and Reading Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-6">
            Visual and Reading Modes
          </h4>

          <div className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Contrast className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">High Contrast</p>
                  <p className="text-xs text-gray-500">Increase contrast for better visibility</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('highContrast')}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={`${settings.highContrast ? 'Disable' : 'Enable'} high contrast`}
              >
                {settings.highContrast ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Moon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                  <p className="text-xs text-gray-500">Dark background for reduced eye strain</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('darkMode')}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={`${settings.darkMode ? 'Disable' : 'Enable'} dark mode`}
              >
                {settings.darkMode ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>

            {/* Dyslexia Font */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Dyslexia-Friendly Font</p>
                  <p className="text-xs text-gray-500">Use OpenDyslexic font for easier reading</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('dyslexiaFont')}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={`${settings.dyslexiaFont ? 'Disable' : 'Enable'} dyslexia-friendly font`}
              >
                {settings.dyslexiaFont ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>

            {/* Reading Mode */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reading Mode</p>
                  <p className="text-xs text-gray-500">Simplified layout for focused reading</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('readingMode')}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={`${settings.readingMode ? 'Disable' : 'Enable'} reading mode`}
              >
                {settings.readingMode ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <Focus className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reduce Motion</p>
                  <p className="text-xs text-gray-500">Minimize animations and transitions</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('reduceMotion')}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={`${settings.reduceMotion ? 'Disable' : 'Enable'} reduced motion`}
              >
                {settings.reduceMotion ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>

            {/* Enhanced Focus */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Enhanced Focus Outlines</p>
                  <p className="text-xs text-gray-500">Stronger focus indicators for keyboard navigation</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('focusOutline')}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={`${settings.focusOutline ? 'Disable' : 'Enable'} enhanced focus outlines`}
              >
                {settings.focusOutline ? (
                  <ToggleRight className="h-8 w-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Color Vision Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Color Vision Assistance
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Select a color vision adjustment to help with color differentiation.
          </p>

          <div className="space-y-3">
            {[
              { value: 'none', label: 'No Adjustment', description: 'Standard color display' },
              { value: 'protanopia', label: 'Protanopia', description: 'Red-green color blindness (red deficiency)' },
              { value: 'deuteranopia', label: 'Deuteranopia', description: 'Red-green color blindness (green deficiency)' },
              { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-yellow color blindness' }
            ].map((option) => (
              <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="colorBlindMode"
                  value={option.value}
                  checked={settings.colorBlindMode === option.value}
                  onChange={(e) => updateSetting('colorBlindMode', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-gray-900">Reset All Settings</h4>
              <p className="text-sm text-gray-500">Restore all accessibility settings to their default values.</p>
            </div>
            <button
              onClick={resetSettings}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accessibility; 