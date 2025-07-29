const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const User = require('../models/User');
const Document = require('../models/Document');
const Category = require('../models/Category');
const Fee = require('../models/Fee');
const auth = require('../middleware/authMiddleware');
const { uploadToSupabase, getPublicUrl, deleteFromSupabase, generateUniqueFilename } = require('../config/supabaseConfig');

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();
const profileUpload = multer({
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

// Dashboard data
router.get('/dashboard', auth.verifyToken, async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalUsers = await User.countDocuments();
    
    let userDocuments = 0;
    if (req.user.role === 'student') {
      userDocuments = await Document.countDocuments();
    }

    res.json({
      totalDocuments,
      totalCategories,
      totalUsers,
      userDocuments,
      user: req.user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (admin, superadmin, and manager)
router.get('/', auth.verifyToken, auth.adminOrManagerOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create user (role-based permissions)
router.post('/', auth.verifyToken, auth.adminOrManagerOnly, profileUpload.single('profilePicture'), async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    role, 
    terminationDate, 
    dob, 
    dateJoinedLibrary, 
    slot, 
    seatNumber,
    phone 
  } = req.body;
  
  try {
    // Check permissions: only superadmin can create admin/superadmin accounts, managers can only create students
    if ((role === 'admin' || role === 'superadmin') && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can create admin accounts' });
    }
    
    if (req.user.role === 'manager' && role !== 'student') {
      return res.status(403).json({ message: 'Managers can only create student accounts' });
    }

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Validate student-specific fields
    if (role === 'student' || !role) {
      if (slot && !['morning', 'afternoon', 'full-day'].includes(slot)) {
        return res.status(400).json({ message: 'Invalid slot. Must be morning, afternoon, or full-day' });
      }
      
      if (seatNumber) {
        const seatNum = Number(seatNumber);
        if (isNaN(seatNum) || seatNum < 1 || seatNum > 38) {
          return res.status(400).json({ message: 'Seat number must be between 1 and 38' });
        }
        
        // Check if seat number is already taken
        const existingSeat = await User.findOne({ 
          seatNumber: seatNum, 
          role: 'student',
          terminationDate: null // Only check active students
        });
        if (existingSeat) {
          return res.status(400).json({ message: `Seat number ${seatNum} is already occupied` });
        }
      }
    }

    // Handle profile picture upload
    let profilePicture = null;
    let profilePictureUrl = null;
    
    if (req.file) {
      try {
        const uniqueFilename = generateUniqueFilename(req.file.originalname);
        const filePath = `profiles/${uniqueFilename}`;
        
        await uploadToSupabase(req.file, filePath);
        profilePicture = filePath;
        profilePictureUrl = getPublicUrl(filePath);
      } catch (uploadError) {
        console.error('Profile picture upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload profile picture' });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    const userData = {
      name: name.trim(),
      email,
      password: hashed,
      role: role || 'student',
      terminationDate,
      phone: phone ? phone.trim() : null
    };

    // Add student-specific fields if role is student
    if (role === 'student' || !role) {
      if (dob) userData.dob = new Date(dob);
      if (dateJoinedLibrary) userData.dateJoinedLibrary = new Date(dateJoinedLibrary);
      if (slot) userData.slot = slot;
      if (seatNumber) userData.seatNumber = Number(seatNumber);
      if (profilePicture) {
        userData.profilePicture = profilePicture;
        userData.profilePictureUrl = profilePictureUrl;
      }
    }

    const user = new User(userData);
    await user.save();

    // Generate fees for student if dateJoinedLibrary is provided
    if ((role === 'student' || !role) && dateJoinedLibrary) {
      try {
        await Fee.generateFeesForStudent(user._id, new Date(dateJoinedLibrary));
      } catch (feeError) {
        console.error('Error generating fees:', feeError);
        // Don't fail user creation if fee generation fails
      }
    }

    res.status(201).json({ 
      message: 'User created successfully', 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        dob: user.dob,
        dateJoinedLibrary: user.dateJoinedLibrary,
        slot: user.slot,
        seatNumber: user.seatNumber,
        profilePictureUrl: user.profilePictureUrl,
        phone: user.phone
      } 
    });
  } catch (err) {
    console.error('User creation error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update user termination date
router.put('/:id/termination', auth.verifyToken, auth.adminOnly, async (req, res) => {
  const { terminationDate } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow editing students, unless superadmin
    if (user.role !== 'student' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    user.terminationDate = terminationDate;
    await user.save();

    res.json({ message: 'Termination date updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (superadmin only)
router.put('/:id', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, role, terminationDate, phone } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name.trim();
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;
    if (role) user.role = role;
    if (terminationDate !== undefined) user.terminationDate = terminationDate ? new Date(terminationDate) : null;
    
    // Update password if provided
    if (password && password.trim()) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    await user.save();

    res.json({ 
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        terminationDate: user.terminationDate,
        phone: user.phone
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow deleting students, unless superadmin
    if (user.role !== 'student' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Prevent superadmin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get student profile (students can only access their own profile)
router.get('/profile/:id', auth.verifyToken, async (req, res) => {
  try {
    // Students can only access their own profile, admins and managers can access any profile
    if (req.user.role === 'student' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update student profile
router.put('/profile/:id', auth.verifyToken, profileUpload.single('profilePicture'), async (req, res) => {
  try {
    // Only admins and superadmins can update profiles, students cannot edit their own profiles
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Students cannot edit their profile. Contact an administrator.' });
    }
    
    // Managers cannot update profiles
    if (req.user.role === 'manager') {
      return res.status(403).json({ message: 'Managers cannot edit user profiles.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, dob, slot, seatNumber, phone } = req.body;
    
    // Validate student-specific updates
    if (slot && !['morning', 'afternoon', 'full-day'].includes(slot)) {
      return res.status(400).json({ message: 'Invalid slot. Must be morning, afternoon, or full-day' });
    }
    
    if (seatNumber) {
      const seatNum = Number(seatNumber);
      if (isNaN(seatNum) || seatNum < 1 || seatNum > 38) {
        return res.status(400).json({ message: 'Seat number must be between 1 and 38' });
      }
      
      // Check if seat number is already taken by another user
      const existingSeat = await User.findOne({ 
        seatNumber: seatNum, 
        role: 'student',
        _id: { $ne: req.params.id },
        terminationDate: null
      });
      if (existingSeat) {
        return res.status(400).json({ message: `Seat number ${seatNum} is already occupied` });
      }
    }

    // Handle profile picture upload
    if (req.file) {
      try {
        // Delete old profile picture if exists
        if (user.profilePicture) {
          try {
            await deleteFromSupabase(user.profilePicture);
          } catch (deleteError) {
            console.error('Error deleting old profile picture:', deleteError);
          }
        }

        const uniqueFilename = generateUniqueFilename(req.file.originalname);
        const filePath = `profiles/${uniqueFilename}`;
        
        await uploadToSupabase(req.file, filePath);
        user.profilePicture = filePath;
        user.profilePictureUrl = getPublicUrl(filePath);
      } catch (uploadError) {
        console.error('Profile picture upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload profile picture' });
      }
    }

    // Update fields
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;
    if (dob) user.dob = new Date(dob);
    if (slot) user.slot = slot;
    if (seatNumber) user.seatNumber = Number(seatNumber);

    await user.save();

    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json({ 
      message: 'Profile updated successfully', 
      user: updatedUser 
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all fees for admin and manager
router.get('/fees', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('student', 'name email seatNumber slot dateJoinedLibrary')
      .populate('paidBy', 'name')
      .sort({ year: -1, month: -1, 'student.name': 1 });

    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get fees for a specific student
router.get('/fees/:studentId', auth.verifyToken, async (req, res) => {
  try {
    // Students can only view their own fees, admins can view any
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const fees = await Fee.find({ student: req.params.studentId })
      .populate('paidBy', 'name')
      .sort({ year: 1, month: 1 });

    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update fee payment status (admin and manager)
router.put('/fees/:feeId', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const { paid, amount, notes } = req.body;
    
    const fee = await Fee.findById(req.params.feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (paid !== undefined) {
      fee.paid = paid;
      if (paid) {
        fee.paidDate = new Date();
        fee.paidBy = req.user.id;
      } else {
        fee.paidDate = null;
        fee.paidBy = null;
      }
    }
    
    if (amount !== undefined) fee.amount = amount;
    if (notes !== undefined) fee.notes = notes;

    await fee.save();

    const updatedFee = await Fee.findById(req.params.feeId)
      .populate('student', 'name email')
      .populate('paidBy', 'name');

    res.json({ 
      message: 'Fee updated successfully', 
      fee: updatedFee 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate missing fees for a student (admin and manager)
router.post('/fees/generate/:studentId', auth.verifyToken, auth.managerOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.dateJoinedLibrary) {
      return res.status(400).json({ message: 'Student join date not set' });
    }

    const { feeAmount = 1000 } = req.body;

    const generatedFees = await Fee.generateFeesForStudent(
      req.params.studentId, 
      student.dateJoinedLibrary, 
      feeAmount
    );

    res.json({ 
      message: `Generated ${generatedFees.length} fee records`, 
      fees: generatedFees 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
