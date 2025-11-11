/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Blog from '../models/Blog.js'
import Comment from '../models/Comment.js'
import Chat from '../models/Chat.js'
import User from '../models/User.js'

export const adminLogin = async (req, res) => {
    try {
        const {email, password} = req.body

        if (!email || !password) {
            return res.json({success: false, message: "Email and password are required"})
        }

        // Find user in database
        const user = await User.findOne({ email })
        if (!user) {
            return res.json({success: false, message: "Invalid Credentials"})
        }

        // Check if user has admin role
        if (user.role !== 'admin') {
            return res.json({success: false, message: "Admin access required"})
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({success: false, message: "Invalid Credentials"})
        }

        // Issue token with admin role
        const token = jwt.sign({email: user.email, name: user.username, role: user.role}, process.env.JWT_SECRET)
        res.json({success: true, token, user: { username: user.username, email: user.email, fullName: user.fullName }})
    } catch(error) {
        res.json({success: false, message: error.message})
    }
} 

export const getAllBlogsAdmin = async (req, res) => {
    try {
        // sort by createdAt and populate author
        const blogs = await Blog.find({}).populate('author', 'username fullName').sort({createdAt: -1})
        
        // Add username field for frontend compatibility
        const blogsWithUsername = blogs.map(blog => {
            const blogObj = blog.toObject()
            blogObj.username = blog.author?.username || blog.authorName || 'Unknown'
            return blogObj
        })
        
        res.json({success: true, blogs: blogsWithUsername})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find({})
            .populate("blog")
            .populate({
                path: 'parent',
                select: 'realName displayName name content' // Get parent comment's name and content
            })
            .sort({createdAt: -1})
            .lean()

        // Add parent info and send flat array (client will handle threading)
        const processedComments = comments.map(c => {
            if (c.parent) {
                c.parentName = c.parent.realName || c.parent.name || 'Unknown'
                c.parentDisplayName = c.parent.displayName || c.parentName
                // Add short preview of parent content
                c.parentContent = c.parent.content?.length > 30 
                    ? c.parent.content.substring(0, 30) + '...'
                    : c.parent.content
            }
            return c
        })

        res.json({success: true, comments: processedComments})
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

export const getDashboard = async (req, res) => {
    try {
        const recentBlogs = await Blog.find({}).populate('author', 'username fullName').sort({createdAt: -1}).limit(5)
        const blogs = await Blog.countDocuments()
        const comments = await Comment.countDocuments()
        const drafts = await Blog.countDocuments({isPublished: false})
        
        // Add username field for frontend compatibility
        const blogsWithUsername = recentBlogs.map(blog => {
            const blogObj = blog.toObject()
            blogObj.username = blog.author?.username || blog.authorName || 'Unknown'
            return blogObj
        })
        
        const dashboardData = {
            blogs, comments, drafts, recentBlogs: blogsWithUsername
        }
        res.json({success: true, dashboardData})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const deleteCommentById = async (req, res) => {
    try {
        const {id} = req.body
        await Comment.findByIdAndDelete(id)
        res.json({success: true, message: "Comment deleted successfully"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const deleteCommentsByIds = async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.json({success: false, message: 'No ids provided'})
        const result = await Comment.deleteMany({_id: { $in: ids }})
        res.json({success: true, message: `Deleted ${result.deletedCount} comments`})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const getAllChats = async (req, res) => {
    try {
        const chats = await Chat.find({}).populate('blog').sort({createdAt: -1}).lean()
        res.json({ success: true, chats })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const deleteChatById = async (req, res) => {
    try {
        const { id } = req.body
        await Chat.findByIdAndDelete(id)
        res.json({ success: true, message: 'Chat deleted' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const approveCommentById = async (req, res) => {
    try {
        const {id} = req.body
        await Comment.findByIdAndUpdate(id, {isApproved: true})
        res.json({success: true, message: "Comment approved successfully"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const unflagCommentById = async (req, res) => {
    try {
        const { id } = req.body
        await Comment.findByIdAndUpdate(id, { isFlagged: false, flagReason: '' })
        res.json({ success: true, message: 'Comment unflagged' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const toggleCommentApprovalById = async (req, res) => {
    try {
        const { id } = req.params
        const comment = await Comment.findById(id)
        if (!comment) return res.json({ success: false, message: 'Comment not found' })
        comment.isApproved = !comment.isApproved
        await comment.save()
        res.json({ success: true, message: `Comment ${comment.isApproved ? 'approved' : 'set to not approved'}` })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// ==================== USER MANAGEMENT ====================

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 })
        
        // Get blog count for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const blogCount = await Blog.countDocuments({ 
                $or: [
                    { author: user._id },
                    { authorEmail: user.email }
                ]
            })
            const commentCount = await Comment.countDocuments({ realName: user.username })
            
            return {
                ...user.toObject(),
                blogCount,
                commentCount
            }
        }))
        
        res.json({ success: true, users: usersWithStats })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Promote user to admin
export const promoteToAdmin = async (req, res) => {
    try {
        const { userId } = req.body
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' })
        }
        
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }
        
        if (user.role === 'admin') {
            return res.json({ success: false, message: 'User is already an admin' })
        }
        
        user.role = 'admin'
        await user.save()
        
        res.json({ success: true, message: `${user.username} has been promoted to admin` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Demote admin to user
export const demoteToUser = async (req, res) => {
    try {
        const { userId } = req.body
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' })
        }
        
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }
        
        if (user.role !== 'admin') {
            return res.json({ success: false, message: 'User is not an admin' })
        }
        
        // Check if this is the only admin
        const adminCount = await User.countDocuments({ role: 'admin' })
        if (adminCount <= 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot demote the only admin. Promote another user to admin first.' 
            })
        }
        
        user.role = 'user'
        await user.save()
        
        res.json({ success: true, message: `${user.username} has been demoted to regular user` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Delete user (admin only)
export const deleteUserById = async (req, res) => {
    try {
        const { userId } = req.body
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' })
        }
        
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }
        
        // Prevent deleting yourself
        if (req.user.userId.toString() === userId) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account from here' })
        }
        
        // Prevent deleting the last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' })
            if (adminCount <= 1) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete the only admin account' 
                })
            }
        }
        
        // Delete all user's blogs
        await Blog.deleteMany({ 
            $or: [
                { author: user._id },
                { authorEmail: user.email }
            ]
        })
        
        // Delete all user's comments
        await Comment.deleteMany({ realName: user.username })
        
        // Delete user
        await User.findByIdAndDelete(userId)
        
        res.json({ success: true, message: `User ${user.username} and all their content has been deleted` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Create new admin user
export const createAdminUser = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body
        
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, email, password, and full name are required' 
            })
        }
        
        // Check if user already exists
        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' })
        }
        
        const existingUsername = await User.findOne({ username })
        if (existingUsername) {
            return res.status(400).json({ success: false, message: 'Username already taken' })
        }
        
        // Create admin user
        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({ 
            username, 
            email, 
            password: hashed, 
            fullName,
            role: 'admin'
        })
        
        res.json({ 
            success: true, 
            message: `Admin user ${username} created successfully`,
            user: { username: user.username, email: user.email, fullName: user.fullName }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}