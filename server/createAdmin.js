/*
 * Setup script to create the first admin user for LibraFlow
 * Run this script once to create your first admin account
 * 
 * Usage: node createAdmin.js
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import readline from 'readline'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// User schema (replicate from models/User.js)
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

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve))

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Main function
async function createAdmin() {
    try {
        console.log('\n=================================')
        console.log('  LibraFlow Admin Setup Script')
        console.log('=================================\n')

        // Connect to MongoDB
        console.log('Connecting to MongoDB...')
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✓ Connected to database\n')

        // Check if any admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' })
        if (existingAdmin) {
            console.log('⚠️  WARNING: An admin user already exists!')
            console.log(`   Username: ${existingAdmin.username}`)
            console.log(`   Email: ${existingAdmin.email}\n`)
            
            const proceed = await question('Do you want to create another admin? (yes/no): ')
            if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
                console.log('\nSetup cancelled.')
                rl.close()
                await mongoose.connection.close()
                process.exit(0)
            }
            console.log('')
        }

        // Get admin details
        console.log('Enter admin user details:\n')
        
        let username = await question('Username: ')
        while (!username || username.trim().length < 3) {
            console.log('❌ Username must be at least 3 characters')
            username = await question('Username: ')
        }

        // Check if username exists
        const existingUsername = await User.findOne({ username: username.trim() })
        if (existingUsername) {
            console.log('❌ Username already taken!')
            rl.close()
            await mongoose.connection.close()
            process.exit(1)
        }

        let fullName = await question('Full Name: ')
        while (!fullName || fullName.trim().length < 2) {
            console.log('❌ Full name is required')
            fullName = await question('Full Name: ')
        }

        let email = await question('Email: ')
        while (!isValidEmail(email)) {
            console.log('❌ Invalid email format')
            email = await question('Email: ')
        }

        // Check if email exists
        const existingEmail = await User.findOne({ email: email.trim() })
        if (existingEmail) {
            console.log('❌ Email already registered!')
            rl.close()
            await mongoose.connection.close()
            process.exit(1)
        }

        let password = await question('Password (min 6 characters): ')
        while (!password || password.length < 6) {
            console.log('❌ Password must be at least 6 characters')
            password = await question('Password (min 6 characters): ')
        }

        let confirmPassword = await question('Confirm Password: ')
        while (password !== confirmPassword) {
            console.log('❌ Passwords do not match')
            confirmPassword = await question('Confirm Password: ')
        }

        // Create admin user
        console.log('\nCreating admin user...')
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const admin = await User.create({
            username: username.trim(),
            fullName: fullName.trim(),
            email: email.trim(),
            password: hashedPassword,
            role: 'admin'
        })

        console.log('\n✅ SUCCESS! Admin user created successfully!\n')
        console.log('═══════════════════════════════════')
        console.log('Admin Details:')
        console.log('═══════════════════════════════════')
        console.log(`Username:  ${admin.username}`)
        console.log(`Email:     ${admin.email}`)
        console.log(`Full Name: ${admin.fullName}`)
        console.log(`Role:      ${admin.role}`)
        console.log('═══════════════════════════════════\n')
        console.log('You can now login to the admin panel at:')
        console.log('http://localhost:5173/admin\n')
        console.log('⚠️  Keep your credentials safe!\n')

        rl.close()
        await mongoose.connection.close()
        process.exit(0)
    } catch (error) {
        console.error('\n❌ Error creating admin:', error.message)
        rl.close()
        await mongoose.connection.close()
        process.exit(1)
    }
}

// Run the script
createAdmin()
