const express = require('express');
const router = express.Router();
const GalleryImage = require('../models/GalleryImage');
const auth = require('../middleware/authMiddleware');
const { uploadToSupabase, getPublicUrl, deleteFromSupabase, generateUniqueFilename } = require('../config/supabaseConfig');
const multer = require('multer');

// Configure multer for gallery image uploads
const galleryUpload = multer({
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
    fileSize: 10 * 1024 * 1024 // 10MB limit for gallery images
  }
});

// Get all gallery images for admin
router.get('/admin', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const filter = req.user.libraryId ? { library: req.user.libraryId } : {};
    const images = await GalleryImage.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate('uploadedBy', 'name email');
    
    res.json(images);
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get active gallery images for public (landing page)
router.get('/public', async (req, res) => {
  try {
    const criteria = { isActive: true };
    if (req.user?.libraryId) criteria.library = req.user.libraryId;
    const images = await GalleryImage.find(criteria)
      .sort({ order: 1, createdAt: 1 })
      .populate('uploadedBy', 'name email');
    
    res.json(images);
  } catch (error) {
    console.error('Error fetching public gallery images:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload new gallery image (admin only)
router.post('/', auth.verifyToken, auth.adminOnly, galleryUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const { title, description, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Upload to Supabase and use signed URLs for private bucket access
    let imageUrl, imageKey;
    
    try {
      // Generate unique filename for gallery image
      const uniqueFilename = `gallery/${generateUniqueFilename(req.file.originalname)}`;
      
      // Upload to Supabase
      await uploadToSupabase(req.file, uniqueFilename);
      
      // Use signed URL for private bucket (24 hour expiry)
      const { getSignedUrl } = require('../config/supabaseConfig');
      imageUrl = await getSignedUrl(uniqueFilename, 60 * 60 * 24); // 24 hours
      imageKey = uniqueFilename;
      
      console.log('🖼️ Gallery image uploaded to Supabase with signed URL');
    } catch (supabaseError) {
      console.error('Supabase upload failed:', supabaseError);
      return res.status(500).json({ message: 'Failed to upload image to storage' });
    }

    // Create gallery image record
    const galleryImage = new GalleryImage({
      library: req.user.libraryId || null,
      title: title.trim(),
      description: description ? description.trim() : '',
      imageUrl,
      imageKey,
      order: order ? parseInt(order) : 0,
      uploadedBy: req.user.id
    });

    await galleryImage.save();
    await galleryImage.populate('uploadedBy', 'name email');

    res.status(201).json({ 
      message: 'Gallery image uploaded successfully',
      image: galleryImage,
      storage: 'supabase_signed'
    });
  } catch (error) {
    console.error('Gallery image upload error:', error);
    res.status(500).json({ message: error.message || 'Gallery image upload failed' });
  }
});

// Update gallery image (admin only)
router.put('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { title, description, order, isActive } = req.body;

    const criteria = { _id: req.params.id };
    if (req.user.libraryId) criteria.library = req.user.libraryId;
    const galleryImage = await GalleryImage.findOne(criteria);
    if (!galleryImage) {
      return res.status(404).json({ message: 'Gallery image not found' });
    }

    // Update fields
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      galleryImage.title = title.trim();
    }

    if (description !== undefined) {
      galleryImage.description = description.trim();
    }

    if (order !== undefined) {
      galleryImage.order = parseInt(order) || 0;
    }

    if (isActive !== undefined) {
      galleryImage.isActive = Boolean(isActive);
    }

    await galleryImage.save();
    await galleryImage.populate('uploadedBy', 'name email');

    res.json({
      message: 'Gallery image updated successfully',
      image: galleryImage
    });
  } catch (error) {
    console.error('Gallery image update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete gallery image (admin only)
router.delete('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const criteria = { _id: req.params.id };
    if (req.user.libraryId) criteria.library = req.user.libraryId;
    const galleryImage = await GalleryImage.findOne(criteria);
    if (!galleryImage) {
      return res.status(404).json({ message: 'Gallery image not found' });
    }

    // Delete from Supabase if stored there
    if (galleryImage.imageKey.startsWith('gallery/') && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        await deleteFromSupabase(galleryImage.imageKey);

      } catch (deleteError) {
        console.error('Error deleting from Supabase:', deleteError);
        // Continue with database deletion
      }
    } else {

    }

    await galleryImage.deleteOne();

    res.json({ message: 'Gallery image deleted successfully' });
  } catch (error) {
    console.error('Gallery image deletion error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Refresh signed URLs for gallery images (when they expire)
router.post('/refresh-urls', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const filter = req.user.libraryId ? { library: req.user.libraryId } : {};
    const images = await GalleryImage.find(filter);
    
    let refreshCount = 0;
    const { getSignedUrl } = require('../config/supabaseConfig');
    
    for (const image of images) {
      // Only refresh Supabase-stored images (not base64)
      if (image.imageKey && image.imageKey.startsWith('gallery/')) {
        try {
          const newSignedUrl = await getSignedUrl(image.imageKey, 60 * 60 * 24); // 24 hours
          image.imageUrl = newSignedUrl;
          await image.save();
          refreshCount++;
        } catch (error) {
          console.error(`Failed to refresh URL for image ${image.imageKey}:`, error);
        }
      }
    }
    
    res.json({ 
      message: `Refreshed ${refreshCount} gallery image URLs`,
      refreshedCount: refreshCount,
      totalImages: images.length
    });
  } catch (error) {
    console.error('Gallery URL refresh error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reorder gallery images (admin only)
router.put('/reorder/bulk', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { images } = req.body; // Array of {id, order}

    if (!Array.isArray(images)) {
      return res.status(400).json({ message: 'Images array is required' });
    }

    // Update order for each image
    const updatePromises = images.map(async (item) => {
      if (item.id && typeof item.order === 'number') {
        await GalleryImage.findByIdAndUpdate(
          item.id,
          { order: item.order },
          { new: true }
        );
      }
    });

    await Promise.all(updatePromises);

    const updatedImages = await GalleryImage.find(req.user.libraryId ? { library: req.user.libraryId } : {})
      .sort({ order: 1, createdAt: -1 })
      .populate('uploadedBy', 'name email');

    res.json({
      message: 'Gallery images reordered successfully',
      images: updatedImages
    });
  } catch (error) {
    console.error('Gallery reorder error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;