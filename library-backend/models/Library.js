const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  startTime: { type: String, required: true }, // e.g., "08:00"
  endTime: { type: String, required: true } // e.g., "12:00"
}, { _id: false });

const contactSchema = new mongoose.Schema({
  phone: { type: String, trim: true, default: null },
  email: { type: String, trim: true, default: null },
  address: { type: String, trim: true, default: null },
  website: { type: String, trim: true, default: null }
}, { _id: false });

const librarySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  handle: { type: String, required: true, unique: true, lowercase: true, trim: true }, // like @sunview.com
  totalSeats: { type: Number, required: true, min: 1 },
  slots: { type: [slotSchema], default: [] },
  allDayAvailable: { type: Boolean, default: true },
  contact: { type: contactSchema, default: {} },
  features: {
    chatEnabled: { type: Boolean, default: true },
    documentUploadsEnabled: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Normalize handle to start with '@'
librarySchema.pre('validate', function(next) {
  if (this.handle && !this.handle.startsWith('@')) {
    this.handle = `@${this.handle}`;
  }
  next();
});

module.exports = mongoose.model('Library', librarySchema);


