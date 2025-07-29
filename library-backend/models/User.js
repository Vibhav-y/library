const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Made optional to handle existing users
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin', 'manager'],
    default: 'student'
  },
  phone: {
    type: String,
    default: null,
    trim: true
  },
  terminationDate: {
    type: Date,
    default: null
  },
  favoriteDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  
  // Student-specific fields
  dob: {
    type: Date,
    default: null
  },
  profilePicture: {
    type: String, // Supabase storage key
    default: null
  },
  profilePictureUrl: {
    type: String, // Public URL
    default: null
  },
  dateJoinedLibrary: {
    type: Date,
    default: null
  },
  slot: {
    type: String,
    enum: ['morning', 'afternoon', 'full-day'],
    default: null
  },
  seatNumber: {
    type: Number,
    min: 1,
    max: 38,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
