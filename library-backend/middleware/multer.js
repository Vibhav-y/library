/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import multer from 'multer'
import fs from 'fs'
import path from 'path'

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

// Use a simple disk destination so files are written to ./uploads and later cleaned up
const upload = multer({ dest: uploadDir })

export default upload