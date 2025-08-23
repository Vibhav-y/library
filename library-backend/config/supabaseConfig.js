const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://whxqigaladikvofocwpu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

// Public client (anon) – fine for public reads
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client (service role) – required for signed URLs and private bucket ops
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

// Upload file to Supabase Storage (default bucket: 'documents')
const uploadToSupabase = async (file, filename) => {
  try {
    const { data, error } = await supabaseAdmin.storage
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

// Generic upload helper to any bucket
const uploadToBucket = async (file, filename, bucketName) => {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
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

// Create signed URL for private buckets
const getSignedUrl = async (filename, expiresIn = 60 * 60) => {
  const { data, error } = await supabaseAdmin.storage
    .from('documents')
    .createSignedUrl(filename, expiresIn);
  if (error) {
    throw error;
  }
  return data.signedUrl;
};

// Generic public URL helper
const getPublicUrlFromBucket = (filename, bucketName) => {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filename);
  return data.publicUrl;
};

// Delete file from Supabase Storage
const deleteFromSupabase = async (filename) => {
  try {
    const { error } = await supabaseAdmin.storage
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
  uploadToBucket,
  getPublicUrl,
  getSignedUrl,
  getPublicUrlFromBucket,
  deleteFromSupabase,
  generateUniqueFilename,
  supabase,
  supabaseAdmin
}; 