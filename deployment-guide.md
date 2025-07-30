# Library Management System - Deployment Guide

## 🚀 Deployment Architecture

**Frontend (React)**: Vercel
**Backend (Node.js/Express)**: Railway
**Database**: MongoDB Atlas (Cloud)

## 📋 Prerequisites

1. GitHub account
2. Vercel account (free)
3. Railway account (free)
4. MongoDB Atlas account (free)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create a new cluster (choose free tier)
4. Wait for cluster to be created (2-3 minutes)

### 1.2 Configure Database Access
1. Go to "Database Access" in sidebar
2. Click "Add New Database User"
3. Create username/password (save these!)
4. Set privileges to "Read and write to any database"

### 1.3 Configure Network Access
1. Go to "Network Access" in sidebar
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0)
4. Confirm

### 1.4 Get Connection String
1. Go to "Clusters"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password



---

## 🖥️ Step 2: Prepare Your Code for Deployment

### 2.1 Update Backend Environment Variables
Create `library-backend/.env.production`:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

### 2.2 Update Frontend API Configuration
Update `library-frontend/src/services/api.js`:

```javascript
// Replace the baseURL with your Railway backend URL (you'll get this after deployment)
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-app.railway.app/api'
  : 'http://localhost:5000/api';
```

### 2.3 Add Build Scripts
Ensure your `library-backend/package.json` has:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "npm install"
  }
}
```

### 2.4 Create Railway Configuration
Create `library-backend/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🚂 Step 3: Deploy Backend to Railway

### 3.1 Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

### 3.2 Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Select the `library-backend` folder
5. Railway will automatically detect it's a Node.js app

### 3.3 Configure Environment Variables
1. Go to your project dashboard
2. Click on the service
3. Go to "Variables" tab
4. Add these variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret key

### 3.4 Enable Public Domain
1. Go to "Settings" tab
2. Click "Generate Domain"
3. Copy the domain URL (e.g., `https://your-app.railway.app`)

---

## ⚡ Step 4: Deploy Frontend to Vercel

### 4.1 Update Frontend Configuration
Update `library-frontend/src/services/api.js` with your Railway backend URL:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-app.railway.app/api'  // Replace with your Railway URL
  : 'http://localhost:5000/api';
```

### 4.2 Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Connect your GitHub account

### 4.3 Deploy Frontend
1. Click "New Project"
2. Import your GitHub repository
3. Vercel will detect it's a React app
4. Set the root directory to `library-frontend`
5. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### 4.4 Environment Variables (if needed)
1. Go to project settings
2. Add environment variables if you have any

---

## 🔧 Step 5: Configure CORS for Production

Update `library-backend/server.js` to allow your Vercel domain:

```javascript
// Update CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-app.vercel.app'  // Add your Vercel URL
  ],
  credentials: true
}));
```

---

## 🧪 Step 6: Test Your Deployment

### 6.1 Test Backend
1. Visit your Railway URL: `https://your-backend-app.railway.app/api/test`
2. Should return a JSON response

### 6.2 Test Frontend
1. Visit your Vercel URL: `https://your-frontend-app.vercel.app`
2. Try logging in and using all features

### 6.3 Test Full Integration
1. Create a new user account
2. Upload a document
3. Create a notice
4. Verify all features work

---

## 🔄 Step 7: Setup Automatic Deployments

### 7.1 Railway Auto-Deploy
- Railway automatically deploys when you push to your main branch
- Monitor deployments in the Railway dashboard

### 7.2 Vercel Auto-Deploy
- Vercel automatically deploys when you push to your main branch
- Preview deployments for pull requests

---

## 🛠️ Alternative Hosting Options

### Option A: Heroku (Full-stack)
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Deploy
git push heroku main
```

### Option B: DigitalOcean App Platform
1. Create DigitalOcean account
2. Use App Platform
3. Connect GitHub repository
4. Configure build settings

### Option C: AWS (Advanced)
- Use AWS Amplify for frontend
- Use AWS Lambda + API Gateway for backend
- Use MongoDB Atlas or AWS DocumentDB

---

## 📊 Cost Breakdown

### Free Tier Limits:
- **Vercel**: 100GB bandwidth, unlimited projects
- **Railway**: $5 credit monthly (usually enough for small apps)
- **MongoDB Atlas**: 512MB storage, shared clusters
- **Total Monthly Cost**: $0-5 (depending on usage)

### Paid Tier Benefits:
- **Vercel Pro**: $20/month - More bandwidth, analytics
- **Railway**: Pay-as-you-go after free credit
- **MongoDB Atlas**: $9/month - Dedicated clusters, more storage

---

## 🚨 Important Notes

### Security Checklist:
- [ ] Use strong JWT secrets
- [ ] Enable MongoDB IP whitelist
- [ ] Use HTTPS only in production
- [ ] Validate all user inputs
- [ ] Set up proper error handling

### Performance Tips:
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Optimize images
- [ ] Implement caching strategies

### Monitoring:
- [ ] Set up error tracking (Sentry)
- [ ] Monitor database performance
- [ ] Set up uptime monitoring
- [ ] Configure backup strategies

---

## 📞 Need Help?

If you encounter issues:
1. Check Railway/Vercel logs
2. Verify environment variables
3. Test API endpoints individually
4. Check MongoDB Atlas connection
5. Review CORS configuration

## 🎉 Congratulations!

Your Library Management System is now live and accessible worldwide! 🌍 
