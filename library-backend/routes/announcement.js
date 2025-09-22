const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/authMiddleware');

// Get all active announcements for landing page (public)
router.get('/public', async (req, res) => {
  try {
    const baseQuery = {
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };
    // optional: filter by library via query param handle or id
    const { libraryId } = req.query;
    const query = libraryId ? { ...baseQuery, library: libraryId } : baseQuery;
    const announcements = await Announcement.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(10)
    .select('title content createdAt')
    .lean();

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes (protected)
// Get all announcements for admin
router.get('/admin', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const filter = req.user.libraryId ? { library: req.user.libraryId } : {};
    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching admin announcements:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new announcement
router.post('/', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { title, content, priority = 0, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      priority: Number(priority),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user.id,
      library: req.user.libraryId || null
    });

    await announcement.save();
    await announcement.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update announcement
router.put('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const { title, content, priority, isActive, expiresAt } = req.body;
    
    const criteria = { _id: req.params.id };
    if (req.user.libraryId) criteria.library = req.user.libraryId;
    const announcement = await Announcement.findOne(criteria);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Update fields
    if (title !== undefined) announcement.title = title.trim();
    if (content !== undefined) announcement.content = content.trim();
    if (priority !== undefined) announcement.priority = Number(priority);
    if (isActive !== undefined) announcement.isActive = Boolean(isActive);
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;

    await announcement.save();
    await announcement.populate('createdBy', 'name email');

    res.json({
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete announcement
router.delete('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const criteria = { _id: req.params.id };
    if (req.user.libraryId) criteria.library = req.user.libraryId;
    const announcement = await Announcement.findOne(criteria);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await Announcement.deleteOne({ _id: req.params.id });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle announcement status
router.patch('/:id/toggle', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();
    await announcement.populate('createdBy', 'name email');

    res.json({
      message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
      announcement
    });
  } catch (error) {
    console.error('Error toggling announcement:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 