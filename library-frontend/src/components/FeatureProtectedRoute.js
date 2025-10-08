import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FeatureProtectedRoute = ({ children, requiredFeature }) => {
  const { user, currentLibrary, isGodMode, loading } = useAuth();

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // God mode has access to everything
  if (isGodMode) {
    return children;
  }

  // Check if the required feature is enabled
  const isFeatureEnabled = !currentLibrary?.features || currentLibrary.features[requiredFeature] === true;
  
  if (!isFeatureEnabled) {
    // Redirect to dashboard if feature is disabled
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default FeatureProtectedRoute;
