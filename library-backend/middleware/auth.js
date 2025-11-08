/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
    // Accept authorization header in either case and allow optional "Bearer <token>" prefix
    const raw = req.headers.authorization || req.headers.Authorization

    if (!raw) {
        return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // attach decoded payload to request for downstream usage
        req.user = decoded
        next()
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid Token' })
    }
}

export default auth