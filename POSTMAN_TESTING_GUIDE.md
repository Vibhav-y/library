# Postman Testing Guide for Library Management System

## 🚀 Setup Instructions

### 1. Start the Backend Server
```bash
cd library-backend
npm install
npm start
```
Server should be running on `http://localhost:5000`

### 2. Postman Collection Setup
Create a new collection in Postman called "Library Management System" and set up the following:

**Base URL Variable:**
- Variable: `baseURL`
- Value: `http://localhost:5000/api`

**Authorization Token Variable:**
- Variable: `authToken`
- Value: (will be set after login)

---

## 📋 API Endpoints Testing

### 1. Authentication Endpoints

#### 1.1 User Registration
**POST** `{{baseURL}}/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "student"
}
```

**Test Cases:**
- Student registration
- Admin registration
- Super admin registration
- Duplicate email (should fail)
- Invalid email format (should fail)
- Missing password (should fail)

**Expected Response (Success):**
```json
{
  "message": "User registered successfully"
}
```

#### 1.2 User Login
**POST** `{{baseURL}}/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Expected Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f7b1234567890abcdef123",
    "email": "student@example.com",
    "role": "student"
  }
}
```

**Post-Request Script (Save Token):**
```javascript
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    pm.collectionVariables.set("authToken", responseJson.token);
    console.log("Token saved:", responseJson.token);
}
```

---

### 2. Document Endpoints

#### 2.1 Get All Documents
**GET** `{{baseURL}}/document`

**Headers:**
```
Authorization: {{authToken}}
```

**Expected Response:**
```json
[
  {
    "_id": "64f7b1234567890abcdef123",
    "title": "Sample Document",
    "filePath": "uploads/1234567890-sample.pdf",
    "category": {
      "_id": "64f7b1234567890abcdef456",
      "name": "Academic"
    },
    "uploadedBy": "64f7b1234567890abcdef789",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
]
```

#### 2.2 Upload Document (Admin Only)
**POST** `{{baseURL}}/document`

**Headers:**
```
Authorization: {{authToken}}
```

**Body (form-data):**
```
title: Sample Document Title
category: 64f7b1234567890abcdef456
pdf: [Select a PDF file]
```

**Test Cases:**
- Valid PDF upload (admin user)
- Upload without admin role (should fail)
- Upload without PDF file (should fail)
- Upload with invalid category (should fail)
- Upload without title (should fail)

