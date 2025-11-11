import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    alternateEmail: { type: String },
    bio: { type: String, maxlength: 200 },
    role: { type: String, enum: ['user','admin'], default: 'user' }
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

export default User
