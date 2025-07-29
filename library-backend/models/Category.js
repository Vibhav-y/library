const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  path: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: null
  },
  imagePublicUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Compound index to ensure unique names within the same parent
categorySchema.index({ name: 1, parentCategory: 1 }, { unique: true });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Pre-save middleware to set level and path
categorySchema.pre('save', async function(next) {
  if (this.parentCategory) {
    const parent = await this.constructor.findById(this.parentCategory);
    if (parent) {
      this.level = parent.level + 1;
      this.path = parent.path ? `${parent.path}/${parent.name}` : parent.name;
    }
  } else {
    this.level = 0;
    this.path = '';
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);