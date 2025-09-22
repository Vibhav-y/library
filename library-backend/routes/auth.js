const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Library = require('../models/Library');
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Support multi-tenant handle-based login: username@handle
    let lookupEmail = email;
    let requestedHandle = null;
    if (email.includes('@')) {
      const [usernamePart, handlePart] = email.split('@');
      if (usernamePart && handlePart) {
        requestedHandle = `@${handlePart.toLowerCase()}`;
        lookupEmail = `${usernamePart}@${handlePart}`; // stored as-is among tenants
      }
    }

    const user = await User.findOne({ email: lookupEmail }).populate('library');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Check if account is expired
    if (user.terminationDate) {
      const currentDate = new Date();
      const terminationDate = new Date(user.terminationDate);
      
      // Set time to end of day for termination date comparison
      terminationDate.setHours(23, 59, 59, 999);
      
      if (currentDate > terminationDate) {
        return res.status(403).json({ 
          message: 'Account has expired. Please contact an administrator to extend your access.',
          expired: true,
          terminationDate: user.terminationDate
        });
      }
    }

    // If user doesn't have a name, create one from email
    if (!user.name) {
      const emailName = user.email.split('@')[0];
      const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      user.name = capitalizedName;
      await user.save();
    }

    // Determine library context: user.library if present
    const tokenPayload = { id: user._id, role: user.role };
    if (user.library) {
      tokenPayload.actingLibraryId = user.library._id.toString();
    }
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        libraryId: user.library ? user.library._id : null,
        terminationDate: user.terminationDate
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// God admin login (separate page). Only users with role superadmin.
router.post('/god/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || user.role !== 'superadmin') {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('God login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// God admin impersonate/switch to a library context
router.post('/god/impersonate', async (req, res) => {
  const { token: godToken, libraryId } = req.body;
  try {
    if (!godToken || !libraryId) return res.status(400).json({ message: 'Token and libraryId required' });
    const decoded = jwt.verify(godToken, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') return res.status(403).json({ message: 'Access denied' });

    const library = await Library.findById(libraryId);
    if (!library || !library.isActive) return res.status(404).json({ message: 'Library not found' });

    // Issue a new token with actingLibraryId set
    const impersonationToken = jwt.sign({ id: decoded.id, role: decoded.role, actingLibraryId: library._id.toString() }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token: impersonationToken, library: { id: library._id, name: library.name, handle: library.handle } });
  } catch (err) {
    console.error('God impersonate error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
