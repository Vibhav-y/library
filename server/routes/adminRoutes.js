/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import express from 'express'
import { 
    adminLogin, 
    approveCommentById, 
    deleteCommentById, 
    deleteCommentsByIds, 
    getAllBlogsAdmin, 
    getAllComments, 
    getDashboard, 
    unflagCommentById, 
    toggleCommentApprovalById, 
    getAllChats, 
    deleteChatById,
    getAllUsers,
    promoteToAdmin,
    demoteToUser,
    deleteUserById,
    createAdminUser
} from '../controllers/adminController.js'
import adminAuth from '../middleware/adminAuth.js'

const adminRouter = express.Router()

adminRouter.post("/login", adminLogin)

// Blog routes
adminRouter.get("/blogs", adminAuth, getAllBlogsAdmin)

// Comment routes
adminRouter.get("/comments", adminAuth, getAllComments)
adminRouter.post("/delete-comment", adminAuth, deleteCommentById)
adminRouter.post("/delete-comments", adminAuth, deleteCommentsByIds)
adminRouter.post("/approve-comment", adminAuth, approveCommentById)
adminRouter.post('/toggle-comment-approval/:id', adminAuth, toggleCommentApprovalById)
adminRouter.post('/unflag-comment', adminAuth, unflagCommentById)

// Chat routes
adminRouter.get('/chats', adminAuth, getAllChats)
adminRouter.post('/delete-chat', adminAuth, deleteChatById)

// Dashboard
adminRouter.get("/dashboard", adminAuth, getDashboard)

// User management routes
adminRouter.get("/users", adminAuth, getAllUsers)
adminRouter.post("/promote-admin", adminAuth, promoteToAdmin)
adminRouter.post("/demote-admin", adminAuth, demoteToUser)
adminRouter.post("/delete-user", adminAuth, deleteUserById)
adminRouter.post("/create-admin", adminAuth, createAdminUser)

export default adminRouter