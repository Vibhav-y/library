import Razorpay from 'razorpay'
import crypto from 'crypto'
import Donation from '../models/Donation.js'
import Settings from '../models/Settings.js'

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

// Create donation order
export const createDonationOrder = async (req, res) => {
    try {
        const { amount, currency, name, email, message, isAnonymous } = req.body

        if (!amount || amount < 1) {
            return res.status(400).json({ success: false, message: 'Invalid amount' })
        }

        // Create Razorpay order
        const options = {
            amount: currency === 'USD' ? Math.round(amount * 83 * 100) : amount * 100, // Convert to paise, USD to INR conversion
            currency: 'INR', // Razorpay primarily works with INR
            receipt: `donation_${Date.now()}`
        }

        const order = await razorpay.orders.create(options)

        // Save donation record
        const donation = await Donation.create({
            name: isAnonymous ? 'Anonymous' : name,
            email,
            amount: currency === 'USD' ? amount : amount,
            currency,
            message,
            razorpayOrderId: order.id,
            status: 'pending',
            isAnonymous
        })

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            donationId: donation._id
        })
    } catch (error) {
        console.error('Create donation order error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// Verify payment
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = req.body

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex')

        if (razorpay_signature === expectedSign) {
            // Update donation status
            const donation = await Donation.findByIdAndUpdate(
                donationId,
                {
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    status: 'completed'
                },
                { new: true }
            )

            return res.json({ success: true, message: 'Payment verified successfully', donation })
        } else {
            await Donation.findByIdAndUpdate(donationId, { status: 'failed' })
            return res.status(400).json({ success: false, message: 'Payment verification failed' })
        }
    } catch (error) {
        console.error('Verify payment error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get all donations (admin only)
export const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find().sort({ createdAt: -1 })
        const total = await Donation.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$currency', total: { $sum: '$amount' } } }
        ])
        res.json({ success: true, donations, totals: total })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get recent donations (public)
export const getRecentDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ status: 'completed' })
            .select('name amount currency message createdAt isAnonymous')
            .sort({ createdAt: -1 })
            .limit(10)
        res.json({ success: true, donations })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Settings management
export const getSettings = async (req, res) => {
    try {
        const { key } = req.query
        if (key) {
            const setting = await Settings.findOne({ key })
            return res.json({ 
                success: true, 
                setting: setting || null,
                value: setting ? setting.value : null 
            })
        }
        const settings = await Settings.find()
        res.json({ success: true, settings })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

export const updateSettings = async (req, res) => {
    try {
        const { key, value, description } = req.body
        const setting = await Settings.findOneAndUpdate(
            { key },
            { value, description },
            { upsert: true, new: true }
        )
        res.json({ success: true, setting })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Delete donation (admin only)
export const deleteDonation = async (req, res) => {
    try {
        const { id } = req.body

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Donation ID is required' 
            })
        }

        const donation = await Donation.findByIdAndDelete(id)

        if (!donation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Donation not found' 
            })
        }

        res.json({ 
            success: true, 
            message: 'Donation deleted successfully' 
        })
    } catch (error) {
        console.error('Delete donation error:', error)
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete donation' 
        })
    }
}
