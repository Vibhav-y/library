// File: server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    '*'  // Replace with your Vercel frontend URL
  ],
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/document', require('./routes/document'));
app.use('/api/category', require('./routes/category'));
app.use('/api/students', require('./routes/student'));
app.use('/api/notice', require('./routes/notice'));
app.use('/api/customization', require('./routes/customization'));

// Simple migration function for existing users without names
const migrateExistingUsers = async () => {
  try {
    const User = require('./models/User');
    const usersWithoutNames = await User.find({ 
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' }
      ]
    });
    
    if (usersWithoutNames.length > 0) {
      console.log(`Found ${usersWithoutNames.length} users without names. Adding default names...`);
      
      for (const user of usersWithoutNames) {
        const emailName = user.email.split('@')[0];
        const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        user.name = capitalizedName;
        await user.save();
      }
      
      console.log('Migration completed: Added default names to existing users');
    }
  } catch (error) {
    console.log('Migration skipped:', error.message);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library')
.then(async () => {
  console.log('MongoDB connected');
  
  // Run migration after database connection
  migrateExistingUsers();
  
  // Initialize customization models
  const { initializePredefinedThemes, initializeCustomization } = require('./models/Customization');
  await initializePredefinedThemes();
  await initializeCustomization();
})
.catch(err => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});