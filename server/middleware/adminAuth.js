import jwt from 'jsonwebtoken'

// Admin-only middleware: verifies token and ensures the token belongs to admin
const adminAuth = (req, res, next) => {
    const raw = req.headers.authorization || req.headers.Authorization
    if (!raw) return res.status(401).json({ success: false, message: 'No token provided' })

    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // Admin identification: either explicit role or matching admin email
        if (decoded.role === 'admin' || decoded.email === process.env.ADMIN_EMAIL) {
            req.user = decoded
            return next()
        }
        return res.status(403).json({ success: false, message: 'Admin access required' })
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid Token' })
    }
}

export default adminAuth
