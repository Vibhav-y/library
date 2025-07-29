const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const { upload, uploadToSupabase, getPublicUrl, deleteFromSupabase, generateUniqueFilename } = require('../config/supabaseConfig');

// Upload PDF (admin/superadmin)
router.post('/', auth.verifyToken, auth.adminOnly, upload.single('pdf'), async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!req.file) return res.status(400).json({ message: 'PDF file required' });

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(req.file.originalname);
    
    // Upload to Supabase
    const uploadResult = await uploadToSupabase(req.file, uniqueFilename);
    
    // Get public URL
    const publicUrl = getPublicUrl(uniqueFilename);

    const document = new Document({
      title,
      fileUrl: publicUrl,
      fileKey: uniqueFilename, // Store filename as key for deletion
      fileName: req.file.originalname,
      fileSize: req.file.size,
      category,
      uploadedBy: req.user.id
    });

    await document.save();
    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// Get all documents (student view)
router.get('/', auth.verifyToken, async (req, res) => {
  try {
    const docs = await Document.find().populate('category', 'name');
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get document with public URL
router.get('/:id/download', auth.verifyToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Return the stored public URL
    res.json({ 
      downloadUrl: document.fileUrl,
      fileName: document.fileName,
      title: document.title
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete document (admin/superadmin)
router.delete('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete from Supabase Storage
    await deleteFromSupabase(document.fileKey);
    
    // Delete from database
    await Document.findByIdAndDelete(req.params.id);
    
    // Remove from all users' favorites
    await User.updateMany(
      { favoriteDocuments: req.params.id },
      { $pull: { favoriteDocuments: req.params.id } }
    );

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add document to favorites
router.post('/:id/favorite', auth.verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const documentId = req.params.id;
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if already favorited
    if (user.favoriteDocuments.includes(documentId)) {
      return res.status(400).json({ message: 'Document already in favorites' });
    }

    user.favoriteDocuments.push(documentId);
    await user.save();

    res.json({ message: 'Document added to favorites' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove document from favorites
router.delete('/:id/favorite', auth.verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const documentId = req.params.id;
    
    // Remove from favorites
    user.favoriteDocuments = user.favoriteDocuments.filter(
      id => id.toString() !== documentId
    );
    await user.save();

    res.json({ message: 'Document removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's favorite documents
router.get('/favorites', auth.verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favoriteDocuments',
      populate: {
        path: 'category',
        select: 'name'
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.favoriteDocuments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get favorites count for dashboard
router.get('/favorites/count', auth.verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ count: user.favoriteDocuments.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
