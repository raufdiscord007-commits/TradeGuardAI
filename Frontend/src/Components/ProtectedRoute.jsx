import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute - Handles authentication and subscription-based access control
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if access is granted
 * @param {string} props.requiredTier - Minimum subscription tier required ('FREE', 'PRO', or 'API_PLAN')
 * @param {string} props.requiredPlan - Legacy prop, now uses requiredTier
 */
const ProtectedRoute = ({ children, requiredTier = null, requiredPlan = null }) => {
  const { loading, isAuthenticated, hasTier, subscription, user } = useAuth();
  const location = useLocation();

  // Use requiredTier or fall back to requiredPlan for backward compatibility
  const tierToCheck = requiredTier || requiredPlan;

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="main-wrapper" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--background-grey, #fafbfc)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-color--border-primary, #e5e5e7)',
            borderTop: '3px solid var(--base-color-brand--color-primary, #1e65fa)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <div className="text-size-medium text-color-secondary">Loading...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to login page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait for user data to be fully loaded before checking tier
  // This prevents false redirects when subscription data hasn't loaded yet
  if (tierToCheck && user && !user.subscription) {
    // User exists but subscription not loaded yet - show loading
    return (
      <div className="main-wrapper" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--background-grey, #fafbfc)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-color--border-primary, #e5e5e7)',
            borderTop: '3px solid var(--base-color-brand--color-primary, #1e65fa)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <div className="text-size-medium text-color-secondary">Verifying access...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Check subscription tier if required
  if (tierToCheck && !hasTier(tierToCheck)) {
    // Build appropriate message based on tier
    let message;
    if (tierToCheck === 'API_PLAN') {
      message = 'API Dashboard is available exclusively for API Plan subscribers';
    } else if (tierToCheck === 'PRO') {
      message = 'This feature requires a Pro Plan subscription';
    } else {
      message = `This feature requires a ${tierToCheck.replace('_', ' ')} subscription`;
    }
    
    // User doesn't have required tier - redirect to pricing with context
    return (
      <Navigate 
        to="/pricing" 
        state={{ 
          from: location, 
          requiredTier: tierToCheck,
          currentTier: subscription?.planTier || 'FREE',
          message
        }} 
        replace 
      />
    );
  }

  return children;
};

/**
 * RequireSubscription - HOC for subscription-gated routes
 * Usage: <RequireSubscription tier="PRO"><Component /></RequireSubscription>
 */
export const RequireSubscription = ({ tier, children }) => {
  return (
    <ProtectedRoute requiredTier={tier}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;
