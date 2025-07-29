import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'manager':
      return <Navigate to="/users" replace />;
    case 'student':
      return <Navigate to="/profile" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default RoleBasedRedirect; 