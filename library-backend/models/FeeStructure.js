const mongoose = require('mongoose');

const slotFeeSchema = new mongoose.Schema({
  slotType: { 
    type: String, 
    required: true,
    // Note: slotType validation is handled dynamically based on library.slotTimings
    trim: true 
  },
  slotName: {
    type: String,
    required: true,
    trim: true
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  description: {
    type: String,
    default: '',
    trim: true
  }
}, { _id: false });

const feeStructureSchema = new mongoose.Schema({
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  slotFees: [slotFeeSchema],
  effectiveFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  effectiveTo: {
    type: Date,
    default: null // null means currently active
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure proper ordering and filtering
feeStructureSchema.index({ library: 1, effectiveFrom: -1 });
feeStructureSchema.index({ library: 1, isActive: 1, effectiveFrom: -1 });

// Virtual to check if this structure is currently effective
feeStructureSchema.virtual('isCurrent').get(function() {
  const now = new Date();
  return this.isActive && 
         this.effectiveFrom <= now && 
         (!this.effectiveTo || this.effectiveTo > now);
});

// Static method to get current fee structure for a library
feeStructureSchema.statics.getCurrentStructure = async function(libraryId) {
  const now = new Date();
  return await this.findOne({
    library: libraryId,
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gt: now } }
    ]
  }).sort({ effectiveFrom: -1 });
};

// Static method to get fee structure effective for a specific date
feeStructureSchema.statics.getStructureForDate = async function(libraryId, date) {
  return await this.findOne({
    library: libraryId,
    isActive: true,
    effectiveFrom: { $lte: date },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gt: date } }
    ]
  }).sort({ effectiveFrom: -1 });
};

// Static method to get fee amount for a specific slot and date
feeStructureSchema.statics.getFeeForSlot = async function(libraryId, slotType, date = new Date()) {
  const structure = await this.getStructureForDate(libraryId, date);
  if (!structure) {
    return null;
  }
  
  const slotFee = structure.slotFees.find(sf => sf.slotType === slotType);
  return slotFee ? slotFee.amount : null;
};

// Instance method to deactivate this structure (when a new one is created)
feeStructureSchema.methods.deactivate = async function(effectiveTo = new Date()) {
  this.effectiveTo = effectiveTo;
  this.isActive = false;
  return await this.save();
};

// Pre-save middleware to handle effective date validation
feeStructureSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('effectiveFrom')) {
    // Ensure effectiveFrom is not in the past (except for migration/admin purposes)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    if (this.effectiveFrom < now && this.isNew) {
      // Allow backdating only if explicitly set by admin
      console.warn('FeeStructure created with past effective date');
    }
    
    // If this is a new active structure, deactivate overlapping ones
    if (this.isActive && this.isNew) {
      await this.constructor.updateMany(
        {
          library: this.library,
          isActive: true,
          effectiveFrom: { $lte: this.effectiveFrom },
          $or: [
            { effectiveTo: null },
            { effectiveTo: { $gt: this.effectiveFrom } }
          ]
        },
        {
          $set: {
            effectiveTo: this.effectiveFrom,
            isActive: false
          }
        }
      );
    }
  }
  
  next();
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
