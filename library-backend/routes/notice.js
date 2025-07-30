const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// Get all notices for admin
router.get('/admin', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('createdBy', 'email name')
      .populate('targetUsers', 'email name role')
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get notices for current user
router.get('/user', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get notices where user is target or targetAllUsers is true
    const notices = await Notice.find({
      isActive: true,
      $and: [
        {
          $or: [
            { targetAllUsers: true },
            { targetUsers: userId }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    })
    .populate('createdBy', 'email name')
    .sort({ priority: -1, createdAt: -1 });

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get banner/marquee notices for current user
router.get('/banner-marquee', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notices = await Notice.find({
      isActive: true,
      type: { $in: ['banner', 'marquee'] },
      $and: [
        {
          $or: [
            { targetAllUsers: true },
            { targetUsers: userId }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    })
    .populate('createdBy', 'email name')
    .sort({ priority: -1, createdAt: -1 });

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tab notices for current user
router.get('/tab', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notices = await Notice.find({
      isActive: true,
      type: 'tab',
      $and: [
        {
          $or: [
            { targetAllUsers: true },
            { targetUsers: userId }
          ]
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      ]
    })
    .populate('createdBy', 'email name')
    .sort({ priority: -1, createdAt: -1 });

    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new notice (admin only)
router.post('/', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const { title, content, type, targetUsers, targetAllUsers, priority, expiresAt } = req.body;

    // Validate required fields
    if (!title || !content || !type) {
      return res.status(400).json({ message: 'Title, content, and type are required' });
    }

    // Validate type
    if (!['banner', 'marquee', 'tab'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notice type' });
    }

    // Validate target users if not targeting all
    if (!targetAllUsers && (!targetUsers || targetUsers.length === 0)) {
      return res.status(400).json({ message: 'Must specify target users or target all users' });
    }

    // Validate target users exist
    if (!targetAllUsers && targetUsers && targetUsers.length > 0) {
      const validUsers = await User.find({ _id: { $in: targetUsers } });
      if (validUsers.length !== targetUsers.length) {
        return res.status(400).json({ message: 'Some target users do not exist' });
      }
    }

    const notice = new Notice({
      title,
      content,
      type,
      targetUsers: targetAllUsers ? [] : targetUsers,
      targetAllUsers: !!targetAllUsers,
      priority: priority || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user.id
    });

    await notice.save();
    await notice.populate('createdBy', 'email name');
    await notice.populate('targetUsers', 'email name role');

    res.status(201).json(notice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update notice (admin only)
router.put('/:id', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const { title, content, type, targetUsers, targetAllUsers, priority, expiresAt, isActive } = req.body;

    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Validate target users if provided
    if (!targetAllUsers && targetUsers && targetUsers.length > 0) {
      const validUsers = await User.find({ _id: { $in: targetUsers } });
      if (validUsers.length !== targetUsers.length) {
        return res.status(400).json({ message: 'Some target users do not exist' });
      }
    }

    // Update fields
    if (title !== undefined) notice.title = title;
    if (content !== undefined) notice.content = content;
    if (type !== undefined) notice.type = type;
    if (targetUsers !== undefined) notice.targetUsers = targetAllUsers ? [] : targetUsers;
    if (targetAllUsers !== undefined) notice.targetAllUsers = targetAllUsers;
    if (priority !== undefined) notice.priority = priority;
    if (expiresAt !== undefined) notice.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) notice.isActive = isActive;

    await notice.save();
    await notice.populate('createdBy', 'email name');
    await notice.populate('targetUsers', 'email name role');

    res.json(notice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete notice (admin only)
router.delete('/:id', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notice as read
router.post('/:id/read', auth.verifyToken, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Check if user is target of this notice
    if (!notice.isTargetUser(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notice.markAsRead(req.user.id);
    await notice.save();

    res.json({ message: 'Notice marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users for targeting (admin only)
router.get('/users', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const users = await User.find({}, 'email name role')
      .sort({ name: 1, email: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 