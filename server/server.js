/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import express from 'express'
import path from 'path'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js'
import adminRouter from './routes/adminRoutes.js'
import blogRouter from './routes/blogRoutes.js'
import userRouter from './routes/userRoutes.js'

const app = express()

await connectDB()

// Middlewares
// CORS configuration - allow requests from client domain or all origins in development
const corsOptions = {
    origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || '*',
    credentials: true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files (dev fallback when ImageKit not configured)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.get('/', (req, res)=> res.send("API is Working"))
app.use('/api/admin', adminRouter)
app.use('/api/blog', blogRouter)
app.use('/api/user', userRouter)

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' })
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err)
    res.status(err.status || 500).json({ 
        success: false, 
        message: err.message || 'Internal server error' 
    })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=> {
    console.log('Server is running on port ' + PORT)
})

export default app