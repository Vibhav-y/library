/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import mongoose from 'mongoose'

const donationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    message: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    isAnonymous: { type: Boolean, default: false }
}, { timestamps: true })

const Donation = mongoose.model('donation', donationSchema)

export default Donation
