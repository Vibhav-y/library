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
const crypto = require('crypto');

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
    const libraryFilter = req.user.libraryId ? { library: req.user.libraryId } : {};
    const totalDocuments = await Document.countDocuments(libraryFilter);
    
    // Count only root categories (categories without parent)
    const totalCategories = await Category.countDocuments({
      ...libraryFilter,
      $or: [
        { parentCategory: null },
        { parentCategory: { $exists: false } }
      ]
    });
    
    // Count only students, not all users
    const totalUsers = await User.countDocuments({ role: 'student', ...libraryFilter });
    
    let userDocuments = 0;
    if (req.user.role === 'student') {
      userDocuments = await Document.countDocuments(libraryFilter);
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

// Get seat availability for visual selection
router.get('/seats/availability', auth.verifyToken, auth.adminOrManagerOnly, async (req, res) => {
  try {
    // Get current library to determine total seats
    const currentLibrary = await require('../models/Library').findById(req.user.libraryId);
    if (!currentLibrary) {
      return res.status(404).json({ message: 'Library not found' });
    }

    const totalSeats = currentLibrary.totalSeats || 50;
    
    // Get all occupied seats with their slot information (exclude soft-deleted users)
    const occupiedSeats = await User.find({
      library: req.user.libraryId,
      role: 'student',
      seatNumber: { $exists: true, $ne: null },
      terminationDate: null,
      deletedAt: null
    }, 'seatNumber slot name');

    // Create seat availability map
    const seatMap = {};
    for (let i = 1; i <= totalSeats; i++) {
      seatMap[i] = {
        seatNumber: i,
        available: true,
        occupiedBy: {},
        conflicts: []
      };
    }

    // Mark occupied seats
    occupiedSeats.forEach(user => {
      const seatNum = user.seatNumber;
      if (seatMap[seatNum]) {
        const slot = user.slot || 'full-day';
        
        if (slot === 'full-day') {
          // Full day occupation blocks all slots
          seatMap[seatNum].available = false;
          seatMap[seatNum].occupiedBy = {
            'full-day': {
              name: user.name,
              userId: user._id,
              slot: 'full-day'
            }
          };
        } else {
          // Partial occupation
          if (!seatMap[seatNum].occupiedBy[slot]) {
            seatMap[seatNum].occupiedBy[slot] = {
              name: user.name,
              userId: user._id,
              slot: slot
            };
          }

          // Check if this creates a conflict with full-day
          const hasFullDay = seatMap[seatNum].occupiedBy['full-day'];
          const hasOtherSlot = Object.keys(seatMap[seatNum].occupiedBy).filter(s => s !== slot && s !== 'full-day').length > 0;
          
          if (hasFullDay || hasOtherSlot) {
            seatMap[seatNum].available = false;
          }
        }
      }
    });

    res.json({
      totalSeats,
      seatMap: Object.values(seatMap),
      summary: {
        available: Object.values(seatMap).filter(seat => seat.available).length,
        occupied: Object.values(seatMap).filter(seat => !seat.available).length,
        partiallyOccupied: Object.values(seatMap).filter(seat => 
          Object.keys(seat.occupiedBy).length > 0 && seat.available
        ).length
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (admin, superadmin, and manager)
router.get('/', auth.verifyToken, auth.adminOrManagerOnly, async (req, res) => {
  try {
    const filter = req.user.libraryId ? { library: req.user.libraryId, deletedAt: null } : { deletedAt: null };
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create user (role-based permissions)
router.post('/', auth.verifyToken, auth.adminOrManagerOnly, profileUpload.single('profilePicture'), async (req, res) => {
  const { 
    name, 
    username,
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

    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check for existing email only if email is provided
    if (email && email.trim()) {
      const existing = await User.findOne({ email: email.trim() });
      if (existing) return res.status(400).json({ message: 'Email already exists' });
    }

    // Get current library to generate loginId
    const Library = require('../models/Library');
    const currentLibrary = await Library.findById(req.user.libraryId);
    if (!currentLibrary) {
      return res.status(400).json({ message: 'Library not found' });
    }

    // Generate loginId by combining username with library handle
    const loginId = `${username.trim()}${currentLibrary.handle}`;
    
    // Check if loginId already exists
    const existingLoginId = await User.findOne({ loginId });
    if (existingLoginId) {
      return res.status(400).json({ message: `Username ${username} is already taken in this library` });
    }

    // Validate student-specific fields
    if (role === 'student' || !role) {
      if (slot) {
        const validSlots = ['full-day']; // Always allow full-day
        
        if (currentLibrary.slotTimings && currentLibrary.slotTimings.length > 0) {
          // Add library's configured slots
          validSlots.push(...currentLibrary.slotTimings.map(s => s.name));
        } else {
          // Add fallback slots if no custom slots configured
          validSlots.push('morning', 'afternoon');
        }
        
        if (!validSlots.includes(slot)) {
          return res.status(400).json({ 
            message: `Invalid slot. Must be one of: ${validSlots.join(', ')}` 
          });
        }
      }
      
      if (seatNumber) {
        const seatNum = Number(seatNumber);
        if (isNaN(seatNum) || seatNum < 1 || seatNum > currentLibrary.totalSeats) {
          return res.status(400).json({ message: `Seat number must be between 1 and ${currentLibrary.totalSeats}` });
        }
        
        // Check if seat number is already taken
    const seatFilter = { seatNumber: seatNum, role: 'student', terminationDate: null, deletedAt: null };
    if (req.user.libraryId) seatFilter.library = req.user.libraryId;
    const existingSeat = await User.findOne(seatFilter);
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
      username: username.trim(),
      loginId,
      email: email && email.trim() ? email.trim() : null,
      password: hashed,
      role: role || 'student',
      terminationDate,
      phone: phone ? phone.trim() : null
    };

    // attach library context for created user if creator is scoped
    if (req.user.libraryId) {
      userData.library = req.user.libraryId;
    }

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
        await Fee.generateFeesForStudent(
          user._id, 
          new Date(dateJoinedLibrary),
          currentLibrary._id,
          slot || 'full-day'
        );
      } catch (feeError) {
        console.error('Error generating fees:', feeError);
        // Don't fail user creation if fee generation fails
      }
    }

    // Auto-enroll students into Announcement group
    try {
      if (user.role === 'student') {
        const Conversation = require('../models/Conversation');
        const announcement = await Conversation.getAnnouncementGroup();
        if (!announcement.isParticipant(user._id)) {
          announcement.addParticipant(user._id, 'member');
          await announcement.save();
        }
      }
    } catch (groupErr) {
      console.error('Error auto-enrolling student to Announcement:', groupErr);
      // Do not fail user creation on this
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

    // Enforce library scope for admins/managers
    if (req.user.role !== 'superadmin' && req.user.libraryId && user.library && user.library.toString() !== req.user.libraryId) {
      return res.status(403).json({ message: 'Access denied: different library context' });
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

// Soft delete user (preserves fee history and other records)
router.delete('/:id', auth.verifyToken, auth.adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if user is already deleted
    if (user.deletedAt) {
      return res.status(400).json({ message: 'User is already deleted' });
    }

    // Only allow deleting students, unless superadmin
    if (user.role !== 'student' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Prevent superadmin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Enforce library scope for admins/managers
    if (req.user.role !== 'superadmin' && req.user.libraryId && user.library && user.library.toString() !== req.user.libraryId) {
      return res.status(403).json({ message: 'Access denied: different library context' });
    }

    // Soft delete the user
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    await user.save();

    res.json({ 
      message: 'User deleted successfully (fee history preserved)',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        deletedAt: user.deletedAt
      }
    });
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

    // Enforce library scope for admins/managers
    if (req.user.role !== 'superadmin' && req.user.role !== 'student' && req.user.libraryId && user.library && user.library.toString() !== req.user.libraryId) {
      return res.status(403).json({ message: 'Access denied: different library context' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile (comprehensive editing with proper permissions)
router.put('/profile/:id', auth.verifyToken, profileUpload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Permission checks
    // 1. Users cannot edit themselves
    if (req.user.id === req.params.id) {
      return res.status(403).json({ message: 'You cannot edit your own profile' });
    }

    // 2. Students cannot edit anyone
    if (req.user.role === 'student') {
      return res.status(403).json({ message: 'Students cannot edit user profiles' });
    }
    
    // 3. Managers cannot edit anyone
    if (req.user.role === 'manager') {
      return res.status(403).json({ message: 'Managers cannot edit user profiles' });
    }

    // 4. Only superadmin can edit library admins
    if ((user.role === 'admin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can edit admin accounts' });
    }

    // 5. Enforce library scope for non-superadmins
    if (req.user.role !== 'superadmin' && req.user.libraryId && user.library && user.library.toString() !== req.user.libraryId) {
      return res.status(403).json({ message: 'Access denied: different library context' });
    }

    const { 
      name, 
      username, 
      email, 
      password, 
      role, 
      dob, 
      dateJoinedLibrary, 
      slot, 
      seatNumber, 
      phone, 
      terminationDate 
    } = req.body;
    
    // Validate student-specific updates
    if (slot) {
      const Library = require('../models/Library');
      const userLibrary = await Library.findById(user.library);
      
      const validSlots = ['full-day']; // Always allow full-day
      
      if (userLibrary && userLibrary.slotTimings && userLibrary.slotTimings.length > 0) {
        // Add library's configured slots
        validSlots.push(...userLibrary.slotTimings.map(s => s.name));
      } else {
        // Add fallback slots if no custom slots configured
        validSlots.push('morning', 'afternoon');
      }
      
      if (!validSlots.includes(slot)) {
        return res.status(400).json({ 
          message: `Invalid slot. Must be one of: ${validSlots.join(', ')}` 
        });
      }
    }
    
    if (seatNumber) {
      const seatNum = Number(seatNumber);
      
      // Get library to check max seats
      const Library = require('../models/Library');
      const userLibrary = await Library.findById(user.library);
      const maxSeats = userLibrary?.totalSeats || 50; // Default fallback
      
      if (isNaN(seatNum) || seatNum < 1 || seatNum > maxSeats) {
        return res.status(400).json({ message: `Seat number must be between 1 and ${maxSeats}` });
      }
      
      // Check if seat number is already taken by another user
      const existingSeat = await User.findOne({ 
        seatNumber: seatNum, 
        role: 'student',
        _id: { $ne: req.params.id },
        terminationDate: null,
        deletedAt: null
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

    // Validate additional fields
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.trim(), _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    if (username && username !== user.username) {
      // Generate new loginId if username changes
      const Library = require('../models/Library');
      const userLibrary = await Library.findById(user.library);
      if (userLibrary) {
        const newLoginId = `${username.trim()}${userLibrary.handle}`;
        const existingLoginId = await User.findOne({ loginId: newLoginId, _id: { $ne: req.params.id } });
        if (existingLoginId) {
          return res.status(400).json({ message: `Username ${username} is already taken in this library` });
        }
        user.loginId = newLoginId;
      }
    }

    if (role && role !== user.role) {
      // Role change validation - only superadmin can change roles
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmins can change user roles' });
      }
      // Additional role-specific validations
      if ((role === 'admin' || role === 'superadmin') && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmins can create admin accounts' });
      }
    }

    // Update fields
    if (name) user.name = name.trim();
    if (username) user.username = username.trim();
    if (email) user.email = email.trim();
    if (password && password.trim()) {
      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(password.trim(), 10);
    }
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;
    if (dob) user.dob = new Date(dob);
    if (dateJoinedLibrary) user.dateJoinedLibrary = new Date(dateJoinedLibrary);
    if (slot) user.slot = slot;
    if (seatNumber) user.seatNumber = Number(seatNumber);
    if (terminationDate !== undefined) {
      user.terminationDate = terminationDate ? new Date(terminationDate) : null;
    }

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
      .populate('student', 'name email seatNumber slot dateJoinedLibrary library')
      .populate('paidBy', 'name')
      .sort({ year: -1, month: -1, 'student.name': 1 });
    let filtered = fees;
    if (req.user.libraryId) {
      filtered = fees.filter(f => f.student && f.student.library && f.student.library.toString() === req.user.libraryId);
    }
    res.json(filtered);
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

    // Enforce library scope
    if (req.user.libraryId && req.user.role !== 'superadmin') {
      const target = await User.findById(req.params.studentId);
      if (!target) return res.status(404).json({ message: 'Student not found' });
      if (target.library && target.library.toString() !== req.user.libraryId) {
        return res.status(403).json({ message: 'Access denied: different library context' });
      }
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

    // Enforce library scope
    if (req.user.libraryId && req.user.role !== 'superadmin') {
      const student = await User.findById(fee.student);
      if (student && student.library && student.library.toString() !== req.user.libraryId) {
        return res.status(403).json({ message: 'Access denied: different library context' });
      }
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

    // Enforce library scope
    if (req.user.libraryId && req.user.role !== 'superadmin') {
      if (student.library && student.library.toString() !== req.user.libraryId) {
        return res.status(403).json({ message: 'Access denied: different library context' });
      }
    }

    if (!student.dateJoinedLibrary) {
      return res.status(400).json({ message: 'Student join date not set' });
    }

    const { feeAmount = 1000 } = req.body;

    const generatedFees = await Fee.generateFeesForStudent(
      req.params.studentId, 
      student.dateJoinedLibrary, 
      req.user.libraryId,
      student.slot || 'full-day',
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

// E2EE: Set or update user's public key (user can set their own)
router.put('/encryption/public-key', auth.verifyToken, async (req, res) => {
  try {
    const { publicKeyPem } = req.body;
    if (!publicKeyPem || typeof publicKeyPem !== 'string' || publicKeyPem.length < 50) {
      return res.status(400).json({ message: 'Valid PEM public key is required' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.encryptionPublicKey = publicKeyPem;
    await user.save();
    res.json({ message: 'Public key saved' });
  } catch (err) {
    console.error('Set public key error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// E2EE: Superadmin fetch users' public keys
router.get('/encryption/public-keys', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role encryptionPublicKey');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// E2EE: Superadmin clear a user's public key
router.delete('/encryption/public-key/:userId', auth.verifyToken, auth.superAdminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.encryptionPublicKey = null;
    await user.save();
    res.json({ message: 'Public key cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
