const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('📊 Connected to MongoDB');

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { role: 'admin' },
        { role: 'superadmin' }
      ]
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Role: ${existingAdmin.role}`);
      console.log('🔑 Try logging in with existing admin credentials');
      process.exit(0);
    }

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      name: 'Library Admin',
      email: 'admin@library.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    await adminUser.save();
    
    console.log('🎉 Super Admin user created successfully!');
    console.log('📧 Email: admin@library.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: superadmin');
    console.log('');
    console.log('🚀 You can now login to the system!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.log('📧 User with this email already exists');
    }
  } finally {
    mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

createAdminUser(); 