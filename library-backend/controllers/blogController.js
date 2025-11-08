/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import fs from 'fs'
import imagekit from '../configs/imageKit.js'
import Blog from '../models/Blog.js'
import Comment from '../models/Comment.js'
import Chat from '../models/Chat.js'

export const addBlog = async (req, res) => {
    try {
        console.log('addBlog req.body keys:', Object.keys(req.body || {}))
        console.log('addBlog req.body.blog (raw):', req.body && req.body.blog)
        console.log('addBlog req.file present:', !!req.file, req.file && { fieldname: req.file.fieldname, originalname: req.file.originalname, filename: req.file.filename })

        // Also write a small debug file so we can inspect multipart payloads from test scripts
        try {
            const debug = {
                time: new Date().toISOString(),
                headers: req.headers,
                bodyKeys: Object.keys(req.body || {}),
                blogRaw: req.body && req.body.blog,
                file: req.file && { fieldname: req.file.fieldname, originalname: req.file.originalname, filename: req.file.filename, path: req.file.path }
            }
            const logPath = `${process.cwd()}/uploads/addblog_debug.log`
            fs.appendFileSync(logPath, JSON.stringify(debug) + '\n')
        } catch (e) {
            console.warn('Failed to write debug file:', e.message)
        }

        const {title, subTitle, description, category, isPublished} = JSON.parse(req.body.blog)

        // Multer may populate req.file (single) or req.files (any). Accept either.
        let imageFile = req.file
        if (!imageFile && req.files && req.files.length > 0) imageFile = req.files[0]

        // Try to detect an author from an optional token provided by the client.
        let authorName = undefined
        let authorEmail = undefined
        const rawAuth = req.headers.authorization || req.headers.Authorization
        if (rawAuth) {
            try {
                const token = rawAuth.startsWith('Bearer ') ? rawAuth.split(' ')[1] : rawAuth
                const jwt = await import('jsonwebtoken')
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                authorName = decoded.name
                authorEmail = decoded.email
            } catch (e) {
                // ignore decode errors — posting as anonymous
            }
        }

        // Check if all credits are present
        if(!title || !description || !category || !imageFile) {
            return res.json({success: false, message: "Missing required fields"})
        }
        let image

        // Try to upload to ImageKit. If ImageKit is not configured or upload fails,
        // fallback to serving the locally uploaded file from /uploads.
        try {
            const fileBuffer = fs.readFileSync(imageFile.path)
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: imageFile.originalname,
                folder: "/blogs"
            })

            // Optimization through ImageKit URL Transformation
            const optimizedImageUrl = imagekit.url({
                path: response.filePath,
                transformation: [
                    {quality: 'auto'}, // Auto compression
                    {format: 'webp'}, // Convert to modern format
                    {width: '1280'} // Width resizing
                ]
            })

            image = optimizedImageUrl

            // Clean up temporary file written by multer since the file is hosted remotely now
            try { fs.unlinkSync(imageFile.path) } catch (e) { console.warn('Could not delete temp upload:', e.message) }
        } catch (err) {
            // If ImageKit isn't configured or upload failed, use the local file as fallback.
            // The file is available at /uploads/<filename> and we DO NOT delete it.
            console.warn('ImageKit upload failed, using local file fallback:', err.message)
            const host = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
            image = `${host}/uploads/${imageFile.filename}`
        }

    const blogDoc = { title, subTitle, description, category, image, isPublished }
    if (authorName) blogDoc.authorName = authorName
    if (authorEmail) blogDoc.authorEmail = authorEmail
    await Blog.create(blogDoc)

        res.json({success: true, message: "Blog added successfully"})

    } catch(error) {
        res.json({success: false, message: error.message})
    }
}

export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({isPublished: true})
        res.json({success: true, blogs})
    } catch(error) {
        res.json({success: false, message: error.message})
    }
}

