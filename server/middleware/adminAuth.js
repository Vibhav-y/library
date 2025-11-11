import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Admin-only middleware: verifies token and ensures the user has admin role
const adminAuth = async (req, res, next) => {
    const raw = req.headers.authorization || req.headers.Authorization
    if (!raw) return res.status(401).json({ success: false, message: 'No token provided' })

    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        
        // Fetch user from database to verify current role
        const user = await User.findOne({ email: decoded.email }).select('-password')
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' })
        }
        
        // Check if user has admin role
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' })
        }
        
        req.user = { ...decoded, userId: user._id }
        next()
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid Token' })
    }
}

export default adminAuth
