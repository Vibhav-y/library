/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import jwt from 'jsonwebtoken'
import Blog from '../models/Blog.js'
import Comment from '../models/Comment.js'
import Chat from '../models/Chat.js'

export const adminLogin = async (req, res) => {
    try {
        const {email, password} = req.body

        if (email != process.env.ADMIN_EMAIL || password != process.env.ADMIN_PASSWORD) {
            return res.json({success: false, message: "Invalid Credentials"})
        }

        // Issue token with admin role
        const token = jwt.sign({email, role: 'admin'}, process.env.JWT_SECRET)
        res.json({success: true, token})
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