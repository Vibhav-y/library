# 🌍 Environment Configuration Guide

This guide explains how to switch between your local development server and your deployed Render backend.

## 🚀 Quick Setup

Your frontend is now configured to use your **Render backend** by default:
- **Production URL**: `https://library-hpen.onrender.com`
- **Development URL**: `http://localhost:5000`

## 🔄 How to Switch Environments

### Method 1: Manual Edit (Simple)
Edit `src/config/environment.js` and change the first line:

```javascript
// For Production (Render)
const ENVIRONMENT = 'production';

// For Development (Localhost)  
const ENVIRONMENT = 'development';
```

### Method 2: Quick Switcher Script (Advanced)
Use the automated switcher from the frontend directory:

```bash
# Switch to Production (Render)
cd library-frontend
node src/config/switch-environment.js production

# Switch to Development (Localhost)
cd library-frontend  
node src/config/switch-environment.js development
```

## 📡 Current Configuration

| Environment | API URL | Description |
|-------------|---------|-------------|
| **Production** | `https://library-hpen.onrender.com` | Your deployed Render backend |
| **Development** | `http://localhost:5000` | Local development server |

## 🔧 How It Works

1. **Environment Config**: `src/config/environment.js` contains both URLs
2. **API Integration**: `src/services/api.js` automatically uses the selected environment
3. **Console Logging**: Check browser console to see which environment is active

## 📋 Steps After Switching

1. **Switch Environment** (using either method above)
2. **Restart Dev Server**: `npm start` in the frontend directory
3. **Check Console**: Browser console will show active environment
4. **Test Connection**: Try logging in to verify backend connection

## 🎯 Current Status

✅ **Currently set to**: Production (Render)  
✅ **Backend URL**: `https://library-hpen.onrender.com`  
✅ **Ready to use**: Your deployed backend

## 🚨 Troubleshooting

### Backend Not Responding
- Check if your Render backend is running
- Verify the URL: `https://library-hpen.onrender.com`
- Check browser network tab for errors

### CORS Issues
- Ensure your Render backend allows requests from your frontend domain
- Check that the backend is configured for cross-origin requests

### Development Issues
- Make sure your local backend is running on port 5000
- Switch to development environment if testing locally

## 💡 Pro Tips

- Use **Production** when demonstrating or deploying
- Use **Development** when coding new features locally
- The switcher script shows current API URL for verification
- Check browser console for environment confirmation

---

**🎉 Your frontend is now connected to your Render backend!** 