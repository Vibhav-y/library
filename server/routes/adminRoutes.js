/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import express from 'express'
import { adminLogin, approveCommentById, deleteCommentById, deleteCommentsByIds, getAllBlogsAdmin, getAllComments, getDashboard, unflagCommentById, toggleCommentApprovalById, getAllChats, deleteChatById } from '../controllers/adminController.js'
import adminAuth from '../middleware/adminAuth.js'

const adminRouter = express.Router()

adminRouter.post("/login", adminLogin)
// Protect admin routes with adminAuth middleware
adminRouter.get("/comments", adminAuth, getAllComments)
adminRouter.get("/blogs", adminAuth, getAllBlogsAdmin)
adminRouter.get('/chats', adminAuth, getAllChats)
adminRouter.post("/delete-comment", adminAuth, deleteCommentById)
adminRouter.post("/delete-comments", adminAuth, deleteCommentsByIds)
adminRouter.post("/approve-comment", adminAuth, approveCommentById)
adminRouter.post('/toggle-comment-approval/:id', adminAuth, toggleCommentApprovalById)
adminRouter.post('/unflag-comment', adminAuth, unflagCommentById)
adminRouter.post('/delete-chat', adminAuth, deleteChatById)
adminRouter.get("/dashboard", adminAuth, getDashboard)

export default adminRouter