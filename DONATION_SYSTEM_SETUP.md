# Donation System Setup Guide

## Overview
A complete donation system has been integrated into LibraFlow with Razorpay payment gateway support.

## Features Implemented

### Frontend
1. **Donation Banner** (`/client/src/components/DonationBanner.jsx`)
   - Animated right-to-left scrolling banner below navbar
   - Eye-catching gradient design (pink → purple → indigo)
   - Can be toggled on/off from admin panel
   - Automatically checks settings from backend
   - Close button for user convenience

2. **Donation Page** (`/client/src/pages/Donate.jsx`)
   - Beautiful UI with gradient theme matching site design
   - Currency selection (INR/USD)
   - Preset amounts or custom amount input
   - Two-step process: Amount → Details
   - Anonymous donation option
   - Message field for donors
   - Razorpay payment integration
   - Recent donations display sidebar
   - Impact section showing how donations help

3. **Admin Donations Management** (`/client/src/pages/admin/Donations.jsx`)
   - Statistics dashboard (Total INR, Total USD, Total Count)
   - Toggle donation banner on/off
   - Complete list of all donations
   - Status indicators (completed/pending/failed)
   - Donor information display
   - Date and time tracking

### Backend
1. **Models**
   - `Donation.js` - Stores donation transaction records
   - `Settings.js` - Stores admin settings (including banner toggle)

2. **Controllers** (`/server/controllers/donationController.js`)
   - `createDonationOrder` - Creates Razorpay order
   - `verifyPayment` - Verifies payment signature
   - `getAllDonations` - Admin view all donations
   - `getRecentDonations` - Public view recent donations
   - `getSettings` - Get specific settings
   - `updateSettings` - Update settings (admin only)

3. **Routes** (`/server/routes/donationRoutes.js`)
   - POST `/api/donation/create-order` (public)
   - POST `/api/donation/verify-payment` (public)
   - GET `/api/donation/recent` (public)
   - GET `/api/donation/settings` (public)
   - GET `/api/donation/all` (admin protected)
   - POST `/api/donation/settings` (admin protected)

## Razorpay Setup Instructions

### 1. Get Razorpay Credentials
1. Sign up at [https://razorpay.com/](https://razorpay.com/)
2. Complete KYC verification
3. Go to Settings → API Keys
4. Generate Test/Live Mode keys

### 2. Add Environment Variables
Add these to your `server/.env` file:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

**Important:** 
- Use Test Mode keys for development
- Switch to Live Mode keys for production
- Never commit `.env` file to version control

### 3. Currency Configuration
The system supports:
- **INR (Indian Rupee)** - Native Razorpay currency
- **USD** - Automatically converted to INR (83x multiplier)

Razorpay only accepts INR, so USD donations are converted at backend.

### 4. Testing
Test Mode Razorpay cards:
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

## How It Works

### Payment Flow
1. User selects amount and enters details on `/donate` page
2. Frontend calls `/api/donation/create-order`
3. Backend creates donation record and Razorpay order
4. Razorpay checkout modal opens
5. User completes payment
6. Payment response sent to `/api/donation/verify-payment`
7. Backend verifies signature using crypto
8. Donation status updated to "completed"
9. Success message shown to user

### Admin Controls
1. Go to `/admin/donations`
2. Toggle donation banner on/off with switch
3. View all donations with filtering
4. See statistics (total raised per currency)

## Banner Toggle Logic
- Setting key: `donation_banner_enabled`
- Values: `'true'` or `'false'` (stored as string)
- DonationBanner component checks this on mount
- Renders only if enabled and not manually closed

## Files Modified/Created

### Created Files
- `client/src/pages/Donate.jsx`
- `client/src/pages/admin/Donations.jsx`
- `client/src/components/DonationBanner.jsx`
- `server/models/Donation.js`
- `server/models/Settings.js`
- `server/controllers/donationController.js`
- `server/routes/donationRoutes.js`

### Modified Files
- `client/src/App.jsx` - Added routes and DonationBanner
- `client/src/components/admin/Sidebar.jsx` - Added Donations link
- `server/server.js` - Added donation routes

## Security Features
- Admin routes protected with `adminAuth` middleware
- Payment signature verification using HMAC SHA256
- Razorpay order validation
- Input sanitization and validation

## Next Steps
1. Add your Razorpay credentials to `.env`
2. Test with Razorpay Test Mode
3. Enable donation banner from admin panel
4. Test complete donation flow
5. Switch to Live Mode for production

## Support
For issues with:
- Razorpay integration: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- Payment gateway: Contact Razorpay support

## Notes
- Minimum donation amount: ₹1 / $1
- All amounts stored as integers (no decimals)
- Recent donations show last 10 public donations
- Anonymous donations hide donor name in public view
- Email receipts should be configured in Razorpay dashboard
