require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Supabase Bucket Connection Test...\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://whxqigaladikvofocwpu.supabase.co',
  process.env.SUPABASE_ANON_KEY
);

// Test configuration
const BUCKET_NAME = 'documents';
const TEST_FILE_NAME = 'test-connection-file.txt';
const TEST_FILE_CONTENT = 'This is a test file to check bucket connection. Created at: ' + new Date().toISOString();

// Helper function to print results
function printResult(testName, success, message, data = null) {
  const emoji = success ? '✅' : '❌';
  console.log(`${emoji} ${testName}: ${message}`);
  if (data && process.env.NODE_ENV === 'development') {
    console.log('   Data:', data);
  }
  console.log('');
}

// Helper function to create a test buffer
function createTestFileBuffer() {
  return Buffer.from(TEST_FILE_CONTENT, 'utf8');
}

// Test functions
async function testSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase Client Connection...');
    
    // Test basic connection by trying to get user (this will work even if no user is logged in)
    const { data, error } = await supabase.auth.getUser();
    
    // This is expected to work (even if user is null)
    if (error && error.message !== 'Invalid JWT') {
      throw error;
    }
    
    printResult('Supabase Connection', true, 'Successfully connected to Supabase');
    return true;
  } catch (error) {
    printResult('Supabase Connection', false, `Failed to connect: ${error.message}`);
    return false;
  }
}

async function testBucketExists() {
  try {
    console.log('🪣 Testing Bucket Existence...');
    
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    const bucketExists = data.some(bucket => bucket.name === BUCKET_NAME);
    
    if (bucketExists) {
      printResult('Bucket Existence', true, `Bucket "${BUCKET_NAME}" exists`);
      return true;
    } else {
      printResult('Bucket Existence', false, `Bucket "${BUCKET_NAME}" not found. Available buckets: ${data.map(b => b.name).join(', ')}`);
      return false;
    }
  } catch (error) {
    printResult('Bucket Existence', false, `Failed to check bucket: ${error.message}`);
    return false;
  }
}

async function testUploadFile() {
  try {
    console.log('📤 Testing File Upload...');
    
    const fileBuffer = createTestFileBuffer();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(TEST_FILE_NAME, fileBuffer, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    printResult('File Upload', true, `Successfully uploaded test file: ${TEST_FILE_NAME}`, data);
    return true;
  } catch (error) {
    printResult('File Upload', false, `Failed to upload file: ${error.message}`);
    return false;
  }
}

async function testGetPublicUrl() {
  try {
    console.log('🌐 Testing Public URL Generation...');
    
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(TEST_FILE_NAME);
    
    if (!data || !data.publicUrl) {
      throw new Error('No public URL returned');
    }
    
    printResult('Public URL', true, `Successfully generated public URL: ${data.publicUrl}`, data);
    return data.publicUrl;
  } catch (error) {
    printResult('Public URL', false, `Failed to get public URL: ${error.message}`);
    return null;
  }
}

async function testDownloadFile() {
  try {
    console.log('📥 Testing File Download...');
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(TEST_FILE_NAME);
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from download');
    }
    
    // Convert blob to text to verify content
    const text = await data.text();
    const contentMatches = text.includes('This is a test file to check bucket connection');
    
    if (contentMatches) {
      printResult('File Download', true, 'Successfully downloaded and verified file content');
      return true;
    } else {
      printResult('File Download', false, 'File downloaded but content doesn\'t match');
      return false;
    }
  } catch (error) {
    printResult('File Download', false, `Failed to download file: ${error.message}`);
    return false;
  }
}

async function testListFiles() {
  try {
    console.log('📋 Testing File Listing...');
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 10,
        offset: 0
      });
    
    if (error) {
      throw error;
    }
    
    const fileCount = data ? data.length : 0;
    const testFileExists = data ? data.some(file => file.name === TEST_FILE_NAME) : false;
    
    printResult('File Listing', true, `Found ${fileCount} files in bucket. Test file present: ${testFileExists}`);
    
    if (fileCount > 0) {
      console.log('   Recent files:');
      data.slice(0, 5).forEach(file => {
        console.log(`   - ${file.name} (${(file.metadata?.size || 0)} bytes)`);
      });
      console.log('');
    }
    
    return true;
  } catch (error) {
    printResult('File Listing', false, `Failed to list files: ${error.message}`);
    return false;
  }
}

