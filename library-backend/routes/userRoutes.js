import express from 'express'
import { register, login } from '../controllers/userController.js'

const router = express.Router()

// Public registration and login for general users
router.post('/register', register)
router.post('/login', login)

export default router
