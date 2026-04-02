import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../Components/Dashboard Pages/Navbar';
import Sidebar from '../Components/Dashboard Pages/Sidebar';

/**
 * ApiDashboardPage - Mockup UI for API Access tier subscribers
 * This is a frontend-only mockup. Actual API backend logic is NOT implemented.
 * Note: Access control is handled by RequireSubscription wrapper in App.jsx
 */
const ApiDashboardPage = () => {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarNavigate = (path) => {
    navigate(path);
  };
  
  // Mock state for API key management
  const [apiKey, setApiKey] = useState('tg_live_sk_1234567890abcdef');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Mock usage data
  const mockUsageData = {
    today: 1247,
    thisMonth: 28543,
    dailyLimit: 10000,
    monthlyLimit: 300000,
    lastRequest: '2 minutes ago',
  };

  // Mock recent requests
  const mockRecentRequests = [
    { endpoint: '/api/v1/predictions/btc', status: 200, time: '2 min ago', latency: '124ms' },
    { endpoint: '/api/v1/market/summary', status: 200, time: '5 min ago', latency: '89ms' },
    { endpoint: '/api/v1/crypto/eth', status: 200, time: '12 min ago', latency: '156ms' },
    { endpoint: '/api/v1/predictions/sol', status: 429, time: '15 min ago', latency: '23ms' },
    { endpoint: '/api/v1/market/fear-greed', status: 200, time: '22 min ago', latency: '67ms' },
  ];

  const handleCopyKey = useCallback(() => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [apiKey]);

  const handleRegenerateKey = useCallback(() => {
    setRegenerating(true);
    // Simulate API call
    setTimeout(() => {
      const newKey = 'tg_live_sk_' + Math.random().toString(36).substring(2, 18);
      setApiKey(newKey);
      setRegenerating(false);
    }, 1500);
  }, []);

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar isOpen={isSidebarOpen} onNavigate={handleSidebarNavigate} activePage="api-dashboard" />
        <div className="dashboard_main_wrapper">
          <Navbar onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
          <div className="dashboard_main_app">
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 className="text-size-xlarge text-weight-semibold" style={{ margin: 0 }}>API Dashboard</h1>
                <span style={{
                  backgroundColor: 'rgba(38, 166, 154, 0.1)',
                  color: 'var(--color-green, #26a69a)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  API Plan Active
                </span>
              </div>
              <p className="text-size-regular text-color-secondary">
                Manage your API keys, monitor usage, and access documentation.
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}>
              <StatCard 
                title="Today's Requests"
                value={mockUsageData.today.toLocaleString()}
                subtitle={`/ ${mockUsageData.dailyLimit.toLocaleString()} daily limit`}
                progress={(mockUsageData.today / mockUsageData.dailyLimit) * 100}
              />
              <StatCard 
                title="This Month"
                value={mockUsageData.thisMonth.toLocaleString()}
                subtitle={`/ ${mockUsageData.monthlyLimit.toLocaleString()} monthly`}
                progress={(mockUsageData.thisMonth / mockUsageData.monthlyLimit) * 100}
              />
              <StatCard 
                title="Last Request"
                value={mockUsageData.lastRequest}
                subtitle="All systems operational"
                status="success"
              />
              <StatCard 
                title="Rate Limit"
                value="10,000"
                subtitle="requests per day"
              />
            </div>

            {/* Main Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
            }}>
              {/* API Key Section */}
              <div className="card_app_wrapper" style={{ padding: '1.5rem' }}>
                <h3 className="heading-style-h4" style={{ marginBottom: '1rem' }}>API Key</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="text-size-small text-color-secondary" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Your API Key (keep this secret!)
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      flex: 1,
                      backgroundColor: 'var(--background-grey, #fafbfc)',
                      border: '1px solid var(--border-color--border-primary, #e5e5e7)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: 'var(--text-color--text-primary)',
                    }}>
                      {showKey ? apiKey : '•'.repeat(apiKey.length)}
                    </div>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="button is-secondary is-small w-button"
                      style={{ minWidth: '80px' }}
                    >
                      {showKey ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={handleCopyKey}
                      className="button is-secondary is-small w-button"
                      style={{ minWidth: '80px' }}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(239, 83, 80, 0.05)',
                  border: '1px solid rgba(239, 83, 80, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9V13M12 17H12.01M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="var(--color-red, #ef5350)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <p className="text-size-small" style={{ fontWeight: 500, marginBottom: '0.25rem', color: 'var(--color-red, #ef5350)' }}>
                        Keep your API key secure
                      </p>
                      <p className="text-size-small text-color-secondary">
                        Never share your API key or commit it to version control. Use environment variables.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRegenerateKey}
                  disabled={regenerating}
                  className="button is-secondary is-small w-button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: regenerating ? 0.6 : 1,
                    cursor: regenerating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {regenerating ? (
                    <>
                      <span style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid var(--border-color--border-primary)',
                        borderTop: '2px solid var(--base-color-brand--color-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 4V10H7M23 20V14H17M20.49 9C19.9828 7.56678 19.1209 6.28543 17.9845 5.27542C16.8482 4.26541 15.4745 3.55976 14 3.22426C12.5255 2.88875 10.9965 2.9339 9.54563 3.35636C8.09479 3.77882 6.76787 4.56503 5.69 5.64L1 10M23 14L18.31 18.36C17.2321 19.435 15.9052 20.2212 14.4544 20.6436C13.0035 21.0661 11.4745 21.1113 10 20.7758C8.52547 20.4402 7.15179 19.7346 6.01547 18.7246C4.87915 17.7146 4.01724 16.4332 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Regenerate Key
                    </>
                  )}
                </button>
              </div>

              {/* Quick Start */}
              <div className="card_app_wrapper" style={{ padding: '1.5rem' }}>
                <h3 className="heading-style-h4" style={{ marginBottom: '1rem' }}>Quick Start</h3>
                
                <div style={{
                  backgroundColor: '#1a1a2e',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  overflow: 'auto',
                }}>
                  <pre style={{
                    color: '#e0e0e0',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}>
{`curl -X GET "https://api.tradeguard.ai/v1/predictions/btc" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a
                    href="#"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--base-color-brand--color-primary, #1e65fa)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    API Documentation
                  </a>
                  <a
                    href="#"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--base-color-brand--color-primary, #1e65fa)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 19C4.7 19.6 4.7 16.1 3 15.5M15 21V17.5C15.1 16.4 14.7 15.3 14 14.5C17.1 14.2 20 13 20 8.5C20 7.2 19.5 6 18.6 5.1C19 4 18.9 2.7 18.4 1.7C18.4 1.7 17.3 1.3 15 3C13.1 2.5 10.9 2.5 9 3C6.7 1.3 5.6 1.7 5.6 1.7C5.1 2.7 5 4 5.4 5.1C4.5 6 4 7.2 4 8.5C4 13 6.9 14.2 10 14.5C9.3 15.3 8.9 16.4 9 17.5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    SDK & Code Examples
                  </a>
                  <a
                    href="#"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--base-color-brand--color-primary, #1e65fa)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    API Status Page
                  </a>
                </div>
              </div>

              {/* Usage Chart Mockup */}
              <div className="card_app_wrapper" style={{ padding: '1.5rem' }}>
                <h3 className="heading-style-h4" style={{ marginBottom: '1rem' }}>Usage Over Time</h3>
                
                <div style={{
                  height: '200px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  padding: '1rem 0',
                }}>
                  {[65, 78, 52, 89, 95, 72, 68, 84, 91, 77, 83, 88].map((height, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${height}%`,
                        backgroundColor: height > 90 
                          ? 'var(--color-red, #ef5350)' 
                          : 'var(--base-color-brand--color-primary, #1e65fa)',
                        borderRadius: '4px 4px 0 0',
                        opacity: 0.8,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.8}
                    />
                  ))}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color--border-primary, #e5e5e7)',
                  paddingTop: '0.5rem',
                }}>
                  <span className="text-size-small text-color-secondary">12 hours ago</span>
                  <span className="text-size-small text-color-secondary">Now</span>
                </div>
              </div>

              {/* Recent Requests */}
              <div className="card_app_wrapper" style={{ padding: '1.5rem' }}>
                <h3 className="heading-style-h4" style={{ marginBottom: '1rem' }}>Recent Requests</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {mockRecentRequests.map((req, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: 'var(--background-grey, #fafbfc)',
                        borderRadius: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          backgroundColor: req.status === 200 
                            ? 'rgba(38, 166, 154, 0.1)' 
                            : 'rgba(239, 83, 80, 0.1)',
                          color: req.status === 200 
                            ? 'var(--color-green, #26a69a)' 
                            : 'var(--color-red, #ef5350)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          {req.status}
                        </span>
                        <span className="text-size-small" style={{ fontFamily: 'monospace' }}>
                          {req.endpoint}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="text-size-small text-color-secondary">{req.latency}</span>
                        <span className="text-size-small text-color-secondary">{req.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Available Endpoints */}
            <div className="card_app_wrapper" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3 className="heading-style-h4" style={{ marginBottom: '1rem' }}>Available Endpoints</h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
              }}>
                <EndpointCard 
                  method="GET"
                  path="/v1/predictions/:symbol"
                  description="Get AI predictions for a cryptocurrency"
                />
                <EndpointCard 
                  method="GET"
                  path="/v1/market/summary"
                  description="Get market overview and statistics"
                />
                <EndpointCard 
                  method="GET"
                  path="/v1/crypto/:symbol"
                  description="Get detailed cryptocurrency data"
                />
                <EndpointCard 
                  method="GET"
                  path="/v1/crypto/list"
                  description="List all supported cryptocurrencies"
                />
                <EndpointCard 
                  method="GET"
                  path="/v1/market/fear-greed"
                  description="Get Fear & Greed Index data"
                />
                <EndpointCard 
                  method="POST"
                  path="/v1/predictions/batch"
                  description="Get predictions for multiple symbols"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, progress, status }) => (
  <div className="card_app_wrapper" style={{ padding: '1.25rem' }}>
    <div className="text-size-small text-color-secondary" style={{ marginBottom: '0.5rem' }}>
      {title}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
      <span className="heading-style-h3" style={{ margin: 0 }}>{value}</span>
      {status === 'success' && (
        <span style={{
          width: '8px',
          height: '8px',
          backgroundColor: 'var(--color-green, #26a69a)',
          borderRadius: '50%',
          display: 'inline-block',
        }} />
      )}
    </div>
    <div className="text-size-small text-color-secondary" style={{ marginTop: '0.25rem' }}>
      {subtitle}
    </div>
    {progress !== undefined && (
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: 'var(--border-color--border-primary, #e5e5e7)',
        borderRadius: '2px',
        marginTop: '0.75rem',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(progress, 100)}%`,
          height: '100%',
          backgroundColor: progress > 80 
            ? 'var(--color-red, #ef5350)' 
            : progress > 50 
            ? '#f59e0b' 
            : 'var(--color-green, #26a69a)',
          borderRadius: '2px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    )}
  </div>
);

// Endpoint Card Component
const EndpointCard = ({ method, path, description }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: 'var(--background-grey, #fafbfc)',
    borderRadius: '0.5rem',
  }}>
    <span style={{
      backgroundColor: method === 'GET' 
        ? 'rgba(38, 166, 154, 0.1)' 
        : 'rgba(30, 101, 250, 0.1)',
      color: method === 'GET' 
        ? 'var(--color-green, #26a69a)' 
        : 'var(--base-color-brand--color-primary, #1e65fa)',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.7rem',
      fontWeight: 700,
      minWidth: '40px',
      textAlign: 'center',
    }}>
      {method}
    </span>
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
        {path}
      </div>
      <div className="text-size-small text-color-secondary">
        {description}
      </div>
    </div>
  </div>
);

export default ApiDashboardPage;
