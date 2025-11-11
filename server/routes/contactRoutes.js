/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import express from 'express';
import { 
    submitContactForm, 
    getAllContacts, 
    updateContactStatus, 
    deleteContact 
} from '../controllers/contactController.js';
import adminAuth from '../middleware/adminAuth.js';

const contactRouter = express.Router();

// Public route
contactRouter.post('/submit', submitContactForm);

// Admin routes
contactRouter.get('/all', adminAuth, getAllContacts);
contactRouter.put('/update-status', adminAuth, updateContactStatus);
contactRouter.post('/delete', adminAuth, deleteContact);

export default contactRouter;
