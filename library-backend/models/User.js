const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    default: null
  },
  name: {
    type: String,
    required: false, // Made optional to handle existing users
    trim: true
  },
  username: {
    type: String,
    trim: true,
    default: null
  },
  loginId: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values but unique when not null
    default: null
  },
  email: {
    type: String,
    required: false, // Made optional since we use username-based login
    unique: true,
    sparse: true, // Allows multiple null values but unique when not null
    trim: true
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
    // Note: Slot validation is handled dynamically in routes based on library.slotTimings
    default: null
  },
  seatNumber: {
    type: Number,
    min: 1,
    // Note: Max validation is handled dynamically in routes based on library.totalSeats
    default: null
  },
  // End-to-end encryption: user's public key for wrapping conversation keys (PEM string)
  encryptionPublicKey: {
    type: String,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
