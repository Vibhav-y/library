const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('../models/User');
const Library = require('../models/Library');
const Document = require('../models/Document');
const Category = require('../models/Category');
const Fee = require('../models/Fee');
const GalleryImage = require('../models/GalleryImage');
const Announcement = require('../models/Announcement');
const Notice = require('../models/Notice');
const ThoughtOfTheDay = require('../models/ThoughtOfTheDay');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { initializePredefinedThemes, initializeCustomization } = require('../models/Customization');

async function resetAndSeed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not set. Aborting.');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('📊 Connected to MongoDB');

  try {
    // Wipe all tenant data (keep indexes)
    await Promise.all([
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      Document.deleteMany({}),
      Category.deleteMany({}),
      GalleryImage.deleteMany({}),
      Fee.deleteMany({}),
      Announcement.deleteMany({}),
      Notice.deleteMany({}),
      ThoughtOfTheDay.deleteMany({}),
      Library.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('🧹 Cleared all collections');

    // Initialize themes/customization
    await initializePredefinedThemes();
    await initializeCustomization();
    console.log('🎨 Initialized themes and customization');

    // Seed master (superadmin) account
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const master = new User({
      name: 'Master Admin',
      email: 'admin@library.com',
      password: hashedPassword,
      role: 'superadmin'
    });
    await master.save();
    console.log('👑 Master admin created: admin@library.com / admin123');

    console.log('✅ Reset and seed complete');
  } catch (err) {
    console.error('❌ Error during reset/seed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
}

resetAndSeed();


