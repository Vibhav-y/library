import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CustomizationProvider } from './contexts/CustomizationContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ChatProvider } from './contexts/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import FeatureProtectedRoute from './components/FeatureProtectedRoute';
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
import LandingPage from './components/LandingPage';
import ManageAnnouncements from './components/ManageAnnouncements';
import ManageThoughts from './components/ManageThoughts';
import Chat from './components/Chat';
import ChatMonitoring from './components/ChatMonitoring';
import GodAdminLogin from './components/GodAdminLogin';
import GodAdminDashboard from './components/GodAdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CustomizationProvider>
        <AccessibilityProvider>
          <ChatProvider>
            <Router>
              <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              {/* Master Admin routes (separate entry) */}
              <Route path="/master-admin-login" element={<GodAdminLogin />} />
              <Route
                path="/master-admin"
                element={
                  <ProtectedRoute godOnly>
                    <GodAdminDashboard />
                  </ProtectedRoute>
                }
              />
              
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
                    <FeatureProtectedRoute requiredFeature="documentUploadsEnabled">
                      <Layout>
                        <Documents />
                      </Layout>
                    </FeatureProtectedRoute>
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
                    <FeatureProtectedRoute requiredFeature="documentUploadsEnabled">
                      <Layout>
                        <UploadDocument />
                      </Layout>
                    </FeatureProtectedRoute>
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
                    <FeatureProtectedRoute requiredFeature="documentUploadsEnabled">
                      <Layout>
                        <Categories />
                      </Layout>
                    </FeatureProtectedRoute>
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
                path="/chat"
                element={
                  <ProtectedRoute>
                    <FeatureProtectedRoute requiredFeature="chatEnabled">
                      <Layout>
                        <Chat />
                      </Layout>
                    </FeatureProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat-monitoring"
                element={
                  <ProtectedRoute godOnly>
                    <Layout>
                      <ChatMonitoring />
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
        </ChatProvider>
      </AccessibilityProvider>
    </CustomizationProvider>
  </AuthProvider>
  );
}

export default App; 