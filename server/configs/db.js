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

// Build a URI that ensures the database name quickblog is present.
let MODIFIED_URI = MONGODB_URI
const queryIndex = MONGODB_URI.indexOf('?')

if (queryIndex !== -1) {
    const beforeQuery = MONGODB_URI.slice(0, queryIndex)
    const query = MONGODB_URI.slice(queryIndex)
    // If a DB name is present (path portion has more than just the host) leave it
    const pathPart = beforeQuery.split('/').slice(3).join('/')
    if (!pathPart) {
        // no DB name present, insert quickblog (avoid double slashes)
        const base = beforeQuery.endsWith('/') ? beforeQuery.slice(0, -1) : beforeQuery
        MODIFIED_URI = `${base}/quickblog${query}`
    } else {
        MODIFIED_URI = MONGODB_URI
    }
} else {
    // No query string present. Append /quickblog if not already set
    if (!MONGODB_URI.endsWith('/quickblog')) {
        const base = MONGODB_URI.endsWith('/') ? MONGODB_URI.slice(0, -1) : MONGODB_URI
        MODIFIED_URI = `${base}/quickblog`
    }
}

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"))
        await mongoose.connect(MODIFIED_URI)
    } catch(error) {
        console.error('Failed to connect to database:', error.message)
        process.exit(1)
    }
}

export default connectDB

// let mongodb_uri = 'mongodb+srv://zoom169speedster:HunterZolomon@zoom-cluster.wtvvdih.mongodb.net/?retryWrites=true&w=majority&appName=zoom-cluster'
// const qureyIndex = mongodb_uri.indexOf('?')
// const modified_uri = mongodb_uri.slice(0, qureyIndex) + 'quickblog' + mongodb_uri.slice(qureyIndex)
// console.log(modified_uri)