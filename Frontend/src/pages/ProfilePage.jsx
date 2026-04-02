import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../Components/Dashboard Pages/Navbar';
import Sidebar from '../Components/Dashboard Pages/Sidebar';
import { ChangePasswordModal, DeleteAccountModal, SetPasswordModal } from '../Components/Profile';
import ProfileCTA from '../Components/Profile/ProfileCTA';
import subscriptionApi from '../services/subscriptionApi';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { member, updateMemberInfo, linkGoogleAccount, subscription, hasTier } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Debug: Log subscription data
  React.useEffect(() => {
    console.log('ProfilePage - Current subscription:', subscription);
  }, [subscription]);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Link Google state
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [firstName, setFirstName] = useState(member?.customFields?.['first-name'] || '');
  const [lastName, setLastName] = useState(member?.customFields?.['last-name'] || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Subscription states
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);

  // Auth state checks
  const hasPassword = member?.hasPassword;
  const hasGoogleLinked = member?.hasGoogleLinked;

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarNavigate = (path) => {
    navigate(path);
  };

  const handleSaveName = async () => {
    setNameLoading(true);
    try {
      const result = await updateMemberInfo({ 
        'first-name': firstName,
        'last-name': lastName 
      });
      if (result.success) {
        setNameSuccess(true);
        setIsEditingName(false);
        setTimeout(() => setNameSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setNameLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      await linkGoogleAccount();
      // This will redirect to Google OAuth
    } catch (err) {
      console.error('Failed to link Google:', err);
      setLinkingGoogle(false);
    }
  };

  const userEmail = member?.auth?.email || 'No email';
  const userFirstName = member?.customFields?.['first-name'] || '';
  const userLastName = member?.customFields?.['last-name'] || '';
  const userFullName = `${userFirstName} ${userLastName}`.trim() || 'Not set';

  // Determine login methods display
  const getLoginMethods = () => {
    const methods = [];
    if (hasPassword) methods.push('Email & Password');
    if (hasGoogleLinked) methods.push('Google');
    return methods.length > 0 ? methods.join(' + ') : 'None';
  };

  // Handle redirect to pricing page
  const handleViewPricing = () => {
    navigate('/pricing');
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    setSubscriptionError(null);
    
    try {
      await subscriptionApi.redirectToPortal();
      // Redirect happens in the function above
    } catch (err) {
      console.error('Failed to access billing portal:', err);
      setSubscriptionError(err.message || 'Failed to access billing portal. Please try again.');
      setManagingSubscription(false);
    }
  };

  const getPlanName = (tier) => {
    const names = {
      'FREE': 'Free',
      'PRO': 'Pro',
      'API_PLAN': 'API Access'
    };
    return names[tier] || 'Free';
  };
  
  // Get current plan tier with proper default
  const currentPlanTier = subscription?.planTier || 'FREE';

  const getPlanColor = (tier) => {
    const colors = {
      'FREE': '#6b7280',
      'PRO': '#1e65fa',
      'API_PLAN': '#f59e0b'
    };
    return colors[tier] || '#6b7280';
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return { text: 'Unknown', color: '#6b7280' };
    
    const statusMap = {
      'ACTIVE': { text: 'Active', color: '#26a69a' },
      'PAST_DUE': { text: 'Past Due', color: '#f59e0b' },
      'CANCELED': { text: 'Canceled', color: '#ef5350' },
      'TRIALING': { text: 'Trial', color: '#3b82f6' },
      'INCOMPLETE': { text: 'Incomplete', color: '#858c95' }
    };
    
    return statusMap[subscription.status] || { text: subscription.status, color: '#6b7280' };
  };

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar isOpen={isSidebarOpen} onNavigate={handleSidebarNavigate} activePage="profile" />
        <div className="dashboard_main_wrapper">
          <Navbar onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
          <div className="dashboard_main_content">
            <div className="dashboard_main_app">
            {/* Page Header */}
            <div>
              <h1 className="text-size-xlarge text-weight-semibold" style={{ marginBottom: '0.5rem' }}>
                Profile Settings
              </h1>
              <p className="text-size-regular text-color-secondary">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Profile Content */}
            <div className="profile-content">
              
              {/* Personal Information Section */}
              <div className="card_app_wrapper profile-card">
                <div className="card_app_header">
                  <h2 className="text-size-large text-weight-semibold">Personal Information</h2>
                </div>
                <div className="profile-card-body">
                  {/* Full Name */}
                  <div className="profile-row">
                    <div className="profile-row-content">
                      <div className="text-size-medium text-weight-medium profile-label">
                        Full Name
                      </div>
                      {isEditingName ? (
                        <div className="profile-edit-form">
                          <div className="profile-name-inputs">
                            <input
                              type="text"
                              className="main_form_input w-input"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="First name"
                            />
                            <input
                              type="text"
                              className="main_form_input w-input"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Last name"
                            />
                          </div>
                          <div className="profile-edit-actions">
                            <button 
                              onClick={handleSaveName}
                              className="button is-small"
                              disabled={nameLoading}
                            >
                              {nameLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button 
                              onClick={() => {
                                setIsEditingName(false);
                                setFirstName(member?.customFields?.['first-name'] || '');
                                setLastName(member?.customFields?.['last-name'] || '');
                              }}
                              className="button is-secondary is-small"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="profile-value-row">
                          <span className="text-size-regular text-color-secondary">{userFullName}</span>
                          {nameSuccess && (
                            <span className="text-size-small" style={{ color: '#26a69a' }}>✓ Saved</span>
                          )}
                        </div>
                      )}
                    </div>
                    {!isEditingName && (
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="button is-secondary is-small"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Section */}
              <div className="card_app_wrapper profile-card">
                <div className="card_app_header">
                  <h2 className="text-size-large text-weight-semibold">Subscription & Billing</h2>
                </div>
                <div className="profile-card-body">
                  {/* Current Plan */}
                  <div className="profile-subscription-current">
                    <div className="profile-subscription-badge-wrapper">
                      <div 
                        className="profile-subscription-badge"
                        style={{ 
                          background: `${getPlanColor(currentPlanTier)}15`,
                          borderColor: `${getPlanColor(currentPlanTier)}40`
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: getPlanColor(currentPlanTier) }}>
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                          <path d="M2 12l10 5 10-5" />
                        </svg>
                        <span style={{ color: getPlanColor(currentPlanTier), fontWeight: 600 }}>
                          {getPlanName(currentPlanTier)} Plan
                        </span>
                      </div>
                      <div 
                        className="profile-status-badge"
                        style={{ 
                          background: `${getSubscriptionStatus().color}15`,
                          color: getSubscriptionStatus().color,
                          borderColor: `${getSubscriptionStatus().color}40`
                        }}
                      >
                        {getSubscriptionStatus().text}
                      </div>
                    </div>

                    {currentPlanTier === 'FREE' && (
                      <p className="text-size-regular text-color-secondary" style={{ marginTop: '1rem' }}>
                        Upgrade to unlock advanced features and AI-powered predictions.
                      </p>
                    )}

                    {currentPlanTier !== 'FREE' && subscription?.currentPeriodEnd && (
                      <div className="profile-subscription-info">
                        <div className="profile-info-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span className="text-size-small text-color-secondary">
                            {subscription?.cancelAtPeriodEnd 
                              ? `Ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                              : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Display */}
                  {subscriptionError && (
                    <div className="profile-error-message">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      <span>{subscriptionError}</span>
                    </div>
                  )}

                  {/* Manage Subscription (for paid plans) */}
                  {currentPlanTier !== 'FREE' && (
                    <div className="profile-subscription-actions">
                      <button 
                        onClick={handleManageSubscription}
                        className="button is-secondary is-small"
                        disabled={managingSubscription}
                      >
                        {managingSubscription ? 'Opening...' : 'Manage Billing'}
                      </button>
                    </div>
                  )}

                  {/* Upgrade Options */}
                  {currentPlanTier === 'FREE' && (
                    <div className="profile-subscription-upgrade" style={{ marginTop: '1.5rem' }}>
                      <div className="profile-upgrade-banner">
                        <div className="profile-upgrade-content">
                          <h3 className="text-size-medium text-weight-semibold">Upgrade Your Plan</h3>
                          <p className="text-size-small text-color-secondary">
                            Unlock AI-powered predictions, advanced features, and more with our premium plans.
                          </p>
                        </div>
                        <button 
                          onClick={handleViewPricing}
                          className="button"
                        >
                          View Plans & Pricing
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upgrade Options for Pro users */}
                  {currentPlanTier === 'PRO' && (
                    <div className="profile-subscription-upgrade">
                      <div className="profile-upgrade-banner">
                        <div className="profile-upgrade-content">
                          <h3 className="text-size-medium text-weight-semibold">Need API Access?</h3>
                          <p className="text-size-small text-color-secondary">
                            Upgrade to API Access for full programmatic access and custom integrations.
                          </p>
                        </div>
                        <button 
                          onClick={handleViewPricing}
                          className="button is-small"
                        >
                          View Plans & Pricing
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Login and Security Section */}
              <div className="card_app_wrapper profile-card">
                <div className="card_app_header">
                  <h2 className="text-size-large text-weight-semibold">Connected Accounts</h2>
                </div>
                <div className="profile-card-body profi no-padding">
                  {/* Google Account - Only show for email/password users who haven't connected Google */}
                  {!hasGoogleLinked && hasPassword && (
                    <div className="profile-row with-border profile-card-body">
                      <div className="profile-provider-info">
                        {/* Google Icon */}
                        <div className="profile-provider-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-size-medium text-weight-medium profile-label">
                            Google
                          </div>
                          <div className="text-size-small text-color-secondary">
                            Connect to enable Google sign-in
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleLinkGoogle}
                        className="button is-secondary is-small"
                        disabled={linkingGoogle}
                      >
                        {linkingGoogle ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  )}

                  {/* Email & Password */}
                  <div className="profile-card-body profile-row">
                    <div className="profile-provider-info">
                      {/* Password Icon */}
                      <div className="profile-provider-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-size-medium text-weight-medium profile-label">
                          Email & Password
                        </div>
                        <div className="text-size-small text-color-secondary">
                          {hasPassword ? 'Manage your password' : 'Set a password to enable email sign-in'}
                        </div>
                      </div>
                    </div>
                    {hasPassword ? (
                      <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="button is-secondary is-small"
                      >
                        Change Password
                      </button>
                    ) : (
                      <button 
                        onClick={() => setShowSetPasswordModal(true)}
                        className="button is-secondary is-small"
                      >
                        Set Password
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Danger Zone Section */}
              <div className="card_app_wrapper profile-card">
                <div className="card_app_header">
                  <h2 className="text-size-large text-weight-semibold" style={{ color: '#ef5350' }}>Danger Zone</h2>
                </div>
                <div className="profile-row">
                  {/* Delete Account */}
                  <div className="profile-card-body profile-row profile-row--danger">
                    <div className="profile-row-content">
                      <div className="text-size-medium text-weight-medium profile-label">
                        Delete Account
                      </div>
                      <div className="text-size-regular text-color-secondary">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="button is-small profile-btn-danger"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Info Section */}
              <div className="card_app_wrapper profile-card">
                <div className="card_app_header">
                  <h2 className="text-size-large text-weight-semibold">Account Information</h2>
                </div>
                <div className="profile-card-body">
                  <div className="profile-info-grid">
                    <div>
                      <div className="text-size-small text-color-secondary profile-label">
                        Email Address
                      </div>
                      <div className="text-size-regular text-weight-medium">
                        {userEmail}
                      </div>
                    </div>
                    <div>
                      <div className="text-size-small text-color-secondary profile-label">
                        Login Methods
                      </div>
                      <div className="text-size-regular text-weight-medium">
                        {getLoginMethods()}
                      </div>
                    </div>
                    <div>
                      <div className="text-size-small text-color-secondary profile-label">
                        Member ID
                      </div>
                      <div className="text-size-regular text-weight-medium profile-member-id">
                        {member?.id || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-size-small text-color-secondary profile-label">
                        Account Status
                      </div>
                      <div className="profile-status">
                        <div className="profile-status-dot" />
                        <span className="text-size-regular text-weight-medium profile-status-text">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            <ProfileCTA />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
      <SetPasswordModal 
        isOpen={showSetPasswordModal} 
        onClose={() => setShowSetPasswordModal(false)} 
      />
      <DeleteAccountModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />
    </div>
  );
}
