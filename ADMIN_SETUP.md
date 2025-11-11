# Admin Setup Guide

## ⚠️ IMPORTANT SECURITY UPDATE

**The admin system has been completely redesigned for better security.**

Previously, admin credentials were hardcoded in environment variables. This has been removed and replaced with a database-driven admin system.

## What Changed?

### ❌ Old System (Removed)
- Hardcoded `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
- Anyone with access to `.env` file could see credentials
- Single admin account only
- Admin identification via environment variable

### ✅ New System (Current)
- Admin users stored in database with encrypted passwords
- Multiple admin accounts supported
- Role-based access control (admin/user)
- Admin management interface in admin panel
- Secure password hashing with bcrypt

## Getting Started

### Step 1: Remove Old Environment Variables

If you have these in your `server/.env` file, **remove them**:
```env
ADMIN_EMAIL=your-email@example.com    # ❌ REMOVE THIS
ADMIN_PASSWORD=your-password          # ❌ REMOVE THIS
```

These are no longer used and should be deleted for security.

### Step 2: Create Your First Admin User

Run the admin setup script:

```bash
cd server
node createAdmin.js
```

Follow the prompts to enter:
- **Username** (min 3 characters)
- **Full Name**
- **Email** (valid email format)
- **Password** (min 6 characters)
- **Confirm Password**

Example:
```
=================================
  LibraFlow Admin Setup Script
=================================

Connecting to MongoDB...
✓ Connected to database

Enter admin user details:

Username: admin
Full Name: Admin User
Email: admin@example.com
Password (min 6 characters): ••••••••
Confirm Password: ••••••••

Creating admin user...

✅ SUCCESS! Admin user created successfully!

═══════════════════════════════════
Admin Details:
═══════════════════════════════════
Username:  admin
Email:     admin@example.com
Full Name: Admin User
Role:      admin
═══════════════════════════════════

You can now login to the admin panel at:
http://localhost:5173/admin

⚠️  Keep your credentials safe!
```

### Step 3: Login to Admin Panel

1. Navigate to `http://localhost:5173/admin`
2. Enter your admin credentials
3. You're now logged in!

## Admin Features

### 1. Dashboard
- Overview of blogs, comments, and drafts
- Recent blog posts
- Quick statistics

### 2. Blog Management
- Add new blogs
- View all blogs
- Edit/Delete blogs
- Manage draft status

### 3. Comment Management
- View all comments
- Approve/Unapprove comments
- Delete comments
- Flag management

### 4. Chat Management
- View chat widget conversations
- Delete chat histories

### 5. Donation Management
- View all donations
- Toggle donation banner on/off
- See statistics (Total raised in INR/USD)
- View donor information

### 6. User Management (NEW) 🔥
- **View all users** with statistics
- **Promote users to admin** role
- **Demote admins to regular users**
- **Delete users** and their content
- **Create new admin accounts** from UI
- **Search and filter** users by role
- See user activity (blog count, comment count)

## User Management Guide

### Viewing Users

Navigate to **Admin Panel → Users** to see:
- List of all registered users
- User roles (Admin/User)
- Contact information
- Activity stats (blogs, comments)
- Join date

### Promoting Users to Admin

1. Go to **Users** page
2. Find the user you want to promote
3. Click the **↑** (promote) button
4. Confirm the action
5. User now has admin access

### Demoting Admins

1. Go to **Users** page
2. Find the admin you want to demote
3. Click the **↓** (demote) button
4. Confirm the action

**Note:** You cannot demote the last admin. At least one admin must exist.

### Deleting Users

1. Go to **Users** page
2. Click the **trash icon** on the user
3. Type `DELETE username` to confirm
4. All user content (blogs, comments) will be deleted

**Warning:** This action is permanent and cannot be undone!

### Creating Additional Admins

#### Method 1: From Admin Panel (Recommended)
1. Login to admin panel
2. Go to **Users** page
3. Click **Create Admin** button
4. Fill in the form:
   - Username
   - Full Name
   - Email
   - Password
5. Click **Create Admin**

#### Method 2: Using Command Line
```bash
cd server
node createAdmin.js
```

