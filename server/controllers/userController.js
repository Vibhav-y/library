
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Blog from '../models/Blog.js'
import Comment from '../models/Comment.js'

// Register a new public user: requires username, email, password, fullName, and optional phone, bio
export const register = async (req, res) => {
    try {
        const { username, email, password, fullName, phone, bio } = req.body
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ success: false, message: 'username, email, password, and fullName are required' })
        }

        const existingEmail = await User.findOne({ email })
        if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered' })

        const existingUsername = await User.findOne({ username })
        if (existingUsername) return res.status(400).json({ success: false, message: 'Username already taken' })

        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({ username, email, password: hashed, fullName, phone, bio })

        const token = jwt.sign({ email: user.email, name: user.username, role: user.role }, process.env.JWT_SECRET)
        res.json({ success: true, token })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Check if username is available
export const checkUsername = async (req, res) => {
    try {
        const { username } = req.query
        if (!username) return res.json({ available: false, message: 'Username is required' })
        
        const existing = await User.findOne({ username })
        res.json({ available: !existing })
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

// Get user profile
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).select('-password')
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })
        res.json({ success: true, user })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Update user profile (fullName, phone, bio, alternateEmail)
export const updateProfile = async (req, res) => {
    try {
        const { fullName, phone, bio, alternateEmail } = req.body
        const user = await User.findOne({ email: req.user.email })
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        if (fullName) user.fullName = fullName
        if (phone !== undefined) user.phone = phone
        if (bio !== undefined) user.bio = bio
        if (alternateEmail !== undefined) user.alternateEmail = alternateEmail

        await user.save()
        const updatedUser = await User.findOne({ email: req.user.email }).select('-password')
        res.json({ success: true, message: 'Profile updated successfully', user: updatedUser })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required' })
        }

        const user = await User.findOne({ email: req.user.email })
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' })

        const hashed = await bcrypt.hash(newPassword, 10)
        user.password = hashed
        await user.save()

        res.json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get user's blogs
export const getUserBlogs = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email })
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        // Query by author ID (preferred) or fall back to email for legacy blogs
        const blogs = await Blog.find({ 
            $or: [
                { author: user._id },
                { authorEmail: user.email }
            ]
        }).sort({ createdAt: -1 })
        
        res.json({ success: true, blogs })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Delete user's own blog
export const deleteOwnBlog = async (req, res) => {
    try {
        const { blogId } = req.body
        const user = await User.findOne({ email: req.user.email })
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        const blog = await Blog.findById(blogId)
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' })

        // Check if user owns this blog (by ID or email)
        const isOwner = (blog.author && blog.author.toString() === user._id.toString()) || blog.authorEmail === user.email
        if (!isOwner) {
            return res.status(403).json({ success: false, message: 'You can only delete your own blogs' })
        }

        await Blog.findByIdAndDelete(blogId)
        await Comment.deleteMany({ blog: blogId })

        res.json({ success: true, message: 'Blog deleted successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const { email, confirmation } = req.body
        
        if (email !== req.user.email) {
            return res.status(400).json({ success: false, message: 'Email does not match your account' })
        }

        if (confirmation !== `yes delete my account with ${email}`) {
            return res.status(400).json({ success: false, message: 'Confirmation text is incorrect' })
        }

        const user = await User.findOne({ email: req.user.email })
        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        // Delete all user's blogs (by ID and email for legacy)
        await Blog.deleteMany({ 
            $or: [
                { author: user._id },
                { authorEmail: user.email }
            ]
        })
        
        // Delete all user's comments
        await Comment.deleteMany({ realName: user.username })

        // Delete user account
        await User.findByIdAndDelete(user._id)

        res.json({ success: true, message: 'Account deleted successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}