**Expected Response (Success):**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "_id": "64f7b1234567890abcdef123",
    "title": "Sample Document Title",
    "filePath": "uploads/1234567890-sample.pdf",
    "category": "64f7b1234567890abcdef456",
    "uploadedBy": "64f7b1234567890abcdef789",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
}
```

---

### 3. Category Endpoints

#### 3.1 Get All Categories
**GET** `{{baseURL}}/category`

**Headers:**
```
Authorization: {{authToken}}
```

**Expected Response:**
```json
[
  {
    "_id": "64f7b1234567890abcdef123",
    "name": "Academic",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  },
  {
    "_id": "64f7b1234567890abcdef456",
    "name": "Research",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
]
```

#### 3.2 Create Category (Admin Only)
**POST** `{{baseURL}}/category`

**Headers:**
```
Authorization: {{authToken}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Academic"
}
```

**Test Cases:**
- Valid category creation (admin user)
- Create without admin role (should fail)
- Duplicate category name (should fail)
- Empty category name (should fail)

**Expected Response (Success):**
```json
{
  "message": "Category created successfully",
  "category": {
    "_id": "64f7b1234567890abcdef123",
    "name": "Academic",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
}
```

---

### 4. Student Management Endpoints

#### 4.1 Get All Students (Admin Only)
**GET** `{{baseURL}}/students`

**Headers:**
```
Authorization: {{authToken}}
```

**Expected Response:**
```json
[
  {
    "_id": "64f7b1234567890abcdef123",
    "email": "student1@example.com",
    "role": "student",
    "terminationDate": "2024-12-31T00:00:00.000Z",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  },
  {
    "_id": "64f7b1234567890abcdef456",
    "email": "student2@example.com",
    "role": "student",
    "terminationDate": null,
    "createdAt": "2023-09-06T11:30:00.000Z",
    "updatedAt": "2023-09-06T11:30:00.000Z"
  }
]
```

#### 4.2 Create Student (Admin Only)
**POST** `{{baseURL}}/students`

**Headers:**
```
Authorization: {{authToken}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "newstudent@example.com",
  "password": "password123",
  "terminationDate": "2024-12-31"
}
```

**Test Cases:**
- Valid student creation (admin user)
- Create without admin role (should fail)
- Duplicate email (should fail)
- Invalid email format (should fail)
- Missing password (should fail)
- Future termination date
- Past termination date

**Expected Response (Success):**
```json
{
  "message": "Student created",
  "student": {
    "_id": "64f7b1234567890abcdef123",
    "email": "newstudent@example.com",
    "role": "student",
    "terminationDate": "2024-12-31T00:00:00.000Z",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
}
```

#### 4.3 Update Student Termination Date (Admin Only)
**PUT** `{{baseURL}}/students/64f7b1234567890abcdef123/termination`

**Headers:**
```
Authorization: {{authToken}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "terminationDate": "2025-06-30"
}
```

**Test Cases:**
- Valid termination date update (admin user)
- Update without admin role (should fail)
- Invalid student ID (should fail)
- Invalid date format (should fail)
- Null termination date (remove expiration)

**Expected Response (Success):**
```json
{
  "message": "Termination date updated",
  "student": {
    "_id": "64f7b1234567890abcdef123",
    "email": "newstudent@example.com",
    "role": "student",
    "terminationDate": "2025-06-30T00:00:00.000Z",
    "createdAt": "2023-09-06T10:30:00.000Z",
    "updatedAt": "2023-09-06T10:30:00.000Z"
  }
}
```

#### 4.4 Delete Student (Admin Only)
**DELETE** `{{baseURL}}/students/64f7b1234567890abcdef123`

**Headers:**
```
Authorization: {{authToken}}
```

**Test Cases:**
- Valid student deletion (admin user)
- Delete without admin role (should fail)
- Invalid student ID (should fail)
- Delete non-existent student (should fail)

**Expected Response (Success):**
```json
{
  "message": "Student deleted"
}
```

---

### 5. User Dashboard Endpoint

#### 5.1 Get Dashboard Data
**GET** `{{baseURL}}/user/dashboard`

**Headers:**
```
Authorization: {{authToken}}
```

**Expected Response:**
```json
{
  "message": "Hello student, welcome to your dashboard!"
}
```

---

## 🧪 Complete Test Scenarios

### Scenario 1: Student Workflow
1. Register as student
2. Login and save token
3. Get dashboard data
4. Get all documents
5. Get all categories
6. Try to upload document (should fail)
7. Try to create category (should fail)
8. Try to create student (should fail)

### Scenario 2: Admin Workflow
1. Register as admin
2. Login and save token
3. Get dashboard data
4. Create categories
5. Upload documents
6. Create student accounts
7. Update student termination dates
8. Delete student accounts

### Scenario 3: Authentication Testing
1. Try accessing protected endpoints without token (should fail)
2. Try accessing admin endpoints as student (should fail)
3. Test with invalid token (should fail)
4. Test with expired token (should fail)

### Scenario 4: Error Handling
1. Test all endpoints with missing required fields
2. Test with invalid data formats
3. Test with non-existent resource IDs
4. Test duplicate resource creation

---

## 📊 Postman Collection JSON

Here's a complete Postman collection you can import:

```json
{
  "info": {
    "name": "Library Management System",
    "description": "Complete API testing collection for Library Management System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseURL",
      "value": "http://localhost:5000/api",
      "type": "string"
    },
    {
      "key": "authToken",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register Student",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"student@example.com\",\n  \"password\": \"password123\",\n  \"role\": \"student\"\n}"
            },
            "url": {
              "raw": "{{baseURL}}/auth/register",
              "host": ["{{baseURL}}"],
              "path": ["auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const responseJson = pm.response.json();",
                  "    pm.collectionVariables.set(\"authToken\", responseJson.token);",
                  "    console.log(\"Token saved:\", responseJson.token);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"student@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{baseURL}}/auth/login",
              "host": ["{{baseURL}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Documents",
      "item": [
        {
          "name": "Get All Documents",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseURL}}/document",
              "host": ["{{baseURL}}"],
              "path": ["document"]
            }
          }
        },
        {
          "name": "Upload Document",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "title",
                  "value": "Sample Document",
                  "type": "text"
                },
                {
                  "key": "category",
                  "value": "64f7b1234567890abcdef456",
                  "type": "text"
                },
                {
                  "key": "pdf",
                  "type": "file",
                  "src": []
                }
              ]
            },
            "url": {
              "raw": "{{baseURL}}/document",
              "host": ["{{baseURL}}"],
              "path": ["document"]
            }
          }
        }
      ]
    },
    {
      "name": "Categories",
      "item": [
        {
          "name": "Get All Categories",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseURL}}/category",
              "host": ["{{baseURL}}"],
              "path": ["category"]
            }
          }
        },
        {
          "name": "Create Category",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Academic\"\n}"
            },
            "url": {
              "raw": "{{baseURL}}/category",
              "host": ["{{baseURL}}"],
              "path": ["category"]
            }
          }
        }
      ]
    },
    {
      "name": "Students",
      "item": [
        {
          "name": "Get All Students",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseURL}}/students",
              "host": ["{{baseURL}}"],
              "path": ["students"]
            }
          }
        },
        {
          "name": "Create Student",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"newstudent@example.com\",\n  \"password\": \"password123\",\n  \"terminationDate\": \"2024-12-31\"\n}"
            },
            "url": {
              "raw": "{{baseURL}}/students",
              "host": ["{{baseURL}}"],
              "path": ["students"]
            }
          }
        },
        {
          "name": "Update Termination Date",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"terminationDate\": \"2025-06-30\"\n}"
            },
            "url": {
              "raw": "{{baseURL}}/students/STUDENT_ID_HERE/termination",
              "host": ["{{baseURL}}"],
              "path": ["students", "STUDENT_ID_HERE", "termination"]
            }
          }
        },
        {
          "name": "Delete Student",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseURL}}/students/STUDENT_ID_HERE",
              "host": ["{{baseURL}}"],
              "path": ["students", "STUDENT_ID_HERE"]
            }
          }
        }
      ]
    },
    {
      "name": "User",
      "item": [
        {
          "name": "Get Dashboard",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "{{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseURL}}/user/dashboard",
              "host": ["{{baseURL}}"],
              "path": ["user", "dashboard"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🔧 Testing Tips

### 1. Environment Setup
- Create separate environments for development, staging, and production
- Use environment variables for base URLs and common values

### 2. Authentication Testing
- Always test both authenticated and unauthenticated requests
- Test with different user roles (student, admin, superadmin)
- Test with invalid/expired tokens

### 3. Error Handling
- Test all error scenarios (400, 401, 403, 404, 500)
- Verify error message formats and content
- Test with malformed JSON and missing fields

### 4. File Upload Testing
- Test with different file types (PDF, images, text files)
- Test with large files and file size limits
- Test with no file selected
- Test with invalid file formats

### 5. Data Validation
- Test with invalid email formats
- Test with weak passwords
- Test with SQL injection attempts
- Test with XSS payloads

---

## 📝 Common Issues & Solutions

### Issue 1: "Access denied. No token provided."
**Solution:** Make sure the Authorization header is set with the token from login

### Issue 2: "Invalid token."
**Solution:** Login again to get a fresh token, or check if the JWT_SECRET matches

### Issue 3: "Access denied. Admins only."
**Solution:** Make sure you're logged in as an admin or superadmin user

### Issue 4: "User already exists"
**Solution:** Use a different email address or delete the existing user

### Issue 5: File upload fails
**Solution:** Make sure the uploads directory exists and has write permissions

---

This comprehensive guide should help you thoroughly test your Library Management System backend API using Postman! 
