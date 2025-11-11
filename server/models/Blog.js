/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import mongoose from 'mongoose'

const blogSchema = new mongoose.Schema({
    title: {type: String, required: true},
    subTitle: {type: String},
    description: {type:String, required: true},
    category: {type: String, required: true},
    image: {type: String, required: true},
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    authorName: {type: String},
    authorEmail: {type: String},
    isPublished: {type: Boolean, required: true},
    isTakenDown: {type: Boolean, default: false},
    takedownReason: {type: String},
}, {timestamps: true})

const Blog = mongoose.model('blog', blogSchema)

export default Blog