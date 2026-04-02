import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import subscriptionApi from '../../services/subscriptionApi';

const Pricing = ({ showSuccessMessage = false, showCancelMessage = false }) => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);
  const { isAuthenticated, subscription, hasTier } = useAuth();
  const navigate = useNavigate();

  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      features: [
        'Real-time cryptocurrency data',
        'Learning platform access',
        'Chart patterns library',
        'Basic portfolio tracking',
        'Community support',
      ],
      checkIcon: 'https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/696803193e6af155cfcc3ff2_check-mark.png',
      isPremium: false,
      buttonText: 'Get Started',
      tier: 'FREE',
    },
    {
      id: 'PRO',
      name: 'Pro',
      monthlyPrice: '$29',
      yearlyPrice: '$20',
      features: [
        'Everything in Free plan',
        'AI-powered predictions',
        'Confidence scores & analysis',
        'Advanced technical indicators',
        'Priority email support',
      ],
      checkIcon: 'https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/696803152c912b635ae364ae_check-mark%20(1).png',
      isPremium: true,
      buttonText: 'Upgrade to Pro',
      tier: 'PRO',
      popular: true,
    },
    {
      id: 'API_PLAN',
      name: 'API Access',
      monthlyPrice: '$99',
      yearlyPrice: '$79',
      features: [
        'Everything in Pro plan',
        'Full API access',
        'Custom integrations',
        'Rate limit: 10,000 req/day',
        'Dedicated support',
      ],
      checkIcon: 'https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/696803193e6af155cfcc3ff2_check-mark.png',
      isPremium: false,
      buttonText: 'Get API Access',
      tier: 'API_PLAN',
    },
  ];

  const handleSelectPlan = useCallback(async (plan) => {
    setError(null);
    
    // If not authenticated, redirect to signup
    if (!isAuthenticated) {
      navigate('/signup', { state: { selectedPlan: plan.tier } });
      return;
    }

    // If selecting FREE plan, just navigate to dashboard
    if (plan.tier === 'FREE') {
      navigate('/dashboard');
      return;
    }

    // If user already has this tier or higher, navigate to dashboard
    if (hasTier(plan.tier)) {
      navigate('/dashboard');
      return;
    }

    // Start checkout process
    try {
      setLoadingPlan(plan.id);
      const billingInterval = activeTab === 'yearly' ? 'yearly' : 'monthly';
      await subscriptionApi.redirectToCheckout(plan.tier, billingInterval);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setLoadingPlan(null);
    }
  }, [isAuthenticated, navigate, activeTab, hasTier]);

  const getButtonText = (plan) => {
    if (!isAuthenticated) {
      return plan.tier === 'FREE' ? 'Sign Up Free' : plan.buttonText;
    }
    
    const currentTier = subscription?.planTier || 'FREE';
    
    if (plan.tier === currentTier) {
      return 'Current Plan';
    }
    
    if (hasTier(plan.tier)) {
      return 'Included';
    }
    
    return plan.buttonText;
  };

  const isButtonDisabled = (plan) => {
    if (!isAuthenticated) return false;
    if (loadingPlan === plan.id) return true;
    
    const currentTier = subscription?.planTier || 'FREE';
    return plan.tier === currentTier || hasTier(plan.tier);
  };

  return (
    <div className="pricing_main_wrapper">
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-medium">
            <div className="pricing_wrap">
              {/* Success/Cancel Messages */}
              {showSuccessMessage && (
                <div style={{
                  backgroundColor: 'rgba(38, 166, 154, 0.1)',
                  border: '1px solid var(--color-green, #26a69a)',
                  borderRadius: '0.5rem',
                  padding: '1rem 1.5rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="var(--color-green, #26a69a)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ color: 'var(--color-green, #26a69a)', fontWeight: 500 }}>
                    🎉 Subscription activated successfully! You now have access to all premium features.
                  </span>
                </div>
              )}
              
              {showCancelMessage && (
                <div style={{
                  backgroundColor: 'rgba(239, 83, 80, 0.1)',
                  border: '1px solid var(--color-red, #ef5350)',
                  borderRadius: '0.5rem',
                  padding: '1rem 1.5rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="var(--color-red, #ef5350)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ color: 'var(--color-red, #ef5350)', fontWeight: 500 }}>
                    Checkout was canceled. No charges were made.
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{
                  backgroundColor: 'rgba(239, 83, 80, 0.1)',
                  border: '1px solid var(--color-red, #ef5350)',
                  borderRadius: '0.5rem',
                  padding: '1rem 1.5rem',
                  marginBottom: '2rem',
                }}>
                  <span style={{ color: 'var(--color-red, #ef5350)' }}>{error}</span>
                </div>
              )}

              <div className="pricing_heading-wrap">
                <h2 className="heading-style-h2">Choose Your Trading Advantage</h2>
                <p className="pricing_main_header_text text-size-medium text-color-secondary">
                  Unlock AI-powered cryptocurrency predictions with flexible plans designed for traders at every level
                </p>
              </div>
              <div className="pricing_tab-wrap">
                <div data-current="Tab 1" data-easing="ease" data-duration-in="300" data-duration-out="100" className="tabs-2 w-tabs">
                  <div className="tabs-menu-2 w-tab-menu">
                    <a
                      data-w-tab="Tab 1"
                      onClick={() => setActiveTab('monthly')}
                      className={`tab-link-tab-1-4 w-inline-block w-tab-link ${
                        activeTab === 'monthly' ? 'w--current' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>Monthly</div>
                    </a>
                    <a
                      data-w-tab="Tab 2"
                      onClick={() => setActiveTab('yearly')}
                      className={`tab-link-tab-2-2 w-inline-block w-tab-link ${
                        activeTab === 'yearly' ? 'w--current' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div>Yearly</div>
                      <span style={{
                        backgroundColor: 'var(--color-green, #26a69a)',
                        color: 'white',
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '0.25rem',
                        marginLeft: '0.5rem',
                        fontWeight: 600,
                      }}>
                        Save 20%
                      </span>
                    </a>
                  </div>
                  <div className="tabs-content w-tab-content">
                    <div data-w-tab="Tab 1" className={`w-tab-pane ${activeTab === 'monthly' ? 'w--tab-active' : ''}`}>
                      <div className="pricing_grid">
                        {plans.map((plan, index) => (
                          <div key={index} className={`pricing_card ${plan.isPremium ? 'mid' : ''}`} style={{ position: 'relative' }}>
                            {plan.popular && (
                              <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'var(--base-color-brand--color-primary, #1e65fa)',
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '1rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}>
                                Most Popular
                              </div>
                            )}
                            <div className={`pricing_card-title ${plan.isPremium ? 'mid' : ''}`}>
                              {plan.name}
                            </div>
                            <div className={`pricing_checklist ${plan.isPremium ? 'mid' : ''}`}>
                              {plan.features.map((feature, idx) => (
                                <div key={idx} className="pricing_checkitem">
                                  <img loading="lazy" src={plan.checkIcon} alt="" className="image-8" />
                                  <div className={`pricing_checktxt ${plan.isPremium ? 'mid' : ''}`}>
                                    {feature}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="pricing_bottom">
                              <div className={`pricing_charges ${plan.isPremium ? 'mid' : ''}`}>
                                <span className={`text-span ${plan.isPremium ? 'mid' : ''}`}>{plan.monthlyPrice}</span>
                                /month
                              </div>
                              <button
                                onClick={() => handleSelectPlan(plan)}
                                disabled={isButtonDisabled(plan)}
                                className={`button is-small ${
                                  plan.isPremium ? 'is-white' : 'is-secondary'
                                } w-button`}
                                style={{
                                  cursor: isButtonDisabled(plan) ? 'not-allowed' : 'pointer',
                                  opacity: isButtonDisabled(plan) ? 0.6 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem',
                                  width: '100%',
                                }}
                              >
                                {loadingPlan === plan.id ? (
                                  <>
                                    <span className="loading-spinner-small" style={{
                                      width: '16px',
                                      height: '16px',
                                      border: '2px solid rgba(255,255,255,0.3)',
                                      borderTop: '2px solid white',
                                      borderRadius: '50%',
                                      animation: 'spin 1s linear infinite',
                                    }} />
                                    Processing...
                                  </>
                                ) : (
                                  getButtonText(plan)
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div data-w-tab="Tab 2" className={`w-tab-pane ${activeTab === 'yearly' ? 'w--tab-active' : ''}`}>
                      <div className="pricing_grid">
                        {plans.map((plan, index) => (
                          <div key={index} className={`pricing_card ${plan.isPremium ? 'mid' : ''}`} style={{ position: 'relative' }}>
                            {plan.popular && (
                              <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'var(--base-color-brand--color-primary, #1e65fa)',
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '1rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}>
                                Most Popular
                              </div>
                            )}
                            <div className={`pricing_card-title ${plan.isPremium ? 'mid' : ''}`}>
                              {plan.name}
                            </div>
                            <div className={`pricing_checklist ${plan.isPremium ? 'mid' : ''}`}>
                              {plan.features.map((feature, idx) => (
                                <div key={idx} className="pricing_checkitem">
                                  <img loading="lazy" src={plan.checkIcon} alt="" className="image-8" />
                                  <div className={`pricing_checktxt ${plan.isPremium ? 'mid' : ''}`}>
                                    {feature}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="pricing_bottom">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div className={`pricing_charges ${plan.isPremium ? 'mid' : ''}`}>
                                  <span className={`text-span ${plan.isPremium ? 'mid' : ''}`}>{plan.yearlyPrice}</span>
                                  /month
                                </div>
                                {plan.tier !== 'FREE' && (
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: plan.isPremium ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-color--text-secondary)', 
                                    fontWeight: 500 
                                  }}>
                                    Save 20% with yearly billing
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleSelectPlan(plan)}
                                disabled={isButtonDisabled(plan)}
                                className={`button is-small ${
                                  plan.isPremium ? 'is-white' : 'is-secondary'
                                } w-button`}
                                style={{
                                  cursor: isButtonDisabled(plan) ? 'not-allowed' : 'pointer',
                                  opacity: isButtonDisabled(plan) ? 0.6 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem',
                                  width: '100%',
                                }}
                              >
                                {loadingPlan === plan.id ? (
                                  <>
                                    <span className="loading-spinner-small" style={{
                                      width: '16px',
                                      height: '16px',
                                      border: '2px solid rgba(255,255,255,0.3)',
                                      borderTop: '2px solid white',
                                      borderRadius: '50%',
                                      animation: 'spin 1s linear infinite',
                                    }} />
                                    Processing...
                                  </>
                                ) : (
                                  getButtonText(plan)
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust indicators */}
              <div style={{
                textAlign: 'center',
                color: 'var(--text-color--text-secondary)',
                fontSize: '0.875rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Secure payment via Stripe
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Cancel anytime
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 10H21M7 15H8M12 15H13M6 19H18C19.1046 19 20 18.1046 20 17V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V17C4 18.1046 4.89543 19 6 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    No hidden fees
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Pricing;
