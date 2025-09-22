const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const { uploadToSupabase, getPublicUrl, deleteFromSupabase, generateUniqueFilename } = require('../config/supabaseConfig');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ✅ Create a new category or sub-category (admin or superadmin only)
router.post('/', auth.verifyToken, auth.adminOnly, imageUpload.single('image'), async (req, res) => {
  const { name, parentCategory } = req.body;
  try {
    // Check if category with same name exists under the same parent
    const filter = { name, parentCategory: parentCategory || null };
    if (req.user.libraryId) filter.library = req.user.libraryId;
    const existing = await Category.findOne(filter);
    if (existing) {
      const parentName = parentCategory ? 
        (await Category.findById(parentCategory))?.name : 'root';
      return res.status(400).json({ 
        message: `Category '${name}' already exists under '${parentName}'` 
      });
    }

    // Validate parent category exists if provided
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({ message: 'Parent category not found' });
      }
      // Limit nesting depth (optional)
      if (parent.level >= 2) {
        return res.status(400).json({ message: 'Maximum nesting depth (3 levels) exceeded' });
      }
    }

    // Handle image upload if provided
    let image = null;
    let imagePublicUrl = null;
    
    if (req.file) {
      try {
        const uniqueFilename = generateUniqueFilename(req.file.originalname);
        const filePath = `categories/${uniqueFilename}`;
        
        await uploadToSupabase(req.file, filePath);
        image = filePath;
        imagePublicUrl = getPublicUrl(filePath);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload category image' });
      }
    }

    const category = new Category({ 
      name, 
      parentCategory,
      image,
      imagePublicUrl,
      library: req.user.libraryId || null
    });
    await category.save();
    
    // Populate parent info for response
    await category.populate('parentCategory', 'name');
    
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all categories with hierarchical structure (any logged-in user)
router.get('/', auth.verifyToken, async (req, res) => {
  try {
    const categories = await Category.find(req.user.libraryId ? { library: req.user.libraryId } : {})
      .populate('parentCategory', 'name')
      .sort({ level: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get category tree (hierarchical structure)
router.get('/tree', auth.verifyToken, async (req, res) => {
  try {
    const buildTree = async (parentId = null, level = 0) => {
      const criteria = { parentCategory: parentId };
      if (req.user.libraryId) criteria.library = req.user.libraryId;
      const categories = await Category.find(criteria)
        .sort({ name: 1 });
      
      const tree = [];
      for (const category of categories) {
        const subcategories = await buildTree(category._id, level + 1);
        tree.push({
          ...category.toObject(),
          subcategories
        });
      }
      return tree;
    };

    const tree = await buildTree();
    res.json(tree);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get categories by parent (for dropdown population)
router.get('/by-parent/:parentId', auth.verifyToken, async (req, res) => {
  try {
    const parentId = req.params.parentId === 'null' ? null : req.params.parentId;
    const categories = await Category.find({ parentCategory: parentId })
      .sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get root categories (alternative endpoint)
router.get('/by-parent', auth.verifyToken, async (req, res) => {
  try {
    const criteria = { parentCategory: null };
    if (req.user.libraryId) criteria.library = req.user.libraryId;
    const categories = await Category.find(criteria)
      .sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete category (admin only) - with cascade delete for subcategories
router.delete('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has subcategories
    const subcategories = await Category.find({ parentCategory: req.params.id });
    if (subcategories.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories. Delete subcategories first.' 
      });
    }

    // Check if category is used by documents
    const Document = require('../models/Document');
    const documentsCount = await Document.countDocuments({ category: req.params.id });
    if (documentsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It is used by ${documentsCount} document(s).` 
      });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update category image (admin or superadmin only)
router.put('/:id/image', auth.verifyToken, auth.adminOnly, imageUpload.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Delete old image if exists
    if (category.image) {
      try {
        await deleteFromSupabase(category.image);
      } catch (deleteError) {
        console.error('Error deleting old category image:', deleteError);
      }
    }

    // Upload new image
    const uniqueFilename = generateUniqueFilename(req.file.originalname);
    const filePath = `categories/${uniqueFilename}`;
    
    await uploadToSupabase(req.file, filePath);
    const imagePublicUrl = getPublicUrl(filePath);

    // Update category
    category.image = filePath;
    category.imagePublicUrl = imagePublicUrl;
    await category.save();

    await category.populate('parentCategory', 'name');
    
    res.json({ 
      message: 'Category image updated successfully', 
      category 
    });
  } catch (err) {
    console.error('Error updating category image:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete category image (admin or superadmin only)
router.delete('/:id/image', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (!category.image) {
      return res.status(400).json({ message: 'Category has no image to delete' });
    }

    // Delete image from Supabase
    try {
      await deleteFromSupabase(category.image);
    } catch (deleteError) {
      console.error('Error deleting category image from storage:', deleteError);
    }

    // Update category
    category.image = null;
    category.imagePublicUrl = null;
    await category.save();

    await category.populate('parentCategory', 'name');
    
    res.json({ 
      message: 'Category image deleted successfully', 
      category 
    });
  } catch (err) {
    console.error('Error deleting category image:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;