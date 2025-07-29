const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// Test endpoint (remove this after testing)
router.get('/test', (req, res) => {
  res.json({ message: 'Student routes are working!' });
});

// Get all students (admin only)
router.get('/', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create student (admin only)
router.post('/', auth.verifyToken, auth.adminOnly, async (req, res) => {
  const { name, email, password, terminationDate } = req.body;
  try {
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);

    const student = new User({
      name: name.trim(),
      email,
      password: hashed,
      role: 'student',
      terminationDate
    });

    await student.save();
    res.status(201).json({ message: 'Student created', student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update termination date
router.put('/:id/termination', auth.verifyToken, auth.adminOnly, async (req, res) => {
  const { terminationDate } = req.body;
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    student.terminationDate = terminationDate;
    await student.save();

    res.json({ message: 'Termination date updated', student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete student
router.delete('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    await student.deleteOne();
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;