#### Method 3: Promote Existing User
1. User registers normally at `/register`
2. Admin logs in
3. Go to **Users** page
4. Find the user and click **Promote**

## Security Features

### 1. Database Authentication
- Admin credentials stored securely in MongoDB
- Passwords hashed with bcrypt (10 salt rounds)
- No plaintext passwords stored

### 2. Role-Based Access Control
- Middleware checks user role from database
- Admin-only routes protected with `adminAuth` middleware
- JWT tokens include role information

### 3. Safety Measures
- Cannot delete your own admin account
- Cannot demote the last admin
- Requires confirmation for destructive actions
- Session-based authentication with JWT

### 4. Audit Trail
- User creation timestamps
- Activity tracking (blog/comment counts)
- Role change history

## API Endpoints

### Admin Authentication
```
POST /api/admin/login
Body: { email, password }
```

### User Management (Admin Only)
```
GET    /api/admin/users              - Get all users
POST   /api/admin/promote-admin      - Promote user to admin
POST   /api/admin/demote-admin       - Demote admin to user
POST   /api/admin/delete-user        - Delete user account
POST   /api/admin/create-admin       - Create new admin user
```

## Database Schema

### User Model
```javascript
{
  username: String (unique),
  fullName: String,
  email: String (unique),
  password: String (hashed),
  phone: String (optional),
  alternateEmail: String (optional),
  bio: String (optional, max 200 chars),
  role: String (enum: ['user', 'admin'], default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### "No admin exists" Error
- Run `node createAdmin.js` to create your first admin
- Make sure MongoDB is connected
- Check that MONGODB_URI is correct in `.env`

### "Invalid Credentials" on Login
- Verify email and password are correct
- Ensure user has `role: 'admin'` in database
- Check database connection

### Cannot Access Admin Panel
- Make sure you're using admin credentials (not regular user)
- Clear browser cache and cookies
- Check if JWT_SECRET is set in `.env`

### "Admin access required" Error
- Your account role is 'user', not 'admin'
- Ask an existing admin to promote you
- Or use `createAdmin.js` to create new admin

## Migration from Old System

If you're upgrading from the old hardcoded admin system:

1. **Remove old env variables**:
   ```env
   # Delete these lines from server/.env
   ADMIN_EMAIL=...
   ADMIN_PASSWORD=...
   ```

2. **Create admin account in database**:
   ```bash
   cd server
   node createAdmin.js
   ```

3. **Use new credentials to login**:
   - Go to `/admin`
   - Use credentials created in step 2

4. **Restart server**:
   ```bash
   npm run dev
   ```

## Best Practices

### 1. Admin Account Security
- Use strong passwords (12+ characters)
- Include uppercase, lowercase, numbers, symbols
- Don't share admin credentials
- Change passwords regularly

### 2. Multi-Admin Setup
- Create at least 2 admin accounts for redundancy
- Use different email addresses
- Keep emergency admin account secure

### 3. User Management
- Review user list regularly
- Remove inactive/spam accounts
- Promote trusted users to admin only
- Always have at least 2 active admins

### 4. Backup
- Backup your database regularly
- Keep admin credentials in secure password manager
- Document admin account recovery process

## FAQ

**Q: Can I have multiple admins?**  
A: Yes! You can have unlimited admin accounts.

**Q: How do I reset admin password?**  
A: Use MongoDB directly or create new admin with `createAdmin.js` and demote old one.

**Q: Can regular users access admin panel?**  
A: No, only users with `role: 'admin'` can access admin features.

**Q: What happens if I delete all admins?**  
A: The system prevents deleting the last admin. You must have at least one.

**Q: Can I convert my old admin credentials?**  
A: No, run `createAdmin.js` to create a new database admin account.

**Q: Is the admin panel secure?**  
A: Yes, with JWT authentication, bcrypt password hashing, and role-based access control.

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Verify database connection
4. Ensure all environment variables are set

## Summary

✅ Remove hardcoded admin credentials from `.env`  
✅ Run `node createAdmin.js` to create first admin  
✅ Login at `/admin` with new credentials  
✅ Manage users from Admin Panel → Users  
✅ Create additional admins as needed  
✅ Keep credentials secure!  

Your admin panel is now properly secured with database authentication! 🎉
