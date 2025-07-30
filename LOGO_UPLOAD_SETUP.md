# 🖼️ Logo Upload Setup Guide

Your logo upload system now supports **both local storage and Supabase cloud storage**. The system automatically detects which option to use based on your configuration.

## 🚀 Quick Start (Local Storage)

**Current Status:** ✅ **Ready to use immediately!**

The system will automatically use **local base64 storage** for logo uploads. No additional setup required.

### How it works:
- Logos are converted to **base64 format**
- Stored directly in **MongoDB database**
- No external dependencies needed
- Perfect for **local development and testing**

## ☁️ Optional: Supabase Cloud Storage Setup

If you want to use **cloud storage** for logos (recommended for production), follow these steps:

### 1. Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### 2. Get Your Credentials
From your Supabase dashboard:
- **Project URL:** `https://your-project-id.supabase.co`
- **Anon Key:** Found in Settings > API

### 3. Create Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named **`documents`**
3. Make it **public** if you want direct access to logos

### 4. Set Environment Variables
Create/update your `.env` file in `library-backend/`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Other existing variables...
MONGODB_URI=mongodb://localhost:27017/library
JWT_SECRET=your-jwt-secret
```

### 5. Restart Backend
```bash
cd library-backend
npm start
```

## 🔄 How the System Chooses Storage

The system **automatically detects** which storage to use:

```
✅ Supabase keys configured → Uses cloud storage
❌ No Supabase keys → Uses local base64 storage
```

## 🧪 Testing Logo Upload

1. **Login** as admin: `admin@library.com` / `admin123`
2. Go to **Customization** page
3. **Upload a logo** image (PNG, JPG, etc.)
4. Check the console logs to see which storage method was used:
   - `✅ Logo uploaded to Supabase` = Cloud storage
   - `📁 Logo stored as base64 (local storage)` = Local storage

## 📝 Storage Comparison

| Feature | Local Storage | Supabase Storage |
|---------|---------------|------------------|
| **Setup** | ✅ None required | ⚙️ Account + config needed |
| **Speed** | ⚡ Very fast | 🌐 Network dependent |
| **Size Limit** | 📊 MongoDB limit (~16MB) | ☁️ Much larger files |
| **Scalability** | 📈 Limited | 🚀 Unlimited |
| **Best For** | 🧪 Development/Testing | 🏢 Production |

## 🔧 Current Status

Your system is **ready to use** with local storage! 

- ✅ **Upload logos** immediately
- ✅ **No configuration** needed
- ✅ **Perfect for testing**

Want cloud storage? Just add the Supabase credentials later and it will automatically switch!

## 🐛 Troubleshooting

### "Signature verification failed"
- **Cause:** Supabase keys are incorrect or missing
- **Solution:** The system now falls back to local storage automatically

### Logo not showing
- Check browser console for errors
- Verify admin permissions
- Try a smaller image file (< 5MB)

### Need help?
- Check the backend console logs for detailed error messages
- Make sure you're logged in as an admin user