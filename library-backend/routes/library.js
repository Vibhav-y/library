const express = require('express');
const router = express.Router();
const Library = require('../models/Library');
const auth = require('../middleware/authMiddleware');

// Get current acting library (based on token context)
router.get('/me', auth.verifyToken, async (req, res) => {
  try {
    if (!req.user.libraryId) {
      return res.json(null);
    }
    const library = await Library.findById(req.user.libraryId);
    if (!library) return res.json(null);
    res.json({ id: library._id, name: library.name, handle: library.handle, contact: library.contact, totalSeats: library.totalSeats, isActive: library.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create library (superadmin only)
router.post('/', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const { name, handle, totalSeats, allDayAvailable = true, slots = [], contact = {} } = req.body;
    if (!name || !handle || !totalSeats) {
      return res.status(400).json({ message: 'name, handle and totalSeats are required' });
    }
    const existing = await Library.findOne({ handle: handle.startsWith('@') ? handle.toLowerCase() : `@${handle.toLowerCase()}` });
    if (existing) return res.status(400).json({ message: 'Library handle already exists' });

    const library = new Library({ name, handle, totalSeats, allDayAvailable, slots, contact });
    await library.save();
    res.status(201).json({ message: 'Library created', library });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List libraries (superadmin only)
router.get('/', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const libraries = await Library.find().sort({ createdAt: -1 });
    res.json(libraries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get library by id (superadmin only)
router.get('/:id', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const library = await Library.findById(req.params.id);
    if (!library) return res.status(404).json({ message: 'Library not found' });
    res.json(library);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update library (superadmin only)
router.put('/:id', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const { name, handle, totalSeats, allDayAvailable, slots, contact, isActive, features } = req.body;
    const library = await Library.findById(req.params.id);
    if (!library) return res.status(404).json({ message: 'Library not found' });

    if (name !== undefined) library.name = name;
    if (handle !== undefined) library.handle = handle;
    if (totalSeats !== undefined) library.totalSeats = totalSeats;
    if (allDayAvailable !== undefined) library.allDayAvailable = !!allDayAvailable;
    if (Array.isArray(slots)) library.slots = slots;
    if (contact !== undefined) library.contact = contact || {};
    if (isActive !== undefined) library.isActive = !!isActive;
    if (features && typeof features === 'object') {
      if (typeof features.chatEnabled === 'boolean') library.features.chatEnabled = features.chatEnabled;
      if (typeof features.documentUploadsEnabled === 'boolean') library.features.documentUploadsEnabled = features.documentUploadsEnabled;
    }

    await library.save();
    res.json({ message: 'Library updated', library });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Deactivate library (superadmin only)
router.delete('/:id', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const library = await Library.findById(req.params.id);
    if (!library) return res.status(404).json({ message: 'Library not found' });
    library.isActive = false;
    await library.save();
    res.json({ message: 'Library deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: get library contact by handle for client contact-us
router.get('/public/by-handle/:handle', async (req, res) => {
  try {
    const handle = req.params.handle.startsWith('@') ? req.params.handle.toLowerCase() : `@${req.params.handle.toLowerCase()}`;
    const library = await Library.findOne({ handle, isActive: true });
    if (!library) return res.status(404).json({ message: 'Library not found' });
    res.json({ id: library._id, name: library.name, handle: library.handle, contact: library.contact });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


