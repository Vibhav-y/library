const express = require('express');
const router = express.Router();
const { Theme, Customization } = require('../models/Customization');
const auth = require('../middleware/authMiddleware');
const { upload, uploadToSupabase, getPublicUrl, deleteFromSupabase, generateUniqueFilename } = require('../config/supabaseConfig');
const multer = require('multer');

// Configure multer for logo uploads (images only)
const logoUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for logos
  }
});

// Get current customization settings
router.get('/', async (req, res) => {
  try {
    let customization = await Customization.findOne()
      .populate('activeTheme')
      .populate('lastUpdatedBy', 'name email');
    
    if (!customization) {
      // Create default customization if none exists
      const defaultTheme = await Theme.findOne({ name: 'Default Blue', isPredefined: true });
      
      customization = new Customization({
        activeTheme: defaultTheme ? defaultTheme._id : null
      });
      
      await customization.save();
      await customization.populate('activeTheme');
      
      console.log('✅ Created default customization settings');
    }
    
    res.json(customization);
  } catch (error) {
    console.error('Error fetching customization:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all themes (predefined + custom)
router.get('/themes', async (req, res) => {
  try {
    const predefinedThemes = await Theme.find({ isPredefined: true }).sort({ name: 1 });
    const customThemes = await Theme.find({ isCustom: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 custom themes
    
    res.json({
      predefined: predefinedThemes,
      custom: customThemes
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload logo (admin/superadmin only)
router.post('/logo', auth.verifyToken, auth.adminOnly, logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Logo file is required' });
    }

    // Generate unique filename for logo
    const uniqueFilename = `logos/${generateUniqueFilename(req.file.originalname)}`;
    
    // Upload to Supabase
    const uploadResult = await uploadToSupabase(req.file, uniqueFilename);
    
    // Get public URL
    const publicUrl = getPublicUrl(uniqueFilename);

    // Update customization settings
    let customization = await Customization.findOne();
    if (!customization) {
      customization = new Customization();
    }

    // Delete old logo if exists
    if (customization.logoKey) {
      try {
        await deleteFromSupabase(customization.logoKey);
      } catch (deleteError) {
        console.error('Error deleting old logo:', deleteError);
        // Continue with upload even if old logo deletion fails
      }
    }

    customization.logoUrl = publicUrl;
    customization.logoKey = uniqueFilename;
    customization.logoName = req.file.originalname;
    customization.showLogo = true;
    customization.lastUpdatedBy = req.user.id;

    await customization.save();

    res.json({ 
      message: 'Logo uploaded successfully', 
      logoUrl: publicUrl,
      logoName: req.file.originalname
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: error.message || 'Logo upload failed' });
  }
});

// Delete logo (admin/superadmin only)
router.delete('/logo', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const customization = await Customization.findOne();
    if (!customization || !customization.logoKey) {
      return res.status(404).json({ message: 'No logo found to delete' });
    }

    // Delete from Supabase
    await deleteFromSupabase(customization.logoKey);

    // Update customization settings
    customization.logoUrl = null;
    customization.logoKey = null;
    customization.logoName = null;
    customization.showLogo = false;
    customization.lastUpdatedBy = req.user.id;

    await customization.save();

    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Logo delete error:', error);
    res.status(500).json({ message: error.message || 'Logo deletion failed' });
  }
});

// Update system name (admin/superadmin only)
router.put('/system-name', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { systemName } = req.body;
    
    if (!systemName || !systemName.trim()) {
      return res.status(400).json({ message: 'System name is required' });
    }

    let customization = await Customization.findOne();
    if (!customization) {
      customization = new Customization();
    }

    customization.systemName = systemName.trim();
    customization.lastUpdatedBy = req.user.id;

    await customization.save();

    res.json({ 
      message: 'System name updated successfully',
      systemName: customization.systemName
    });
  } catch (error) {
    console.error('System name update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Set active theme (admin/superadmin only)
router.put('/theme', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { themeId } = req.body;
    
    if (!themeId) {
      return res.status(400).json({ message: 'Theme ID is required' });
    }

    // Verify theme exists
    const theme = await Theme.findById(themeId);
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }

    let customization = await Customization.findOne();
    if (!customization) {
      customization = new Customization();
    }

    customization.activeTheme = themeId;
    customization.lastUpdatedBy = req.user.id;

    await customization.save();
    await customization.populate('activeTheme');

    res.json({ 
      message: 'Theme applied successfully',
      activeTheme: customization.activeTheme
    });
  } catch (error) {
    console.error('Theme update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create custom theme (admin/superadmin only)
router.post('/themes/custom', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { name, colors } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Theme name is required' });
    }

    if (!colors || typeof colors !== 'object') {
      return res.status(400).json({ message: 'Theme colors are required' });
    }

    // Validate required color properties
    const requiredColors = [
      'primary', 'secondary', 'accent', 'background', 'surface',
      'text', 'textSecondary', 'border', 'success', 'warning', 'error', 'info'
    ];

    for (const colorKey of requiredColors) {
      if (!colors[colorKey]) {
        return res.status(400).json({ message: `Color '${colorKey}' is required` });
      }
    }

    // Check if we already have 10 custom themes
    const customThemeCount = await Theme.countDocuments({ isCustom: true });
    if (customThemeCount >= 10) {
      return res.status(400).json({ 
        message: 'Maximum of 10 custom themes allowed. Please delete a custom theme first.' 
      });
    }

    // Check if theme name already exists
    const existingTheme = await Theme.findOne({ 
      name: name.trim(),
      $or: [{ isPredefined: true }, { isCustom: true }]
    });
    
    if (existingTheme) {
      return res.status(400).json({ message: 'Theme name already exists' });
    }

    const theme = new Theme({
      name: name.trim(),
      colors,
      isCustom: true,
      createdBy: req.user.id
    });

    await theme.save();
    await theme.populate('createdBy', 'name email');

    res.status(201).json({ 
      message: 'Custom theme created successfully',
      theme
    });
  } catch (error) {
    console.error('Custom theme creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update custom theme (admin/superadmin only)
router.put('/themes/custom/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { name, colors } = req.body;
    
    const theme = await Theme.findOne({ 
      _id: req.params.id, 
      isCustom: true 
    });
    
    if (!theme) {
      return res.status(404).json({ message: 'Custom theme not found' });
    }

    // Check if user owns this theme or is superadmin
    if (req.user.role !== 'superadmin' && theme.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own custom themes' });
    }

    if (name && name.trim()) {
      // Check if new name conflicts with existing themes
      const existingTheme = await Theme.findOne({ 
        name: name.trim(),
        _id: { $ne: req.params.id },
        $or: [{ isPredefined: true }, { isCustom: true }]
      });
      
      if (existingTheme) {
        return res.status(400).json({ message: 'Theme name already exists' });
      }
      
      theme.name = name.trim();
    }

    if (colors && typeof colors === 'object') {
      // Validate required color properties
      const requiredColors = [
        'primary', 'secondary', 'accent', 'background', 'surface',
        'text', 'textSecondary', 'border', 'success', 'warning', 'error', 'info'
      ];

      for (const colorKey of requiredColors) {
        if (!colors[colorKey]) {
          return res.status(400).json({ message: `Color '${colorKey}' is required` });
        }
      }
      
      theme.colors = colors;
    }

    await theme.save();
    await theme.populate('createdBy', 'name email');

    res.json({ 
      message: 'Custom theme updated successfully',
      theme
    });
  } catch (error) {
    console.error('Custom theme update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete custom theme (admin/superadmin only)
router.delete('/themes/custom/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const theme = await Theme.findOne({ 
      _id: req.params.id, 
      isCustom: true 
    });
    
    if (!theme) {
      return res.status(404).json({ message: 'Custom theme not found' });
    }

    // Check if user owns this theme or is superadmin
    if (req.user.role !== 'superadmin' && theme.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own custom themes' });
    }

    // Check if this theme is currently active
    const customization = await Customization.findOne({ activeTheme: req.params.id });
    if (customization) {
      // Switch to default theme
      const defaultTheme = await Theme.findOne({ name: 'Default Blue', isPredefined: true });
      customization.activeTheme = defaultTheme ? defaultTheme._id : null;
      customization.lastUpdatedBy = req.user.id;
      await customization.save();
    }

    await theme.deleteOne();

    res.json({ 
      message: 'Custom theme deleted successfully',
      switchedToDefault: !!customization
    });
  } catch (error) {
    console.error('Custom theme deletion error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Toggle logo visibility (admin/superadmin only)
router.put('/logo/toggle', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { showLogo } = req.body;
    
    let customization = await Customization.findOne();
    if (!customization) {
      customization = new Customization();
    }

    customization.showLogo = Boolean(showLogo);
    customization.lastUpdatedBy = req.user.id;

    await customization.save();

    res.json({ 
      message: `Logo ${customization.showLogo ? 'enabled' : 'disabled'} successfully`,
      showLogo: customization.showLogo
    });
  } catch (error) {
    console.error('Logo toggle error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update logo size (admin or superadmin only)
router.put('/logo/size', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { logoSize } = req.body;

    if (logoSize === undefined || logoSize === null) {
      return res.status(400).json({ message: 'Logo size is required' });
    }

    const size = Number(logoSize);
    if (isNaN(size) || size < 20 || size > 120) {
      return res.status(400).json({ 
        message: 'Invalid logo size. Must be a number between 20 and 120 pixels'
      });
    }

    let customization = await Customization.findOne();
    
    if (!customization) {
      // Create default customization if none exists
      const defaultTheme = await Theme.findOne({ name: 'Default Blue', isPredefined: true });
      
      customization = new Customization({
        activeTheme: defaultTheme ? defaultTheme._id : null,
        logoSize: size
      });
    } else {
      customization.logoSize = size;
    }

    customization.lastUpdatedBy = req.user.id;
    await customization.save();

    res.json({ 
      message: 'Logo size updated successfully',
      logoSize: customization.logoSize
    });
  } catch (error) {
    console.error('Logo size update error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 