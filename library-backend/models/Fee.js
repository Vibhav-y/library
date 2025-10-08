const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number, // 1-12
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 1000 // Default fee amount
  },
  originalAmount: {
    type: Number,
    required: true,
    default: function() { return this.amount; } // Track original amount from fee structure
  },
  slotType: {
    type: String,
    // Note: slotType validation is handled dynamically based on library.slotTimings
    default: 'full-day'
  },
  slotName: {
    type: String,
    default: 'Full Day'
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    default: null // Reference to the fee structure used
  },
  library: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    required: true
  },
  paid: {
    type: Boolean,
    default: false
  },
  paidDate: {
    type: Date,
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who marked as paid
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  isManuallyAdjusted: {
    type: Boolean,
    default: false // Track if amount was manually changed from structure
  },
  adjustmentReason: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure unique fee per student per month/year
feeSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });

// Helper method to get month name
feeSchema.virtual('monthName').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[this.month - 1];
});

// Static method to generate fees for a student from join date to current date
feeSchema.statics.generateFeesForStudent = async function(studentId, joinDate, libraryId, slotType = 'full-day', feeAmount = null) {
  const User = require('./User');
  const FeeStructure = require('./FeeStructure');
  
  const currentDate = new Date();
  const startDate = new Date(joinDate);
  
  // Get student details to determine slot if not provided
  const student = await User.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }
  
  const studentSlotType = slotType || student.slot || 'full-day';
  
  const fees = [];
  let currentMonth = startDate.getMonth() + 1; // getMonth() returns 0-11
  let currentYear = startDate.getFullYear();
  
  while (currentYear < currentDate.getFullYear() || 
         (currentYear === currentDate.getFullYear() && currentMonth <= currentDate.getMonth() + 1)) {
    
    // Check if fee already exists
    const existingFee = await this.findOne({
      student: studentId,
      month: currentMonth,
      year: currentYear
    });
    
    if (!existingFee) {
      // Get the first day of the month to determine which fee structure was active
      const monthStartDate = new Date(currentYear, currentMonth - 1, 1);
      
      // Get appropriate fee structure for this month
      const feeStructure = await FeeStructure.getStructureForDate(libraryId, monthStartDate);
      let monthFeeAmount = feeAmount;
      let feeStructureId = null;
      let slotName = studentSlotType;
      
      if (feeStructure) {
        const slotFee = feeStructure.slotFees.find(sf => sf.slotType === studentSlotType);
        if (slotFee) {
          monthFeeAmount = slotFee.amount;
          slotName = slotFee.slotName;
          feeStructureId = feeStructure._id;
        }
      }
      
      // Use provided amount or default if no structure found
      if (monthFeeAmount === null) {
        monthFeeAmount = 1000; // Default fallback
      }
      
      fees.push({
        student: studentId,
        month: currentMonth,
        year: currentYear,
        amount: monthFeeAmount,
        originalAmount: monthFeeAmount,
        slotType: studentSlotType,
        slotName: slotName,
        feeStructure: feeStructureId,
        library: libraryId,
        paid: false
      });
    }
    
    // Move to next month
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  if (fees.length > 0) {
    await this.insertMany(fees);
  }
  
  return fees;
};

// Static method to regenerate fees from a specific date using new fee structure
feeSchema.statics.regenerateFeesFromDate = async function(libraryId, effectiveFromDate, newFeeStructureId) {
  const FeeStructure = require('./FeeStructure');
  
  const newStructure = await FeeStructure.findById(newFeeStructureId);
  if (!newStructure) {
    throw new Error('Fee structure not found');
  }
  
  const startDate = new Date(effectiveFromDate);
  const currentDate = new Date();
  
  // Find all unpaid fees from the effective date onwards for this library
  const feesToUpdate = await this.find({
    library: libraryId,
    paid: false, // Only update unpaid fees
    $or: [
      { year: { $gt: startDate.getFullYear() } },
      { 
        year: startDate.getFullYear(), 
        month: { $gte: startDate.getMonth() + 1 } 
      }
    ]
  }).populate('student');
  
  const updatePromises = feesToUpdate.map(async (fee) => {
    const slotFee = newStructure.slotFees.find(sf => sf.slotType === fee.student.slot);
    if (slotFee) {
      fee.amount = slotFee.amount;
      fee.originalAmount = slotFee.amount;
      fee.slotName = slotFee.slotName;
      fee.feeStructure = newFeeStructureId;
      fee.isManuallyAdjusted = false; // Reset manual adjustment flag
      return fee.save();
    }
    return fee;
  });
  
  await Promise.all(updatePromises);
  return feesToUpdate.length;
};

module.exports = mongoose.model('Fee', feeSchema); 