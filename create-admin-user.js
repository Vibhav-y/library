const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./library-backend/models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library');
    console.log('📊 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@library.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists: admin@library.com');
      console.log('🔑 Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      name: 'Library Admin',
      email: 'admin@library.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    await adminUser.save();
    
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@library.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: superadmin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

createAdminUser(); 