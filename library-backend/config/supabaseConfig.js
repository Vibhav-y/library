const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://whxqigaladikvofocwpu.supabase.co',
  process.env.SUPABASE_ANON_KEY
);

// Configure multer for file handling (we'll upload to Supabase after multer processes)
const storage = multer.memoryStorage(); // Store files in memory temporarily

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload file to Supabase Storage
const uploadToSupabase = async (file, filename) => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
};

// Get public URL for a file
const getPublicUrl = (filename) => {
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(filename);
  
  return data.publicUrl;
};

// Delete file from Supabase Storage
const deleteFromSupabase = async (filename) => {
  try {
    const { error } = await supabase.storage
      .from('documents')
      .remove([filename]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Supabase delete error:', error);
    throw error;
  }
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
  return `${timestamp}-${randomNum}-${nameWithoutExt}.${extension}`;
};

module.exports = {
  upload,
  uploadToSupabase,
  getPublicUrl,
  deleteFromSupabase,
  generateUniqueFilename,
  supabase
}; 