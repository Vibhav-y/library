const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        terminationDate: user.terminationDate
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
