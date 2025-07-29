const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = {};

authMiddleware.verifyToken = async (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to check current status
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // Check if account is expired
    if (user.terminationDate) {
      const currentDate = new Date();
      const terminationDate = new Date(user.terminationDate);
      
      // Set time to end of day for termination date comparison
      terminationDate.setHours(23, 59, 59, 999);
      
      if (currentDate > terminationDate) {
        return res.status(403).json({ 
          message: 'Account has expired. Please contact an administrator to extend your access.',
          expired: true,
          terminationDate: user.terminationDate
        });
      }
    }

    req.user = { ...decoded, terminationDate: user.terminationDate };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

authMiddleware.adminOnly = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Access denied. Admins only.' });
};

authMiddleware.superAdminOnly = (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Access denied. Superadmins only.' });
};

authMiddleware.adminOrManagerOnly = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'manager') return next();
  return res.status(403).json({ message: 'Access denied. Admins or managers only.' });
};

authMiddleware.managerOnly = (req, res, next) => {
  if (req.user.role === 'manager' || req.user.role === 'admin' || req.user.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Access denied. Managers or admins only.' });
};

module.exports = authMiddleware;