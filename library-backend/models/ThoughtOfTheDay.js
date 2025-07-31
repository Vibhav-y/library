const mongoose = require('mongoose');

const thoughtOfTheDaySchema = new mongoose.Schema({
  thought: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  author: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Anonymous'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
thoughtOfTheDaySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get thought for a specific date
thoughtOfTheDaySchema.statics.getThoughtForDate = async function(date = new Date()) {
  const thoughts = await this.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  
  if (thoughts.length === 0) {
    return null;
  }
  
  // Calculate days since epoch to ensure consistent rotation
  const epoch = new Date('2024-01-01');
  const daysSinceEpoch = Math.floor((date - epoch) / (1000 * 60 * 60 * 24));
  
  // Use modulo to cycle through thoughts
  const thoughtIndex = daysSinceEpoch % thoughts.length;
  
  return thoughts[thoughtIndex];
};

module.exports = mongoose.model('ThoughtOfTheDay', thoughtOfTheDaySchema);