export const getBlogById = async (req, res) => {
    try {
        const { blogId } = req.params
        const blog = await Blog.findById(blogId)
        if(!blog) {
            return res.json({success: false, message: "Blog not found"})
        }
        res.json({success: true, blog})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const deleteBlogById = async (req, res) => {
    try {
        const { id } = req.body
        await Blog.findByIdAndDelete(id)

        // Delete all comments associated with this blog
        await Comment.deleteMany({blog: id})

        res.json({success: true, message: "Blog deleted successfully"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const togglePublish = async (req, res) => {
    try {
        const { id } = req.body
        const blog = await Blog.findById(id)
        blog.isPublished = !blog.isPublished
        await blog.save()
        res.json({success: true, message: "Blog status updated"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const addComment = async (req, res) => {
    try {
        const { blog, content, isAnonymous, parentId } = req.body

        // Determine commenter identity: prefer token payload if available
        let realName = undefined
        try {
            const raw = req.headers.authorization || req.headers.Authorization
            if (raw) {
                const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw
                const jwt = await import('jsonwebtoken')
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                realName = decoded.name || decoded.email
            }
        } catch (e) {
            // ignore - allow anonymous posting if client supplies a name in future
        }

        const displayName = isAnonymous ? 'Anonymous' : (realName || 'Anonymous')

    const commentDoc = { blog, realName, displayName, content, isApproved: true }
    if (parentId) commentDoc.parent = parentId

    await Comment.create(commentDoc)

        res.json({success: true, message: "Comment added"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const flagComment = async (req, res) => {
    try {
        const { id, reason } = req.body
        await Comment.findByIdAndUpdate(id, { isFlagged: true, flagReason: reason })
        res.json({ success: true, message: "Comment flagged for review" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getBlogComments = async (req, res) => {
    try {
        const { blogId } = req.body
        // Fetch all approved comments for the blog and build a nested tree
        const comments = await Comment.find({ blog: blogId, isApproved: true }).sort({ createdAt: 1 }).lean()

        // Map and attach children
        const map = new Map()
        comments.forEach(c => { c.children = []; map.set(String(c._id), c) })

        const roots = []
        comments.forEach(c => {
            if (c.parent) {
                const parent = map.get(String(c.parent))
                if (parent) parent.children.push(c)
                else roots.push(c)
            } else {
                roots.push(c)
            }
        })

        res.json({ success: true, comments: roots })
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const chatWithGemini = async (req, res) => {
    try {
        const { blogId, message } = req.body
        if (!message) return res.json({ success: false, message: 'No message provided' })

        // Try to fetch blog content to provide context
        let context = ''
        if (blogId) {
            try {
                const blog = await Blog.findById(blogId)
                if (blog) context = `${blog.title}\n\n${blog.description}`
            } catch (e) {
                // ignore
            }
        }
        // Save initial user message to DB (transcript)
        const chatDoc = await Chat.create({ blog: blogId || undefined, messages: [{ role: 'user', text: message }], startedBy: undefined })

        // Build a prompt that instructs the assistant to use the blog content as context
        const promptText = `You are an assistant that answers questions about a blog article. Use the article content when relevant. If the answer is not in the article, say you don't know and provide helpful guidance.\n\nArticle content:\n${context}\n\nUser question:\n${message}`

        // If GEMINI_API_KEY not configured, return fallback and save assistant reply
        if (!process.env.GEMINI_API_KEY) {
            const fallback = `(GEMINI API not configured) I can still help by summarizing the blog title: ${context ? context.split('\n')[0] : 'unknown'}. Ask concrete questions and I'll answer using local data when available.`
            // append assistant message to chatDoc
            chatDoc.messages.push({ role: 'assistant', text: fallback })
            await chatDoc.save()
            return res.json({ success: true, reply: fallback })
        }

        // Call Gemini via API key query param (Google API key style)
        const apiUrlBase = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
        const apiUrl = `${apiUrlBase}?key=${process.env.GEMINI_API_KEY}`

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 512
                }
            })
        })

        // If the upstream API returns an error (e.g. 404 model not found), capture and forward a clearer message
        const textBody = await response.text()
        let json
        try {
            json = JSON.parse(textBody)
        } catch (e) {
            json = { raw: textBody }
        }
        if (!response.ok) {
            console.warn('Generative API call failed', { status: response.status, body: json })
            return res.status(502).json({ success: false, message: `Generative API error: ${response.status} - ${(json && (json.error?.message || json.message)) || JSON.stringify(json)}` })
        }

    // Parse Gemini API response format
        let reply = ''
        if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
            reply = json.candidates[0].content.parts[0].text
        } else {
            console.warn('Unexpected Gemini API response format:', json)
            reply = 'Sorry, I received an unexpected response format from the API.'
        }

        // append assistant message to chatDoc
        chatDoc.messages.push({ role: 'assistant', text: reply })
        await chatDoc.save()

        res.json({ success: true, reply })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}