
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

// Register a new public user: requires username, email, password
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body
        if (!username || !email || !password) return res.status(400).json({ success: false, message: 'username, email and password are required' })

        const existing = await User.findOne({ email })
        if (existing) return res.status(400).json({ success: false, message: 'Email already registered' })

        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({ username, email, password: hashed })

        const token = jwt.sign({ email: user.email, name: user.username, role: user.role }, process.env.JWT_SECRET)
        res.json({ success: true, token })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Login existing public user: email + password
export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(400).json({ success: false, message: 'email and password are required' })

        const user = await User.findOne({ email })
        if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' })

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return res.status(400).json({ success: false, message: 'Invalid credentials' })

        const token = jwt.sign({ email: user.email, name: user.username, role: user.role }, process.env.JWT_SECRET)
        res.json({ success: true, token })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}
