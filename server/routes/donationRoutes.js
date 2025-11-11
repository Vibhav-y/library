import express from 'express'
import {
    createDonationOrder,
    verifyPayment,
    getAllDonations,
    getRecentDonations,
    getSettings,
    updateSettings
} from '../controllers/donationController.js'
import adminAuth from '../middleware/adminAuth.js'

const donationRouter = express.Router()

// Public routes
donationRouter.post('/create-order', createDonationOrder)
donationRouter.post('/verify-payment', verifyPayment)
donationRouter.get('/recent', getRecentDonations)
donationRouter.get('/settings', getSettings)

// Admin routes
donationRouter.get('/all', adminAuth, getAllDonations)
donationRouter.post('/settings', adminAuth, updateSettings)

export default donationRouter
