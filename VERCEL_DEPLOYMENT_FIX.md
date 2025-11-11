# Vercel Deployment Fix

## Issue
Vercel is trying to use `react-scripts build` (Create React App) instead of Vite.

## Solution

### Option 1: Update Vercel Project Settings (Recommended)

1. Go to your Vercel project settings
2. Navigate to **Settings** → **General**
3. Under **Build & Development Settings**:
   - **Framework Preset**: Select `Vite` or `Other`
   - **Build Command**: `npm run build` (or leave empty to use package.json)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (or leave empty)
   - **Root Directory**: `client`

### Option 2: Use vercel.json (Already Updated)

The `client/vercel.json` file has been updated with the correct build settings:
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: `vite`

### Option 3: Manual Override in Vercel Dashboard

If the above doesn't work:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Scroll to **Build & Development Settings**
5. Override the following:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: (leave empty or use `npm install`)
   - **Root Directory**: `client`

## Verification

After updating settings:
1. Trigger a new deployment
2. Check the build logs - you should see:
   - `vite build` instead of `react-scripts build`
   - Build output in `dist` directory
   - No errors about `react-scripts`

## Common Issues

### Issue: "Command not found: react-scripts"
**Solution**: Make sure Framework Preset is set to `Vite` or `Other`, not `Create React App`

### Issue: "Cannot find module 'vite'"
**Solution**: 
1. Ensure `package.json` has `vite` in dependencies
2. Make sure install command runs: `npm install`
3. Check that root directory is set to `client`

### Issue: Build succeeds but site shows 404
**Solution**: 
1. Verify Output Directory is `dist`
2. Check that `vercel.json` has the rewrite rule for SPA routing
3. Ensure `index.html` exists in the `dist` folder

## Quick Fix Checklist

- [ ] Framework Preset: `Vite` or `Other`
- [ ] Build Command: `npm run build` (runs `vite build`)
- [ ] Output Directory: `dist`
- [ ] Root Directory: `client`
- [ ] `vercel.json` is in the `client` folder
- [ ] Environment variable `VITE_BASE_URL` is set

## Next Steps

1. Update Vercel project settings as described above
2. Redeploy the project
3. Verify the build logs show Vite commands
4. Test the deployed site

If issues persist, check the build logs in Vercel dashboard for specific errors.




