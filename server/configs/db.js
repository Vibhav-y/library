/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in environment. Please set it to your MongoDB connection string.')
    // Fail fast so the developer knows to configure env vars
    process.exit(1)
}

// Use the URI exactly as provided without forcing a database name.
// This avoids unintended changes when a specific DB is already configured.
const MODIFIED_URI = MONGODB_URI

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"))
        mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err))
        mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))
        
        await mongoose.connect(MODIFIED_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        })
        console.log('MongoDB connected successfully')
    } catch(error) {
        console.error('Failed to connect to database:', error.message)
        process.exit(1)
    }
}

export default connectDB

// let mongodb_uri = 'mongodb+srv://zoom169speedster:HunterZolomon@zoom-cluster.wtvvdih.mongodb.net/?retryWrites=true&w=majority&appName=zoom-cluster'
// const qureyIndex = mongodb_uri.indexOf('?')
// const modified_uri = mongodb_uri.slice(0, qureyIndex) + 'libraflow' + mongodb_uri.slice(qureyIndex)
// console.log(modified_uri)