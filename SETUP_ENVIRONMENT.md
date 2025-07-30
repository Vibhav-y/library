# Environment Setup Guide

## 🚨 Fix Supabase Error

The error `Error: supabaseKey is required.` occurs because the environment variables are not set. Follow these steps:

### 1. Create `.env` file in `library-backend` directory

Create a file named `.env` in the `library-backend` folder with this content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/library

# JWT Configuration
JWT_SECRET=myLibraryApp2024SecretKey123!@#

# Server Configuration
PORT=5000

# Supabase Configuration (for JavaScript client)
SUPABASE_URL=https://whxqigaladikvofocwpu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeHFpZ2FsYWRpa3ZvZm9jd3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkxMjE2MDAsImV4cCI6MjAyNDY5NzYwMH0.yzOah6fzG5nTGTJh2rODdXsY8J_4KOnGzA5D0hjdO7k

# Supabase S3-Compatible Configuration (if needed for other integrations)
SUPABASE_ENDPOINT=https://whxqigaladikvofocwpu.supabase.co/storage/v1/s3
SUPABASE_REGION=ap-south-1
SUPABASE_ACCESS_KEY_ID=4432b0150fda124f5f5376738994a3b7
SUPABASE_SECRET_ACCESS_KEY=88582ed453b17549f3f24bb0ca4f57f126dc0e2378ef507952eca787d87feaf5
```

### 2. Restart the server

```bash
cd library-backend
npm start
```

## ✅ What This Fixes

1. **Dashboard Counts**: Categories and Students counts will now display properly
2. **Supabase Integration**: File uploads and storage will work correctly
3. **Notice Targeting**: Notice targeting to specific users will work properly
4. **Default Priority**: New notices will have priority 10 by default

## 🔧 Changes Made

### Notice System Fixed:
- ✅ Fixed MongoDB query structure for proper user targeting
- ✅ Set default notice priority to 10 instead of 0
- ✅ Notices now correctly display only to targeted users

### Dashboard Fixed:
- ✅ Dashboard now fetches actual category and student counts
- ✅ Uses proper dashboard API endpoint
- ✅ Displays real statistics instead of "---"

### Environment Configuration:
- ✅ All required Supabase environment variables
- ✅ MongoDB connection string
- ✅ JWT secret for authentication
- ✅ Server port configuration

## 📱 Expected Results

After setting up the `.env` file:
- Dashboard will show actual numbers for Categories and Students
- Notices will only appear for targeted users
- File uploads will work properly
- No more Supabase key errors 