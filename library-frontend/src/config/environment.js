// Environment Configuration
// Change ENVIRONMENT to switch between 'development' and 'production'

const ENVIRONMENT = 'production'; // Change this to 'development' for localhost

const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000',
    name: 'Development (Localhost)',
    description: 'Local development server'
  },
  production: {
    API_BASE_URL: 'https://library-hpen.onrender.com',
    name: 'Production (Render)',
    description: 'Deployed server on Render'
  }
};

// Get current environment configuration
const currentConfig = config[ENVIRONMENT];

if (!currentConfig) {
  throw new Error(`Invalid environment: ${ENVIRONMENT}. Must be 'development' or 'production'`);
}

console.log(`🌍 Environment: ${currentConfig.name}`);
console.log(`📡 API URL: ${currentConfig.API_BASE_URL}`);

export const API_BASE_URL = currentConfig.API_BASE_URL;
export const ENVIRONMENT_NAME = currentConfig.name;
export const ENVIRONMENT_DESCRIPTION = currentConfig.description;
export const IS_DEVELOPMENT = ENVIRONMENT === 'development';
export const IS_PRODUCTION = ENVIRONMENT === 'production';

// Export the config for easy switching
export default {
  API_BASE_URL,
  ENVIRONMENT_NAME,
  ENVIRONMENT_DESCRIPTION,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  CURRENT_ENV: ENVIRONMENT
}; 