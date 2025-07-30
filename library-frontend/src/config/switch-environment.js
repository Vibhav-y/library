// Quick Environment Switcher
// Run this file to quickly switch between development and production

const fs = require('fs');
const path = require('path');

const environmentFilePath = path.join(__dirname, 'environment.js');

const args = process.argv.slice(2);
const targetEnv = args[0];

if (!targetEnv || !['development', 'production'].includes(targetEnv)) {
  console.log('❌ Usage: node switch-environment.js [development|production]');
  console.log('');
  console.log('Examples:');
  console.log('  node switch-environment.js development  # Switch to localhost');
  console.log('  node switch-environment.js production   # Switch to Render');
  process.exit(1);
}

try {
  // Read current environment file
  let content = fs.readFileSync(environmentFilePath, 'utf8');
  
  // Replace the ENVIRONMENT line
  const oldPattern = /const ENVIRONMENT = '[^']+';/;
  const newLine = `const ENVIRONMENT = '${targetEnv}';`;
  
  content = content.replace(oldPattern, newLine);
  
  // Write back to file
  fs.writeFileSync(environmentFilePath, content, 'utf8');
  
  const envNames = {
    development: '🏠 Development (Localhost)',
    production: '🌐 Production (Render)'
  };
  
  console.log(`✅ Successfully switched to: ${envNames[targetEnv]}`);
  console.log(`📡 API URL: ${targetEnv === 'development' ? 'http://localhost:5000' : 'https://library-hpen.onrender.com'}`);
  console.log('');
  console.log('🔄 Please restart your development server for changes to take effect.');
  
} catch (error) {
  console.error('❌ Error switching environment:', error.message);
  process.exit(1);
} 