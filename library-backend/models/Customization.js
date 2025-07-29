const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  colors: {
    primary: { type: String, required: true }, // Main brand color
    secondary: { type: String, required: true }, // Secondary brand color
    accent: { type: String, required: true }, // Accent color
    background: { type: String, required: true }, // Main background
    surface: { type: String, required: true }, // Card/surface background
    text: { type: String, required: true }, // Primary text color
    textSecondary: { type: String, required: true }, // Secondary text color
    border: { type: String, required: true }, // Border color
    success: { type: String, required: true }, // Success color
    warning: { type: String, required: true }, // Warning color
    error: { type: String, required: true }, // Error color
    info: { type: String, required: true } // Info color
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  isPredefined: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.isCustom; }
  }
}, {
  timestamps: true
});

const customizationSchema = new mongoose.Schema({
  // Logo settings
  logoUrl: {
    type: String,
    default: null
  },
  logoKey: {
    type: String, // For Supabase storage key
    default: null
  },
  logoName: {
    type: String,
    default: null
  },
  showLogo: {
    type: Boolean,
    default: false
  },
  logoSize: {
    type: Number,
    min: 20,
    max: 120,
    default: 40
  },
  
  // Theme settings
  activeTheme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theme',
    default: null
  },
  
  // System settings
  systemName: {
    type: String,
    default: 'Library System'
  },
  
  // Metadata
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Create Theme model
const Theme = mongoose.model('Theme', themeSchema);

// Create Customization model (singleton - only one document should exist)
const Customization = mongoose.model('Customization', customizationSchema);

// Predefined themes data
const predefinedThemes = [
  {
    name: 'Default Blue',
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
    },
    isPredefined: true
  },
  {
    name: 'Dark Mode',
    colors: {
      primary: '#60A5FA',
      secondary: '#3B82F6',
      accent: '#FBBF24',
      background: '#111827',
      surface: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#D1D5DB',
      border: '#374151',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA'
    },
    isPredefined: true
  },
  {
    name: 'Forest Green',
    colors: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#D97706',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#D1FAE5',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#059669'
    },
    isPredefined: true
  },
  {
    name: 'Purple Dream',
    colors: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#F59E0B',
      background: '#FAF5FF',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E9D5FF',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#8B5CF6'
    },
    isPredefined: true
  },
  {
    name: 'Sunset Orange',
    colors: {
      primary: '#EA580C',
      secondary: '#DC2626',
      accent: '#0891B2',
      background: '#FFF7ED',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#FED7AA',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#EA580C'
    },
    isPredefined: true
  },
  {
    name: 'Ocean Teal',
    colors: {
      primary: '#0891B2',
      secondary: '#0E7490',
      accent: '#F59E0B',
      background: '#F0FDFA',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#A7F3D0',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#0891B2'
    },
    isPredefined: true
  },
  {
    name: 'Rose Pink',
    colors: {
      primary: '#E11D48',
      secondary: '#BE185D',
      accent: '#0891B2',
      background: '#FFF1F2',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#FECDD3',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#E11D48'
    },
    isPredefined: true
  },
  {
    name: 'Royal Purple',
    colors: {
      primary: '#7C2D12',
      secondary: '#92400E',
      accent: '#0891B2',
      background: '#FEF3C7',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#FDE68A',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#7C2D12'
    },
    isPredefined: true
  },
  {
    name: 'Monochrome',
    colors: {
      primary: '#374151',
      secondary: '#111827',
      accent: '#6B7280',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#374151'
    },
    isPredefined: true
  },
  {
    name: 'Midnight Blue',
    colors: {
      primary: '#1E3A8A',
      secondary: '#1E40AF',
      accent: '#FBBF24',
      background: '#EFF6FF',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#BFDBFE',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#1E3A8A'
    },
    isPredefined: true
  }
];

// Initialize predefined themes
const initializePredefinedThemes = async () => {
  try {
    const existingCount = await Theme.countDocuments({ isPredefined: true });
    if (existingCount === 0) {
      await Theme.insertMany(predefinedThemes);
      console.log('✅ Predefined themes initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing predefined themes:', error);
  }
};

// Initialize customization settings
const initializeCustomization = async () => {
  try {
    const existing = await Customization.findOne();
    if (!existing) {
      // Get the default theme
      const defaultTheme = await Theme.findOne({ name: 'Default Blue', isPredefined: true });
      
      const customization = new Customization({
        activeTheme: defaultTheme ? defaultTheme._id : null
        // lastUpdatedBy will use default value (null)
      });
      
      await customization.save();
      console.log('✅ Customization settings initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing customization settings:', error);
  }
};

module.exports = {
  Theme,
  Customization,
  initializePredefinedThemes,
  initializeCustomization
}; 