async function testDeleteFile() {
  try {
    console.log('🗑️ Testing File Deletion...');
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([TEST_FILE_NAME]);
    
    if (error) {
      throw error;
    }
    
    printResult('File Deletion', true, `Successfully deleted test file: ${TEST_FILE_NAME}`);
    return true;
  } catch (error) {
    printResult('File Deletion', false, `Failed to delete file: ${error.message}`);
    return false;
  }
}

async function testBucketPermissions() {
  try {
    console.log('🔐 Testing Bucket Permissions...');
    
    // Try to get bucket details
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    
    if (error) {
      // This might fail due to permissions, which is normal
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        printResult('Bucket Permissions', true, 'Bucket permissions are properly restricted (expected behavior)');
        return true;
      } else {
        throw error;
      }
    }
    
    printResult('Bucket Permissions', true, 'Successfully accessed bucket details', data);
    return true;
  } catch (error) {
    printResult('Bucket Permissions', false, `Permission test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('=' * 60);
  console.log('🧪 SUPABASE BUCKET CONNECTION TEST SUITE');
  console.log('=' * 60);
  console.log('');
  
  // Print configuration
  console.log('📋 Configuration:');
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL || 'https://whxqigaladikvofocwpu.supabase.co'}`);
  console.log(`   Bucket Name: ${BUCKET_NAME}`);
  console.log(`   Test File: ${TEST_FILE_NAME}`);
  console.log(`   Has Anon Key: ${process.env.SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);
  console.log('');
  
  const results = {
    connection: false,
    bucketExists: false,
    upload: false,
    publicUrl: false,
    download: false,
    list: false,
    delete: false,
    permissions: false
  };
  
  // Run tests in sequence
  results.connection = await testSupabaseConnection();
  
  if (results.connection) {
    results.bucketExists = await testBucketExists();
    
    if (results.bucketExists) {
      results.upload = await testUploadFile();
      
      if (results.upload) {
        results.publicUrl = await testGetPublicUrl();
        results.download = await testDownloadFile();
        results.list = await testListFiles();
        results.delete = await testDeleteFile();
      }
      
      results.permissions = await testBucketPermissions();
    }
  }
  
  // Print summary
  console.log('=' * 60);
  console.log('📊 TEST SUMMARY');
  console.log('=' * 60);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`Overall Status: ${passedTests}/${totalTests} tests passed\n`);
  
  for (const [test, passed] of Object.entries(results)) {
    const emoji = passed ? '✅' : '❌';
    console.log(`${emoji} ${test.charAt(0).toUpperCase() + test.slice(1)}`);
  }
  
  console.log('');
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your Supabase bucket connection is working perfectly.');
  } else if (results.connection && results.bucketExists) {
    console.log('⚠️ Basic connection works, but some operations failed. Check the errors above.');
  } else {
    console.log('❌ Basic connection issues detected. Please check your configuration.');
  }
  
  console.log('\n💡 Tips:');
  console.log('   - Make sure your .env file has SUPABASE_ANON_KEY set');
  console.log('   - Verify the bucket "documents" exists in your Supabase dashboard');
  console.log('   - Check that your bucket has proper public access policies');
  console.log('   - Run this test after any configuration changes');
  
  console.log('\n🔗 Useful Links:');
  console.log('   - Supabase Dashboard: https://app.supabase.com');
  console.log('   - Storage Documentation: https://docs.supabase.com/guides/storage');
  
  console.log('\n' + '=' * 60);
}

// Error handling for the main execution
async function main() {
  try {
    await runAllTests();
  } catch (error) {
    console.error('\n💥 Fatal error during testing:');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  testSupabaseConnection,
  testBucketExists,
  testUploadFile,
  testGetPublicUrl,
  testDownloadFile,
  testListFiles,
  testDeleteFile,
  testBucketPermissions
}; 