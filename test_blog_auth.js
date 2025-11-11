/*
 * Test script to check blog creation with authentication
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

// First, let's try to register a test user
async function registerTestUser() {
    try {
        const response = await fetch(`${BASE_URL}/api/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User'
            })
        });
        
        const data = await response.json();
        console.log('Register response:', data);
        return data;
    } catch (error) {
        console.error('Register error:', error);
        return null;
    }
}

// Login and get token
async function loginTestUser() {
    try {
        const response = await fetch(`${BASE_URL}/api/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        return data.token;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

// Create a blog with token
async function createTestBlog(token) {
    try {
        const formData = new FormData();
        
        // Create a simple test blog
        const blogData = {
            title: 'Test Blog Post',
            subTitle: 'This is a test subtitle',
            description: '<p>This is a test blog post content.</p>',
            category: 'Technology',
            isPublished: true
        };
        
        formData.append('blog', JSON.stringify(blogData));
        
        // Use a simple text file as image for testing
        const testImageContent = 'fake image data';
        const buffer = Buffer.from(testImageContent, 'utf8');
        formData.append('image', buffer, {
            filename: 'test.jpg',
            contentType: 'image/jpeg'
        });
        
        const headers = {
            'Authorization': token  // This is how the frontend sends it (without Bearer prefix)
        };
        
        console.log('Sending request with headers:', headers);
        
        const response = await fetch(`${BASE_URL}/api/blog/add`, {
            method: 'POST',
            headers: headers,
            body: formData
        });
        
        const data = await response.json();
        console.log('Create blog response:', data);
        return data;
    } catch (error) {
        console.error('Create blog error:', error);
        return null;
    }
}

// Run the test
async function runTest() {
    console.log('=== Testing Blog Creation with Auth ===');
    
    // Try to register (might fail if user exists, that's ok)
    await registerTestUser();
    
    // Login to get token
    const token = await loginTestUser();
    if (!token) {
        console.error('Failed to get token');
        return;
    }
    
    console.log('Got token:', token.substring(0, 50) + '...');
    
    // Create blog with token
    await createTestBlog(token);
    
    console.log('=== Test Complete ===');
}

runTest();