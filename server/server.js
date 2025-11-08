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
app.use(cors())
app.use(express.json())

// Serve uploaded files (dev fallback when ImageKit not configured)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Routes
app.get('/', (req, res)=> res.send("API is Working"))
app.use('/api/admin', adminRouter)
app.use('/api/blog', blogRouter)
app.use('/api/user', userRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=> {
    console.log('Server is running on port ' + PORT)
})

export default app