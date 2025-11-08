# Deployment Guide

This guide covers deploying the blog application to Vercel (frontend) and Render (backend).

## Architecture

- **Frontend**: React + Vite application (deploy to Vercel)
- **Backend**: Node.js + Express API server (deploy to Render)
- **Database**: MongoDB (MongoDB Atlas recommended)
- **File Storage**: ImageKit (optional, falls back to local storage)

## Prerequisites

1. MongoDB database (MongoDB Atlas recommended)
2. ImageKit account (optional, for image hosting)
3. Gemini API key (optional, for chat functionality)
4. Vercel account (for frontend)
5. Render account (for backend)

## Environment Variables

### Backend (Render)

Create the following environment variables in your Render service:

#### Required:
- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/quickblog`)
- `JWT_SECRET` - Secret key for JWT token signing (use a strong random string)
- `ADMIN_EMAIL` - Admin login email
- `ADMIN_PASSWORD` - Admin login password
- `BASE_URL` - Your backend server URL (e.g., `https://your-api.onrender.com`)
- `CLIENT_URL` - Your frontend URL (e.g., `https://your-app.vercel.app`)

#### Optional:
- `IMAGEKIT_PUBLIC_KEY` - ImageKit public key
- `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
- `IMAGEKIT_URL_ENDPOINT` - ImageKit URL endpoint
- `GEMINI_API_KEY` - Google Gemini API key for chat functionality
- `GEMINI_API_URL` - Gemini API URL (defaults to v1/models/gemini-2.5-flash:generateContent)
- `PORT` - Server port (defaults to 3000, Render sets this automatically)

### Frontend (Vercel)

Create the following environment variable in your Vercel project:

#### Required:
- `VITE_BASE_URL` - Your backend API URL (e.g., `https://your-api.onrender.com`)

## Deployment Steps

### 1. Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: blog-api-server
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free (or paid for better performance)
5. Add all environment variables listed above
6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy the service URL (e.g., `https://your-api.onrender.com`)

### 2. Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   - `VITE_BASE_URL`: Your Render backend URL
6. Click "Deploy"
7. Wait for deployment to complete
8. Copy the deployment URL (e.g., `https://your-app.vercel.app`)

### 3. Update Backend Environment Variables

After deploying the frontend, update the backend `CLIENT_URL` environment variable in Render:
- `CLIENT_URL`: Your Vercel frontend URL

### 4. Verify Deployment

1. Visit your frontend URL
2. Check the browser console for any errors
3. Test the API health endpoint: `https://your-api.onrender.com/health`
4. Test user registration and login
5. Test admin login at `/admin`

## Troubleshooting

### Backend Issues

1. **Database Connection Failed**
   - Verify `MONGODB_URI` is correct
   - Check MongoDB Atlas network access (allow all IPs or add Render IPs)
   - Verify database user permissions

2. **Port Issues**
   - Render automatically sets `PORT` environment variable
   - Ensure your server listens on `process.env.PORT`

3. **CORS Errors**
   - Verify `CLIENT_URL` is set correctly in backend
   - Check that frontend `VITE_BASE_URL` points to backend

4. **Image Upload Issues**
   - If ImageKit is not configured, images will be stored locally on Render
   - Note: Local storage on Render is ephemeral and will be lost on restart
   - Recommended: Use ImageKit for production

### Frontend Issues

1. **API Connection Failed**
   - Verify `VITE_BASE_URL` is set correctly
   - Check browser console for CORS errors
   - Verify backend is running and accessible

2. **Build Errors**
   - Check Node.js version (requires >=18.0.0)
   - Verify all dependencies are installed
   - Check for TypeScript/ESLint errors

3. **Routing Issues**
   - Vercel should handle client-side routing automatically
   - If 404 errors occur, verify `vercel.json` configuration

## Production Checklist

- [ ] All environment variables are set
- [ ] MongoDB database is accessible
- [ ] CORS is configured correctly
- [ ] ImageKit is configured (recommended)
- [ ] Admin credentials are secure
- [ ] JWT_SECRET is strong and unique
- [ ] Frontend and backend URLs are correct
- [ ] Health check endpoint is working
- [ ] Error handling is in place
- [ ] Logs are being monitored

## Security Notes

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Use strong JWT_SECRET** - Generate using: `openssl rand -base64 32`
3. **Secure Admin Credentials** - Use strong passwords
4. **Enable MongoDB Authentication** - Use strong database passwords
5. **Configure CORS Properly** - Only allow your frontend domain
6. **Use HTTPS** - Vercel and Render provide HTTPS by default
7. **Rate Limiting** - Consider adding rate limiting for production
8. **Input Validation** - Validate all user inputs on the backend

## Monitoring

- **Render**: Check logs in Render dashboard
- **Vercel**: Check logs in Vercel dashboard
- **MongoDB**: Monitor database performance in Atlas dashboard
- **ImageKit**: Monitor storage and bandwidth usage

## Support

For issues or questions:
1. Check the logs in Render/Vercel dashboards
2. Verify environment variables are set correctly
3. Test API endpoints directly using curl or Postman
4. Check MongoDB connection and database state

