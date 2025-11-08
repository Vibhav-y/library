# Pre-Deployment Checklist

## ✅ Completed Fixes

### 1. CORS Configuration
- ✅ Configured CORS to accept `CLIENT_URL` environment variable
- ✅ Added fallback for development (allows all origins)
- ✅ Enabled credentials support

### 2. Error Handling
- ✅ Added error handling middleware
- ✅ Added 404 handler for unknown routes
- ✅ Improved error logging

### 3. Environment Variables
- ✅ Fixed BASE_URL usage in blog controller
- ✅ Added fallback URL construction from request headers
- ✅ Client now handles missing VITE_BASE_URL gracefully

### 4. Database Configuration
- ✅ Added MongoDB connection error handlers
- ✅ Added connection timeout (5s)
- ✅ Improved connection logging

### 5. Health Check
- ✅ Added `/health` endpoint for monitoring
- ✅ Returns server status and timestamp

### 6. Build Configuration
- ✅ Added Node.js version requirements (>=18.0.0)
- ✅ Optimized Vite build configuration
- ✅ Added code splitting for better performance

### 7. Deployment Files
- ✅ Created `render.yaml` for Render deployment
- ✅ Created `client/vercel.json` for Vercel deployment
- ✅ Created `.gitignore` to protect sensitive files
- ✅ Created `DEPLOYMENT.md` with detailed instructions

## 📋 Pre-Deployment Steps

### Backend (Render)

1. **Set Environment Variables in Render Dashboard:**
   - [ ] `MONGODB_URI` - Your MongoDB connection string
   - [ ] `JWT_SECRET` - Strong random string (use: `openssl rand -base64 32`)
   - [ ] `ADMIN_EMAIL` - Admin login email
   - [ ] `ADMIN_PASSWORD` - Strong admin password
   - [ ] `BASE_URL` - Your Render backend URL (e.g., `https://your-api.onrender.com`)
   - [ ] `CLIENT_URL` - Your Vercel frontend URL (set after frontend deployment)
   - [ ] `IMAGEKIT_PUBLIC_KEY` - (Optional) ImageKit public key
   - [ ] `IMAGEKIT_PRIVATE_KEY` - (Optional) ImageKit private key
   - [ ] `IMAGEKIT_URL_ENDPOINT` - (Optional) ImageKit URL endpoint
   - [ ] `GEMINI_API_KEY` - (Optional) Gemini API key for chat
   - [ ] `GEMINI_API_URL` - (Optional) Gemini API URL

2. **Deploy to Render:**
   - [ ] Connect GitHub repository
   - [ ] Select "Web Service"
   - [ ] Set build command: `cd server && npm install`
   - [ ] Set start command: `cd server && npm start`
   - [ ] Deploy and wait for successful deployment
   - [ ] Copy the service URL

### Frontend (Vercel)

1. **Set Environment Variables in Vercel Dashboard:**
   - [ ] `VITE_BASE_URL` - Your Render backend URL (e.g., `https://your-api.onrender.com`)

2. **Deploy to Vercel:**
   - [ ] Import GitHub repository
   - [ ] Set root directory: `client`
   - [ ] Set build command: `npm run build`
   - [ ] Set output directory: `dist`
   - [ ] Deploy and wait for successful deployment
   - [ ] Copy the deployment URL

3. **Update Backend:**
   - [ ] Update `CLIENT_URL` in Render with your Vercel URL

## 🧪 Testing Checklist

### Backend Tests
- [ ] Health check: `GET https://your-api.onrender.com/health`
- [ ] API root: `GET https://your-api.onrender.com/`
- [ ] User registration: `POST https://your-api.onrender.com/api/user/register`
- [ ] User login: `POST https://your-api.onrender.com/api/user/login`
- [ ] Admin login: `POST https://your-api.onrender.com/api/admin/login`
- [ ] Get blogs: `GET https://your-api.onrender.com/api/blog/all`

### Frontend Tests
- [ ] Home page loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] Blog list displays
- [ ] Blog details page works
- [ ] Comments can be added
- [ ] Image upload works (if ImageKit configured)
- [ ] Chat widget works (if Gemini API configured)

### Integration Tests
- [ ] Frontend can connect to backend API
- [ ] CORS is working correctly
- [ ] Authentication tokens are stored and sent correctly
- [ ] Images are uploaded and displayed correctly
- [ ] All API endpoints are accessible from frontend

## 🔒 Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] `JWT_SECRET` is strong and unique
- [ ] Admin credentials are strong
- [ ] MongoDB connection string doesn't expose credentials in logs
- [ ] CORS is configured to only allow your frontend domain
- [ ] HTTPS is enabled (automatic on Vercel/Render)

## 🐛 Common Issues & Solutions

### Backend Issues

1. **Database Connection Failed**
   - Verify MongoDB Atlas network access allows all IPs (0.0.0.0/0)
   - Check MongoDB connection string format
   - Verify database user has correct permissions

2. **Port Issues**
   - Render sets PORT automatically - don't hardcode it
   - Server should use `process.env.PORT || 3000`

3. **CORS Errors**
   - Verify `CLIENT_URL` is set correctly
   - Check that frontend URL matches exactly (including https://)
   - Verify CORS middleware is configured correctly

### Frontend Issues

1. **API Connection Failed**
   - Verify `VITE_BASE_URL` is set correctly
   - Check browser console for CORS errors
   - Verify backend is running and accessible
   - Test backend health endpoint directly

2. **Build Errors**
   - Check Node.js version (requires >=18.0.0)
   - Verify all dependencies are in package.json
   - Check for TypeScript/ESLint errors
   - Review build logs in Vercel dashboard

3. **Environment Variables Not Working**
   - Vite requires `VITE_` prefix for environment variables
   - Rebuild after changing environment variables
   - Check that variables are set in Vercel dashboard

## 📊 Monitoring

### Backend (Render)
- Monitor logs in Render dashboard
- Check health endpoint regularly
- Monitor database connections
- Watch for error rates

### Frontend (Vercel)
- Monitor build logs
- Check browser console for errors
- Monitor API response times
- Track error rates

### Database (MongoDB Atlas)
- Monitor connection count
- Check database size
- Monitor query performance
- Set up alerts for high usage

## 🚀 Post-Deployment

- [ ] Test all major features
- [ ] Verify images are uploading correctly
- [ ] Check that admin panel works
- [ ] Test user registration and login
- [ ] Verify comments are working
- [ ] Test chat functionality (if enabled)
- [ ] Monitor logs for errors
- [ ] Set up monitoring alerts
- [ ] Document any custom configurations

## 📝 Notes

- Render free tier may spin down after inactivity
- First request after spin-down may be slow
- Consider upgrading to paid plan for production
- ImageKit is recommended for image storage (local storage on Render is ephemeral)
- MongoDB Atlas free tier is suitable for development
- Consider setting up database backups

