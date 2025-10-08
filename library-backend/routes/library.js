const express = require('express');
const router = express.Router();
const Library = require('../models/Library');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Document = require('../models/Document');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Get current acting library (based on token context) - includes slot timings
router.get('/me', auth.verifyToken, async (req, res) => {
  try {
    if (!req.user.libraryId) {
      return res.json(null);
    }
    const library = await Library.findById(req.user.libraryId);
    if (!library) return res.json(null);
    
    // Return complete library data including slot timings
    const libraryData = {
      _id: library._id,
      id: library._id, // Keep for backward compatibility
      name: library.name,
      handle: library.handle,
      totalSeats: library.totalSeats,
      numberOfSlots: library.numberOfSlots,
      slotTimings: library.slotTimings,
      slots: library.slots, // For backward compatibility
      allDayAvailable: library.allDayAvailable,
      contact: library.contact,
      features: library.features,
      isActive: library.isActive,
      createdAt: library.createdAt,
      updatedAt: library.updatedAt
    };
    
    res.json(libraryData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create library (superadmin only)
router.post('/', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const { 
      name, 
      handle, 
      totalSeats, 
      numberOfSlots = 2,
      slots = [], 
      contact = {},
      features = { chatEnabled: true, documentUploadsEnabled: true },
      adminEmail,
      adminPassword
    } = req.body;
    
    if (!name || !handle || !totalSeats) {
      return res.status(400).json({ message: 'name, handle and totalSeats are required' });
    }
    
    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'adminEmail and adminPassword are required' });
    }

    // Normalize handle
    const normalizedHandle = handle.startsWith('@') ? handle.toLowerCase() : `@${handle.toLowerCase()}`;
    
    // Check if library handle already exists
    const existingLibrary = await Library.findOne({ handle: normalizedHandle });
    if (existingLibrary) return res.status(400).json({ message: 'Library handle already exists' });
    
    // Check if admin email already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) return res.status(400).json({ message: 'Admin email already exists' });

    // Create library
    const library = new Library({ 
      name, 
      handle: normalizedHandle, 
      totalSeats, 
      numberOfSlots,
      slotTimings: slots,
      contact,
      features
    });
    await library.save();

    // Create admin user for the library
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = new User({
      name: `${name} Admin`,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      library: library._id
    });
    await adminUser.save();

    res.status(201).json({ 
      message: 'Library and admin user created successfully', 
      library: {
        id: library._id,
        name: library.name,
        handle: library.handle,
        totalSeats: library.totalSeats,
        isActive: library.isActive
      },
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List libraries (superadmin only)
router.get('/', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    const filter = includeDeleted === 'true' ? {} : { deletedAt: null };
    const libraries = await Library.find(filter).sort({ createdAt: -1 });
    res.json(libraries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get deleted libraries (superadmin only)
router.get('/deleted', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const libraries = await Library.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
    res.json(libraries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Platform-wide analytics (superadmin only)
router.get('/platform/analytics', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const [
      totalLibraries,
      activeLibraries,
      totalUsers,
      totalDocuments,
      totalConversations,
      totalMessages,
      recentLibraries,
      libraryGrowth
    ] = await Promise.all([
      Library.countDocuments(),
      Library.countDocuments({ isActive: true }),
      User.countDocuments({ library: { $ne: null } }),
      Document.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments(),
      Library.find().sort({ createdAt: -1 }).limit(5),
      Library.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 6 }
      ])
    ]);

    // Get user breakdown by library
    const usersByLibrary = await User.aggregate([
      { $match: { library: { $ne: null } } },
      {
        $group: {
          _id: "$library",
          totalUsers: { $sum: 1 },
          students: { $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] } },
          managers: { $sum: { $cond: [{ $eq: ["$role", "manager"] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $in: ["$role", ["admin", "superadmin"]] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: "libraries",
          localField: "_id",
          foreignField: "_id",
          as: "library"
        }
      },
      { $unwind: "$library" }
    ]);

    res.json({
      overview: {
        totalLibraries,
        activeLibraries,
        suspendedLibraries: totalLibraries - activeLibraries,
        totalUsers,
        totalDocuments,
        totalConversations,
        totalMessages
      },
      recentLibraries,
      libraryGrowth,
      usersByLibrary
    });
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

// Full library update including admin password (superadmin only)
router.put('/:id/full', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const libraryId = req.params.id;
    const { 
      name, 
      totalSeats, 
      numberOfSlots, 
      slots, 
      contact, 
      features, 
      isActive,
      adminPassword 
    } = req.body;

    // Update library data
    const libraryData = {
      name,
      totalSeats,
      numberOfSlots,
      slotTimings: slots,
      contact,
      features,
      isActive
    };

    const library = await Library.findByIdAndUpdate(libraryId, libraryData, { new: true });
    if (!library) return res.status(404).json({ message: 'Library not found' });

    // Update admin password if provided
    if (adminPassword && adminPassword.trim()) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(adminPassword.trim(), 10);
      
      // Find and update the library admin
      await User.findOneAndUpdate(
        { library: libraryId, role: 'admin' },
        { password: hashedPassword }
      );
    }

    res.json({ 
      message: 'Library updated successfully',
      library 
    });
  } catch (err) {
    console.error('Full library update error:', err);
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

// Soft delete library (superadmin only with password confirmation)
router.delete('/:id', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const { masterPassword } = req.body;
    const libraryId = req.params.id;

    if (!masterPassword) {
      return res.status(400).json({ message: 'Master password is required' });
    }

    // Verify master password
    const bcrypt = require('bcryptjs');
    const masterUser = await User.findById(req.user.id);
    const isPasswordValid = await bcrypt.compare(masterPassword, masterUser.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid master password' });
    }

    // Check if library exists and is not already deleted
    const library = await Library.findById(libraryId);
    if (!library) {
      return res.status(404).json({ message: 'Library not found' });
    }
    
    if (library.deletedAt) {
      return res.status(400).json({ message: 'Library is already deleted' });
    }

    // Soft delete the library
    await Library.findByIdAndUpdate(libraryId, { 
      deletedAt: new Date(),
      isActive: false 
    });

    res.json({ message: 'Library deleted successfully' });
  } catch (err) {
    console.error('Delete library error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Permanently delete library (superadmin only with password confirmation)
router.delete('/:id/permanent', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const { masterPassword } = req.body;
    const libraryId = req.params.id;

    if (!masterPassword) {
      return res.status(400).json({ message: 'Master password is required' });
    }

    // Verify master password
    const bcrypt = require('bcryptjs');
    const masterUser = await User.findById(req.user.id);
    const isPasswordValid = await bcrypt.compare(masterPassword, masterUser.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid master password' });
    }

    // Check if library exists
    const library = await Library.findById(libraryId);
    if (!library) {
      return res.status(404).json({ message: 'Library not found' });
    }

    // Delete all related data
    const User = require('../models/User');
    const Document = require('../models/Document');
    const Category = require('../models/Category');
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    const Announcement = require('../models/Announcement');
    const Notice = require('../models/Notice');
    const ThoughtOfTheDay = require('../models/ThoughtOfTheDay');
    const GalleryImage = require('../models/GalleryImage');
    const Fee = require('../models/Fee');

    // Delete in order (referential integrity)
    await Promise.all([
      Message.deleteMany({ library: libraryId }),
      Conversation.deleteMany({ library: libraryId }),
      Document.deleteMany({ library: libraryId }),
      Category.deleteMany({ library: libraryId }),
      Announcement.deleteMany({ library: libraryId }),
      Notice.deleteMany({ library: libraryId }),
      ThoughtOfTheDay.deleteMany({ library: libraryId }),
      GalleryImage.deleteMany({ library: libraryId }),
      Fee.deleteMany({ library: libraryId }),
      User.deleteMany({ library: libraryId })
    ]);

    // Finally delete the library permanently
    await Library.findByIdAndDelete(libraryId);

    res.json({ message: 'Library and all associated data permanently deleted' });
  } catch (err) {
    console.error('Permanent delete library error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Restore deleted library (superadmin only)
router.post('/:id/restore', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const libraryId = req.params.id;

    // Check if library exists and is deleted
    const library = await Library.findById(libraryId);
    if (!library) {
      return res.status(404).json({ message: 'Library not found' });
    }
    
    if (!library.deletedAt) {
      return res.status(400).json({ message: 'Library is not deleted' });
    }

    // Restore the library
    await Library.findByIdAndUpdate(libraryId, { 
      deletedAt: null,
      isActive: true 
    });

    res.json({ message: 'Library restored successfully' });
  } catch (err) {
    console.error('Restore library error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Metrics for a specific library (superadmin only)
router.get('/:id/metrics', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const libraryId = req.params.id;
    const library = await Library.findById(libraryId);
    if (!library) return res.status(404).json({ message: 'Library not found' });

    const [students, managers, admins, documents, conversations, messages] = await Promise.all([
      User.countDocuments({ library: libraryId, role: 'student' }),
      User.countDocuments({ library: libraryId, role: 'manager' }),
      User.countDocuments({ library: libraryId, role: { $in: ['admin', 'superadmin'] } }),
      Document.countDocuments({ library: libraryId }),
      Conversation.countDocuments({ library: libraryId, isActive: true }),
      Message.countDocuments({ library: libraryId, isDeleted: false })
    ]);

    res.json({
      library: { id: library._id, name: library.name, handle: library.handle, features: library.features, isActive: library.isActive, totalSeats: library.totalSeats },
      counts: { students, managers, admins, documents, conversations, messages }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Users list for a specific library (superadmin only)
router.get('/:id/users', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const libraryId = req.params.id;
    const { q = '', role } = req.query;
    const filter = { library: libraryId };
    if (role) filter.role = role;
    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
        { phone: { $regex: q.trim(), $options: 'i' } }
      ];
    }
    const users = await User.find(filter).select('-password').sort({ name: 1, email: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
