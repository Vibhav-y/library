const mongoose = require('mongoose');

// Gallery Image Schema
const galleryImageSchema = new mongoose.Schema({
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageKey: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for ordering
galleryImageSchema.index({ order: 1, isActive: 1 });

// Static method to get ordered active images
galleryImageSchema.statics.getActiveImages = function() {
  return this.find({ isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .populate('uploadedBy', 'name email');
};

const GalleryImage = mongoose.model('GalleryImage', galleryImageSchema);

module.exports = GalleryImage;