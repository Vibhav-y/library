/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import Contact from '../models/Contact.js';

// Submit contact form (public)
export const submitContactForm = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please fill in all required fields' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid email address' 
            });
        }

        const contact = new Contact({
            name,
            email,
            phone,
            subject,
            message
        });

        await contact.save();

        res.status(201).json({ 
            success: true, 
            message: 'Thank you for contacting us! We will respond within 24-48 hours.',
            contact 
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit contact form. Please try again.' 
        });
    }
};

// Get all contacts (admin only)
export const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            contacts,
            total: contacts.length
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch contacts' 
        });
    }
};

// Update contact status/priority (admin only)
export const updateContactStatus = async (req, res) => {
    try {
        const { id, status, priority, adminNotes } = req.body;

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Contact ID is required' 
            });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        const contact = await Contact.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({ 
                success: false, 
                message: 'Contact not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Contact updated successfully',
            contact 
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update contact' 
        });
    }
};

// Delete contact (admin only)
export const deleteContact = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Contact ID is required' 
            });
        }

        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({ 
                success: false, 
                message: 'Contact not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Contact deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete contact' 
        });
    }
};
