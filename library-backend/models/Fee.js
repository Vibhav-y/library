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
feeSchema.statics.generateFeesForStudent = async function(studentId, joinDate, feeAmount = 1000) {
  const currentDate = new Date();
  const startDate = new Date(joinDate);
  
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
      fees.push({
        student: studentId,
        month: currentMonth,
        year: currentYear,
        amount: feeAmount,
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

module.exports = mongoose.model('Fee', feeSchema); 