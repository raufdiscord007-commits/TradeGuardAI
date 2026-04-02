import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/normalize.css';
import '../../css/webflow.css';
import '../../css/tradeguard-ai.webflow.css';

export default function Navbar({ onSearch, onMenuToggle, isSidebarOpen = false }) {
  const navigate = useNavigate();
  const { member, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);

  const firstName = member?.customFields?.['first-name'] || member?.firstName || '';
  const lastName = member?.customFields?.['last-name'] || member?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || member?.auth?.email?.split('@')[0] || 'User';
  const userInitials = firstName && lastName 
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (firstName?.[0] || member?.auth?.email?.[0] || 'U').toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
      setSearchQuery('');
    }
  };

  const handleMenuToggle = () => {
    onMenuToggle?.();
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div 
      role="banner" 
      className="navbar_app_component w-nav"
      data-collapse="medium"
      data-animation="default"
      data-duration="400"
      data-easing="ease"
    >
      <div className="navbar_app_container">
        <div className="navbar_app_content">
          <div className="navbar_app_form">
            <form onSubmit={handleSearchSubmit}>
              <input
                className="main_app_input"
                maxLength="256"
                name="search"
                placeholder="Search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
            </form>
          </div>
        </div>
        
        <nav 
          role="navigation" 
          className="navbar_menu is-page-height-tablet w-nav-menu"
        >
          <div className="navbar_menu-buttons">
            <a href="/" className="button is-secondary is-small is-icon">
              <img src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/6942dc1162b46cceef706c4c_generative%20(1).png" loading="lazy" alt="TradeGuard AI" className="navbar_app_icon is-big" />
              <div>TradeGuard AI</div>
            </a>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={handleProfileClick}
                className="navbar_app_profile_wrapper"
                style={{ 
                  background: 'none', 
                  border: showProfileMenu ? '2px solid var(--base-color-brand--color-primary, #1e65fa)' : '2px solid transparent',
                  cursor: 'pointer', 
                  padding: '0.5rem',
                  borderRadius: '0.75rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  if (!showProfileMenu) {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 101, 250, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showProfileMenu) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--base-color-brand--color-primary, #1e65fa)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}
                >
                  {userInitials}
                </div>
                <div className="navbar_app_profile_content" style={{ textAlign: 'left' }}>
                  <div className="text-size-regular text-weight-medium text-color-primary">{fullName}</div>
                  <div className="text-size-tiny text-color-secondary">
                    {member?.role === 'ADMIN' ? 'Administrator' : 'Member'}
                  </div>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: 'var(--text-color--text-secondary, #858c95)'
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              
              {showProfileMenu && (
                <div 
                  className="card_app_wrapper"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    minWidth: '280px',
                    zIndex: 1000,
                    animation: 'slideDown 0.2s ease',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {/* Profile Header */}
                  <div style={{ 
                    padding: '1.25rem', 
                    borderBottom: '1px solid var(--border-color--border-primary, #e5e5e7)',
                    background: 'linear-gradient(135deg, rgba(30, 101, 250, 0.05) 0%, rgba(30, 101, 250, 0.02) 100%)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div 
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--base-color-brand--color-primary, #1e65fa)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}
                      >
                        {userInitials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-size-medium text-weight-semibold" style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {fullName}
                        </div>
                        <div className="text-size-small text-color-secondary" style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '0.125rem'
                        }}>
                          {member?.auth?.email}
                        </div>
                      </div>
                    </div>
                    {member?.role === 'ADMIN' && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.25rem 0.625rem',
                        backgroundColor: 'rgba(30, 101, 250, 0.1)',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--base-color-brand--color-primary, #1e65fa)'
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                        Administrator
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/profile');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'background-color 0.2s ease',
                        color: 'var(--text-color--text-primary, #323539)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(30, 101, 250, 0.05)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '0.5rem',
                        backgroundColor: 'rgba(30, 101, 250, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--base-color-brand--color-primary, #1e65fa)',
                        flexShrink: 0
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-size-regular text-weight-medium">Profile Settings</div>
                        <div className="text-size-tiny text-color-secondary">Manage your account</div>
                      </div>
                    </button>

                    {member?.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/admin');
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          transition: 'background-color 0.2s ease',
                          color: 'var(--text-color--text-primary, #323539)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(30, 101, 250, 0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '0.5rem',
                          backgroundColor: 'rgba(30, 101, 250, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--base-color-brand--color-primary, #1e65fa)',
                          flexShrink: 0
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="3" x2="9" y2="21"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-size-regular text-weight-medium">Admin Dashboard</div>
                          <div className="text-size-tiny text-color-secondary">Manage users & content</div>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Logout Button */}
                  <div style={{ 
                    padding: '0.5rem', 
                    borderTop: '1px solid var(--border-color--border-primary, #e5e5e7)' 
                  }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'background-color 0.2s ease',
                        color: 'var(--color-red, #ef5350)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 83, 80, 0.05)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '0.5rem',
                        backgroundColor: 'rgba(239, 83, 80, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-size-regular text-weight-medium">Logout</div>
                        <div className="text-size-tiny" style={{ color: 'var(--text-color--text-secondary, #858c95)' }}>Sign out of your account</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
        
        <button
          onClick={handleMenuToggle}
          className={`menu-icon ${isSidebarOpen ? 'w--open' : ''}`}
          aria-label="Toggle sidebar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div className="menu-icon_line-top"></div>
          <div className="menu-icon_line-middle">
            <div className="menu-icon_line-middle-inner"></div>
          </div>
          <div className="menu-icon_line-bottom"></div>
        </button>
      </div>

      <style>{`
        .navbar_app_component.w-nav {
          position: relative;
          z-index: 1000;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 991px) {
          .navbar_menu {
            display: none;
          }

          .menu-icon {
            display: flex !important;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 50px;
            height: 50px;
            padding: 0 !important;
          }

          .menu-icon_line-top,
          .menu-icon_line-middle,
          .menu-icon_line-bottom {
            width: 24px;
            height: 2px;
            background: currentColor;
            margin: 3px 0;
            transition: all 0.3s ease;
            transform-origin: center;
          }

          /* Burger to Cross animation */
          .menu-icon.w--open .menu-icon_line-top {
            transform: rotate(-45deg) translate(-5px, 6px);
          }

          .menu-icon.w--open .menu-icon_line-middle {
            opacity: 0;
            transform: scaleX(0);
          }

          .menu-icon.w--open .menu-icon_line-bottom {
            transform: rotate(45deg) translate(-5px, -6px);
          }
        }

        @media (min-width: 992px) {
          .menu-icon {
            display: none !important;
          }

          .navbar_menu {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
