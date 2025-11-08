/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
    blog: {type: mongoose.Schema.Types.ObjectId, ref: 'blog', required: true},
    // realName: the actual name provided by the user (visible to admin)
    realName: {type: String},
    // displayName: what is shown publicly (either realName or 'Anonymous')
    displayName: {type: String, required: true},
    // parent: reference to another comment for threaded replies
    parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null},
    content: {type: String, required: true},
    // auto-approve comments by default
    isApproved: {type: Boolean, default: true},
    // track if comment was reported/flagged for review
    isFlagged: {type: Boolean, default: false},
    // optional reason for flagging
    flagReason: {type: String},
}, {timestamps: true})

const Comment = mongoose.model('Comment', commentSchema)

export default Comment