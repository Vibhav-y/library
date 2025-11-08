/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import ImageKit from 'imagekit'

// If ImageKit env vars are not provided, export a safe shim so the server
// can run in development without crashing. The shim throws during upload calls
// to make it clear that uploads are not configured.
const hasKeys = process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT

let imagekit
if (!hasKeys) {
    imagekit = {
        upload: async () => {
            throw new Error('ImageKit not configured. Set IMAGEKIT_PUBLIC_KEY/PRIVATE_KEY/URL_ENDPOINT')
        },
        url: ({ path }) => {
            // If url is requested in code, return the path or empty string as a fallback
            return path || ''
        }
    }
} else {
    imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    })
}

export default imagekit