import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CustomizationProvider } from './contexts/CustomizationContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import Favorites from './components/Favorites';
import UploadDocument from './components/UploadDocument';
import ManageUsers from './components/ManageUsers';
import Categories from './components/Categories';
import ManageNotices from './components/ManageNotices';
import Notices from './components/Notices';
import Customization from './components/Customization';
import Accessibility from './components/Accessibility';
import StudentProfile from './components/StudentProfile';
import FeeManagement from './components/FeeManagement';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import LandingPage from './components/LandingPage';
import ManageAnnouncements from './components/ManageAnnouncements';
import ManageGallery from './components/ManageGallery';
import ManageThoughts from './components/ManageThoughts';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CustomizationProvider>
        <AccessibilityProvider>
          <Router>
            <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Documents />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Favorites />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/notices-tab"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Notices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Only Routes */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <UploadDocument />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOrManagerOnly>
                  <Layout>
                    <ManageUsers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/categories"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <Categories />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/notices"
              element={
                <ProtectedRoute adminOrManagerOnly>
                  <Layout>
                    <ManageNotices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/customization"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <Customization />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/thoughts"
              element={
                <ProtectedRoute adminOrManagerOnly>
                  <Layout>
                    <ManageThoughts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/announcements"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <ManageAnnouncements />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/gallery"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <ManageGallery />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/accessibility"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Accessibility />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute studentOnly>
                  <Layout>
                    <StudentProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/fees"
              element={
                <ProtectedRoute adminOrManagerOnly>
                  <Layout>
                    <FeeManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Backward compatibility redirect */}
            <Route path="/students" element={<Navigate to="/users" replace />} />
            
            {/* Default redirect */}
            <Route path="/" element={<LandingPage />} />
            
            {/* 404 Route */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
                    <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
        </AccessibilityProvider>
      </CustomizationProvider>
    </AuthProvider>
  );
}

export default App; 