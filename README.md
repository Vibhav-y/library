# Library Management System

A comprehensive digital library management system built with React frontend and Node.js backend, featuring user authentication, document management, and role-based access control.

## 🚀 Features

### User Management
- **Multi-role Authentication**: Support for Students, Admins, and Super Admins
- **JWT-based Security**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user types
- **Student Account Management**: Admins can create, edit, and delete student accounts
- **Termination Date Tracking**: Set expiration dates for student accounts

### Document Management
- **PDF Upload & Storage**: Secure file upload with validation
- **Hierarchical Categorization**: Organize documents with nested categories (up to 3 levels)
- **Search & Filter**: Find documents by title and category
- **Download Functionality**: Easy document access for authorized users
- **Metadata Tracking**: Track upload dates and uploaders

### Admin Features
- **Hierarchical Category Management**: Create and manage nested categories with tree structure
- **Sub-category Support**: Create sub-categories and sub-sub-categories
- **Category Tree Visualization**: Expandable/collapsible category hierarchy
- **Student Management**: Full CRUD operations for student accounts
- **Document Upload**: Add new documents to the library
- **Dashboard Analytics**: Overview of system statistics

### User Interface
- **Modern Design**: Clean, responsive UI built with Tailwind CSS
- **Mobile Responsive**: Works seamlessly on all device sizes
- **Intuitive Navigation**: Easy-to-use sidebar navigation
- **Real-time Feedback**: Success/error messages and loading states
- **Drag & Drop Upload**: Modern file upload experience

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and context API
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **Lucide React**: Beautiful icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Multer**: File upload middleware

## 📁 Project Structure

```
library-management-system/
├── library-backend/
│   ├── controllers/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   └── Category.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── document.js
│   │   ├── category.js
│   │   ├── student.js
│   │   └── user.js
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env
├── library-frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Documents.js
│   │   │   ├── UploadDocument.js
│   │   │   ├── ManageStudents.js
│   │   │   ├── Categories.js
│   │   │   ├── Layout.js
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup

1. **Navigate to the backend directory**
   ```bash
   cd library-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/libraryDB
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```
   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd library-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## 🌳 Sub-Category Features

### Hierarchical Structure
The system supports up to 3 levels of category nesting:
- **Level 0**: Root categories (e.g., "Science", "Literature")
- **Level 1**: Sub-categories (e.g., "Physics", "Chemistry" under "Science")
- **Level 2**: Sub-sub-categories (e.g., "Quantum Physics" under "Physics")

### Key Features
- **Visual Tree Structure**: Categories are displayed in an expandable/collapsible tree
- **Path Tracking**: Full path from root is automatically maintained (e.g., "Science/Physics")
- **Unique Names**: Category names must be unique within the same parent level
- **Smart Deletion**: Cannot delete categories that have subcategories
- **Level Indicators**: Visual indicators show the category level and hierarchy
- **Easy Navigation**: Click + button to add subcategories directly from the tree view

### Usage Examples
```javascript
// Create a root category
POST /api/category
{
  "name": "Science",
  "parentCategory": null
}

// Create a sub-category
POST /api/category
{
  "name": "Physics",
  "parentCategory": "science_category_id"
}

// Create a sub-sub-category
POST /api/category
{
  "name": "Quantum Physics",
  "parentCategory": "physics_category_id"
}
```

### Testing Sub-Categories
Run the test script to verify sub-category functionality:
```bash
cd library-backend
node test-subcategories.js
```

## 📊 Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['student', 'admin', 'superadmin']),
  terminationDate: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Document Model
```javascript
{
  title: String (required),
  filePath: String (required),
  category: ObjectId (ref: Category),
  uploadedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model
```javascript
{
  name: String (required),
  parentCategory: ObjectId (ref: Category, optional),
  level: Number (default: 0),
  path: String (auto-generated path from root),
  createdAt: Date,
  updatedAt: Date
}
```

**Category Features:**
- **Hierarchical Structure**: Support for nested categories up to 3 levels
- **Unique Names**: Category names must be unique within the same parent
- **Auto-generated Paths**: Full path from root automatically maintained
- **Level Tracking**: Automatic level calculation for proper nesting
- **Cascade Protection**: Cannot delete categories with subcategories

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Documents
- `GET /api/document` - Get all documents
- `POST /api/document` - Upload new document (Admin only)

### Categories
- `GET /api/category` - Get all categories (flat list with hierarchy info)
- `GET /api/category/tree` - Get categories as hierarchical tree structure
- `GET /api/category/by-parent/:parentId` - Get categories by parent ID
- `POST /api/category` - Create new category or sub-category (Admin only)
- `DELETE /api/category/:id` - Delete category (Admin only, fails if has subcategories)

### Students
- `POST /api/students` - Create student account (Admin only)
- `PUT /api/students/:id/termination` - Update termination date (Admin only)
- `DELETE /api/students/:id` - Delete student account (Admin only)

### User
- `GET /api/user/dashboard` - Get user dashboard data

## 👥 User Roles & Permissions

### Student
- View and download documents
- Access personal dashboard
- Search and filter documents

### Admin
- All student permissions
- Upload new documents
- Create and manage categories
- Create and manage student accounts
- Set student termination dates

### Super Admin
- All admin permissions
- Create admin accounts
- Full system access

## 🔧 Configuration

### Environment Variables
```env
# Backend (.env)
PORT=5000
MONGO_URI=mongodb://localhost:27017/libraryDB
JWT_SECRET=your_super_secret_jwt_key
```

### Frontend Configuration
The frontend is configured to connect to the backend at `http://localhost:5000`. To change this, update the `API_BASE_URL` in `src/services/api.js`.

## 📱 Features Overview

### Dashboard
- Welcome message with user role
- Quick action buttons
- Statistics cards
- Recent documents list

### Document Management
- Upload documents with drag-and-drop
- Search by title
- Filter by category
- Download documents
- View document metadata

### User Management
- Create student accounts
- Set termination dates
- Edit student information
- Delete student accounts

### Category Management
- Create new categories
- View all categories
- Organize documents efficiently

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design
- **Loading States**: Visual feedback during operations
- **Error Handling**: User-friendly error messages
- **Success Notifications**: Confirmation of successful actions
- **Intuitive Navigation**: Easy-to-use sidebar menu

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables for production
3. Deploy to platforms like Heroku, DigitalOcean, or AWS

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to platforms like Netlify, Vercel, or GitHub Pages
3. Update API base URL for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🐛 Known Issues

- Student list endpoint needs to be implemented in the backend
- File size limit validation could be improved
- Email notifications for account creation are not implemented

## 🔮 Future Enhancements

- [ ] Email notifications
- [ ] Advanced search with full-text search
- [ ] Document preview functionality
- [ ] Bulk document upload
- [ ] User activity logging
- [ ] Document versioning
- [ ] Advanced analytics dashboard
- [ ] Dark mode support
- [ ] Multi-language support

## 📞 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ using React and Node.js** 