import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Pricing from '../Components/Landing/Pricing';
import FAQ from '../Components/Landing/FAQ';
import Footer from '../Components/Landing/Footer';
import { useAuth } from '../contexts/AuthContext';
import subscriptionApi from '../services/subscriptionApi';

/**
 * PricingPage - Dedicated page for subscription pricing
 * Handles success/cancel redirects from Stripe and upgrade prompts
 */
const PricingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, refreshUser, subscription } = useAuth();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [newPlanTier, setNewPlanTier] = useState(null);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      setVerifying(true);
      // Verify the session and refresh user data
      const verifySession = async () => {
        try {
          const result = await subscriptionApi.verifyCheckoutSession(sessionId);
          
          // Store the new plan tier for display
          if (result?.subscription?.planTier) {
            setNewPlanTier(result.subscription.planTier);
          }
          
          await refreshUser();
          setShowSuccess(true);
          
          // Clean up URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          
          // If there was a return path (user tried to access protected page), redirect there
          if (location.state?.from?.pathname) {
            setTimeout(() => {
              navigate(location.state.from.pathname);
            }, 2000);
          }
        } catch (error) {
          console.error('Failed to verify session:', error);
        } finally {
          setVerifying(false);
        }
      };
      verifySession();
    } else if (canceled === 'true') {
      setShowCancel(true);
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, refreshUser, navigate, location.state]);

  // Handle upgrade prompt from ProtectedRoute redirect
  useEffect(() => {
    if (location.state?.requiredTier) {
      const { requiredTier, currentTier, message, from } = location.state;
      setUpgradeMessage({
        requiredTier,
        currentTier,
        message,
        returnPath: from?.pathname,
      });
    }
  }, [location.state]);

  // Auto-dismiss success message after 10 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Auto-dismiss cancel message after 5 seconds
  useEffect(() => {
    if (showCancel) {
      const timer = setTimeout(() => setShowCancel(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showCancel]);

  return (
    <div className="main-wrapper" style={{ backgroundColor: 'var(--background-grey, #fafbfc)' }}>
      {/* Navigation */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--border-color--border-primary, #e5e5e7)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <img 
            src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/696e0fa58c3ae9acbb14e78b_Favicon.png" 
            alt="TradeGuard AI"
            style={{ height: '28px' }}
          />
          <span style={{ 
            fontWeight: 600, 
            fontSize: '1.125rem', 
            color: 'var(--text-color--text-primary, #323539)' 
          }}>
            TradeGuard AI
          </span>
        </a>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated ? (
            <>
              {subscription?.planTier !== 'FREE' && (
                <button
                  onClick={async () => {
                    try {
                      await subscriptionApi.redirectToPortal();
                    } catch (err) {
                      console.error('Failed to open portal:', err);
                    }
                  }}
                  className="button is-secondary is-small w-button"
                >
                  Manage Subscription
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="button is-small w-button"
              >
                Dashboard
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="button is-text is-small w-button">
                Log In
              </a>
              <a href="/signup" className="button is-small w-button">
                Sign Up
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Verifying Overlay */}
      {verifying && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid var(--border-color--border-primary, #e5e5e7)',
              borderTop: '3px solid var(--base-color-brand--color-primary, #1e65fa)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <p className="text-size-medium" style={{ color: 'var(--text-color--text-primary)' }}>
              Verifying your subscription...
            </p>
          </div>
        </div>
      )}

      {/* Upgrade Message Banner */}
      {upgradeMessage && (
        <div style={{
          backgroundColor: upgradeMessage.requiredTier === 'API_PLAN' 
            ? 'var(--color-green, #26a69a)' 
            : 'var(--base-color-brand--color-primary, #1e65fa)',
          color: 'white',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}>
          {upgradeMessage.requiredTier === 'API_PLAN' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <span style={{ fontWeight: 500 }}>
            {upgradeMessage.message || `Upgrade to ${upgradeMessage.requiredTier.replace('_', ' ')} to access this feature`}
          </span>
          <button
            onClick={() => {
              setUpgradeMessage(null);
              navigate('/dashboard');
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Current Plan Badge (for authenticated users) */}
      {isAuthenticated && subscription && (
        <div style={{
          backgroundColor: 'white',
          borderBottom: '1px solid var(--border-color--border-primary, #e5e5e7)',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}>
          <span style={{ color: 'var(--text-color--text-secondary)', fontSize: '0.875rem' }}>
            Current plan:
          </span>
          <span style={{
            backgroundColor: subscription.planTier === 'FREE' 
              ? 'var(--background-grey, #fafbfc)'
              : subscription.planTier === 'PRO'
              ? 'rgba(30, 101, 250, 0.1)'
              : 'rgba(38, 166, 154, 0.1)',
            color: subscription.planTier === 'FREE'
              ? 'var(--text-color--text-secondary)'
              : subscription.planTier === 'PRO'
              ? 'var(--base-color-brand--color-primary, #1e65fa)'
              : 'var(--color-green, #26a69a)',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            {subscription.planTier.replace('_', ' ')}
          </span>
          {subscription.cancelAtPeriodEnd && (
            <span style={{
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              color: 'var(--color-red, #ef5350)',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}>
              Cancels {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Pricing Component */}
      <Pricing 
        showSuccessMessage={showSuccess} 
        showCancelMessage={showCancel}
      />

      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <Footer />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PricingPage;
