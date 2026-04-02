import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Google OAuth Callback Page
 * Handles the redirect from Google OAuth with tokens in URL params
 */
const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      // Check for error in URL
      const urlError = searchParams.get('error');
      if (urlError) {
        setError(urlError);
        setProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Process the OAuth callback
      const result = await handleOAuthCallback(searchParams);
      
      if (result.success) {
        // Redirect to dashboard on success
        navigate('/app', { replace: true });
      } else {
        setError(result.error || 'Authentication failed');
        setProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background-grey, #fafbfc)' }}>
      <div className="card_app_wrapper" style={{ maxWidth: '480px', padding: '3rem', textAlign: 'center' }}>
        {processing ? (
          <>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 1.5rem',
              border: '3px solid var(--border-color--border-primary, #e5e5e7)',
              borderTopColor: 'var(--base-color-brand--color-primary, #1e65fa)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}></div>
            <h2 className="heading-style-h3" style={{ marginBottom: '0.5rem' }}>
              Completing sign in...
            </h2>
            <p className="text-size-regular text-color-secondary">
              Please wait while we verify your account.
            </p>
          </>
        ) : error ? (
          <>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg 
                width="32" 
                height="32" 
                fill="none" 
                stroke="var(--color-red, #ef5350)" 
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </div>
            <h2 className="heading-style-h3" style={{ marginBottom: '0.5rem', color: 'var(--color-red, #ef5350)' }}>
              Authentication Failed
            </h2>
            <p className="text-size-regular text-color-red" style={{ marginBottom: '1rem' }}>
              {error}
            </p>
            <p className="text-size-small text-color-secondary">
              Redirecting to login page...
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
