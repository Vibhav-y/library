import express from 'express'
import { register, login, checkUsername, getUserProfile, updateProfile, changePassword, getUserBlogs, deleteOwnBlog, deleteAccount } from '../controllers/userController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Public registration and login for general users
router.post('/register', register)
router.post('/login', login)
router.get('/check-username', checkUsername)

// Protected user profile routes
router.get('/profile', auth, getUserProfile)
router.put('/profile', auth, updateProfile)
router.post('/change-password', auth, changePassword)
router.get('/my-blogs', auth, getUserBlogs)
router.delete('/my-blog', auth, deleteOwnBlog)
router.post('/delete-account', auth, deleteAccount)

export default router
