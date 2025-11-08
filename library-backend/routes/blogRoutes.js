/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import express from 'express'
import { addBlog, addComment, deleteBlogById, getAllBlogs, getBlogById, getBlogComments, togglePublish, flagComment, chatWithGemini } from '../controllers/blogController.js'
import upload from '../middleware/multer.js'
import adminAuth from '../middleware/adminAuth.js'

const blogRouter = express.Router()


// Use upload.any() to be tolerant to how multipart is sent by different clients (some clients
// may send files in slightly different ways). The controller will pick the first file.
// Public add blog: anyone can post (optional token identifies author); file accepted via multipart
blogRouter.post("/add", upload.any(), addBlog)
 
blogRouter.get("/all", getAllBlogs)
blogRouter.get("/:blogId", getBlogById)
// Admin-only actions
blogRouter.post("/delete", adminAuth, deleteBlogById)
blogRouter.post("/toggle-publish", adminAuth, togglePublish)

blogRouter.post("/add-comment", addComment)
blogRouter.post("/comments", getBlogComments)
blogRouter.post("/flag-comment", flagComment)
// Chat with assistant (proxied through server to keep API key secret)
blogRouter.post('/chat', chatWithGemini)

export default blogRouter

