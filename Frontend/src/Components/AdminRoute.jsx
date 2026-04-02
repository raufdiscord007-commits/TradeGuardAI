/**
 * AdminRoute Component
 * Protected route wrapper that checks for admin access
 * Redirects non-admins to access denied page
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Access Denied component for non-admins
const AccessDenied = () => (
  <div className="page-wrapper" style={{ minHeight: '100vh' }}>
    <div className="main-wrapper">
      <section className="main_form_wrapper" style={{ minHeight: '100vh' }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="padding-section-large">
              <div className="main_form_component is-flex">
                <div className="main_form is-large">
                  <div className="upgrade_top-wrap">
                    <svg 
                      width="64" 
                      height="64" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#ef5350" 
                      strokeWidth="1.5"
                      style={{ marginBottom: '1rem' }}
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M4.93 4.93l14.14 14.14"></path>
                    </svg>
                    <div className="upgrade_title-wrap">
                      <h1 className="text-size-medium">Access Denied</h1>
                      <div className="text-size-small text-color-secondary text-align-center">
                        You don't have permission to access the admin panel.
                        <br />
                        Please contact an administrator if you believe this is an error.
                      </div>
                    </div>
                  </div>
                  <div className="upgrade_form-block w-form">
                    <div className="upgrade_checkitem-wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="upgrade_checkitem">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <div className="upgrade_checklist-txt" style={{ color: '#858c95' }}>Admin privileges required</div>
                      </div>
                      <div className="upgrade_checkitem">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <div className="upgrade_checklist-txt" style={{ color: '#858c95' }}>Access to admin dashboard</div>
                      </div>
                      <div className="upgrade_checkitem">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <div className="upgrade_checklist-txt" style={{ color: '#858c95' }}>User management tools</div>
                      </div>
                      <div className="upgrade_checkitem">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <div className="upgrade_checklist-txt" style={{ color: '#858c95' }}>Content management</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <a href="/app" className="button is-secondary w-button" style={{ flex: 1 }}>
                        Go to Dashboard
                      </a>
                      <a href="/" className="button w-button" style={{ flex: 1 }}>
                        Go Home
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="form_main_image_wrapper" style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', zIndex: 1 }}>
          <img 
            src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/6936fdd48b68a024e65f6fa0_Page%201.jpg" 
            loading="lazy" 
            alt="Access Denied" 
            className="form_main_image"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="form_main_blur" style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', zIndex: 2 }}></div>
      </section>
    </div>
  </div>
);

// Loading spinner while checking auth
const LoadingSpinner = () => (
  <div className="admin-loading">
    <div className="admin-loading-spinner"></div>
    <p>Verifying admin access...</p>

    <style>{`
      .admin-loading {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        background: #fafbfc;
      }
      
      .admin-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e5e7;
        border-top-color: #1e65fa;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .admin-loading p {
        color: #858c95;
        font-size: 0.875rem;
      }
    `}</style>
  </div>
);

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show access denied if not an admin
  if (!isAdmin) {
    return <AccessDenied />;
  }

  // Render admin content if authorized
  return children;
}
