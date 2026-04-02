import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute, { RequireSubscription } from './Components/ProtectedRoute';
import AdminRoute from './Components/AdminRoute';
import './css/normalize.css';
import './css/tradeguard-ai.webflow.css';
import './css/webflow.css';
import Portfolio from './pages/Portfolio';


// Lazy load page components - only loaded when route is accessed
const DashboardApp = lazy(() => import('./pages/DashboardApp'));
const PredictionsPage = lazy(() => import('./pages/PredictionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ApiDashboardPage = lazy(() => import('./pages/ApiDashboardPage'));
const LandingPage = lazy(() => import('./Components/Landing').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage'));

// Resources pages - lazy loaded
const LearningPlatformPage = lazy(() => import('./pages/LearningPlatformPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const ChartPatternsPage = lazy(() => import('./pages/ChartPatternsPage'));
const PatternDetailPage = lazy(() => import('./pages/PatternDetailPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));

// Admin pages - lazy loaded
const AdminDashboardPage = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminDashboardPage })));
const UserManagementPage = lazy(() => import('./pages/admin').then(m => ({ default: m.UserManagementPage })));
const ContentManagementPage = lazy(() => import('./pages/admin').then(m => ({ default: m.ContentManagementPage })));
const ArticleFormPage = lazy(() => import('./pages/admin').then(m => ({ default: m.ArticleFormPage })));
const PatternFormPage = lazy(() => import('./pages/admin').then(m => ({ default: m.PatternFormPage })));
const AuditLogsPage = lazy(() => import('./pages/admin').then(m => ({ default: m.AuditLogsPage })));

// Loading fallback component for Suspense
const PageLoader = () => (
  <div className="main-wrapper is-dashboard" style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh',
    backgroundColor: 'var(--background-primary)'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--border-primary)',
        borderTopColor: 'var(--color-brand)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading...</span>
    </div>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<GoogleCallbackPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          
          {/* Protected Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardApp />
              </ProtectedRoute>
            }
          />
          {/* Cryptocurrency pages */}
          <Route
            path="/cryptocurrency"
            element={
              <ProtectedRoute>
                <DashboardApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cryptocurrency/:coinName"
            element={
              <ProtectedRoute>
                <DashboardApp />
              </ProtectedRoute>
            }
          />
          {/* Predictions page - Requires PRO subscription */}
          <Route
            path="/predictions"
            element={
              <RequireSubscription tier="PRO">
                <PredictionsPage />
              </RequireSubscription>
            }
          />
          <Route
            path="/predictions/:coinId"
            element={
              <RequireSubscription tier="PRO">
                <PredictionsPage />
              </RequireSubscription>
            }
          />
          {/* API Dashboard - Requires API_PLAN subscription */}
          <Route
            path="/api-dashboard"
            element={
              <RequireSubscription tier="API_PLAN">
                <ApiDashboardPage />
              </RequireSubscription>
            }
          />
          {/* Profile page */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          
          {/* Resources - Learning Platform */}
          <Route
            path="/resources/learning"
            element={
              <ProtectedRoute>
                <LearningPlatformPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources/learning/:slug"
            element={
              <ProtectedRoute>
                <ArticleDetailPage />
              </ProtectedRoute>
            }
          />
          
          {/* Resources - Chart Patterns */}
          <Route
            path="/resources/patterns"
            element={
              <ProtectedRoute>
                <ChartPatternsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources/patterns/:slug"
            element={
              <ProtectedRoute>
                <PatternDetailPage />
              </ProtectedRoute>
            }
          />
          
          {/* Resources - Search */}
          <Route
            path="/resources/search"
            element={
              <ProtectedRoute>
                <SearchResultsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Resources - Bookmarks */}
          <Route
            path="/resources/bookmarks"
            element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <AdminRoute>
                <ContentManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/content/articles/new"
            element={
              <AdminRoute>
                <ArticleFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/content/articles/:id/edit"
            element={
              <AdminRoute>
                <ArticleFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/content/patterns/new"
            element={
              <AdminRoute>
                <PatternFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/content/patterns/:id/edit"
            element={
              <AdminRoute>
                <PatternFormPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <AuditLogsPage />
              </AdminRoute>
            }
          />
          
          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}
