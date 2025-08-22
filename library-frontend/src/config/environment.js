// Environment Configuration
// Change ENVIRONMENT to switch between 'development' and 'production'

const ENVIRONMENT = 'production';

// Runtime-aware backend URL resolver with sensible defaults
const getBackendBaseUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string') return envUrl;
  try {
    if (typeof window !== 'undefined') {
      if (window.__BACKEND_URL__) return window.__BACKEND_URL__;
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      return isLocal ? 'http://localhost:5000' : 'https://library-hpen.onrender.com';
    }
  } catch {}
  return 'https://library-hpen.onrender.com';
};

export const API_BASE_URL = getBackendBaseUrl();
export const ENVIRONMENT_NAME = ['http://localhost:5000', 'http://localhost:3000'].some(u => API_BASE_URL.includes('localhost')) ? 'Development (Localhost)' : 'Production (Render)';
export const ENVIRONMENT_DESCRIPTION = 'Resolved at runtime based on env/origin';
export const IS_DEVELOPMENT = ENVIRONMENT_NAME.startsWith('Development');
export const IS_PRODUCTION = !IS_DEVELOPMENT;

export default {
  API_BASE_URL,
  ENVIRONMENT_NAME,
  ENVIRONMENT_DESCRIPTION,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  CURRENT_ENV: ENVIRONMENT
};