import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Chevron icon component for expandable menu
const ChevronIcon = ({ isExpanded }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
      flexShrink: 0,
      marginLeft: '0.5rem'
    }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
)

// Profile icon for mobile
const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

// Logout icon
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

// Book icon for Learning Platform
const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
)

// Chart icon for Chart Patterns
const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
)

// Bookmark icon for saved items
const BookmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
)

// Shield icon for Admin section
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
)

// Users icon for User Management
const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

// Document icon for Content Management
const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
)

// Clipboard icon for Audit Logs
const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
  </svg>
)

// Dashboard icon for Admin Dashboard
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
)

// Code icon for API Dashboard
const CodeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
)

export default function Sidebar({ onNavigate, activePage, isOpen = false }) {
  const { member, isAdmin, subscription, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const userName = member?.customFields?.['first-name'] || member?.auth?.email?.split('@')[0] || 'User'
  const [activeLink, setActiveLink] = useState(activePage || 'cryptocurrency')
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(false)
  const [isAdminExpanded, setIsAdminExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 992)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update active link based on current location
  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/profile')) {
      setActiveLink('profile')
    } else if (path.startsWith('/predictions')) {
      setActiveLink('predictions')
    } else if (path.startsWith('/cryptocurrency')) {
      setActiveLink('cryptocurrency')
    } else if (path.startsWith('/api-dashboard')) {
      setActiveLink('api-dashboard')
    } else if (path.startsWith('/admin')) {
      setActiveLink('admin')
      // Auto-expand admin menu when on admin pages
      setIsAdminExpanded(true)
      // Set specific sub-link as active
      if (path === '/admin' || path === '/admin/') {
        setActiveLink('admin-dashboard')
      } else if (path.includes('/users')) {
        setActiveLink('admin-users')
      } else if (path.includes('/content')) {
        setActiveLink('admin-content')
      } else if (path.includes('/logs')) {
        setActiveLink('admin-logs')
      }
    } else if (path.startsWith('/resources')) {
      setActiveLink('resources')
      // Auto-expand resources menu when on resources pages
      setIsResourcesExpanded(true)
      // Set specific sub-link as active
      if (path.includes('/learning')) {
        setActiveLink('resources-learning')
      } else if (path.includes('/patterns')) {
        setActiveLink('resources-patterns')
      } else if (path.includes('/bookmarks')) {
        setActiveLink('resources-bookmarks')
      } else {
        setActiveLink('resources')
      }
    } else if (path.startsWith('/portfolio')) {
      setActiveLink('portfolio')
    } else if (activePage) {
      setActiveLink(activePage)
    }
  }, [location.pathname, activePage])

  const navigationLinks = [
    { 
      id: 'cryptocurrency', 
      label: 'Cryptocurrency', 
      path: '/cryptocurrency'
    },
    { 
      id: 'predictions', 
      label: 'Predictions', 
      path: '/predictions',
      planLabel: 'Pro'
    },
    // API Dashboard - Shown to all users
    {
      id: 'api-dashboard',
      label: 'API Dashboard',
      path: '/api-dashboard',
      icon: CodeIcon,
      planLabel: 'API'
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      path: null, // No direct path, has submenu
      hasSubmenu: true,
      subLinks: [
        {
          id: 'resources-learning',
          label: 'Learning Platform',
          path: '/resources/learning',
          icon: BookIcon
        },
        {
          id: 'resources-patterns',
          label: 'Chart Patterns',
          path: '/resources/patterns',
          icon: ChartIcon
        },
        {
          id: 'resources-bookmarks',
          label: 'My Bookmarks',
          path: '/resources/bookmarks',
          icon: BookmarkIcon
        }
      ]
    },
    { 
      id: 'portfolio', 
      label: 'My Portfolio', 
      path: '/portfolio'
    },
  ]

  // Admin navigation links - only shown to admins (at the top)
  const adminLinks = isAdmin ? [
    {
      id: 'admin',
      label: 'Admin Panel',
      path: null,
      hasSubmenu: true,
      subLinks: [
        {
          id: 'admin-dashboard',
          label: 'Dashboard',
          path: '/admin',
          icon: DashboardIcon
        },
        {
          id: 'admin-users',
          label: 'User Management',
          path: '/admin/users',
          icon: UsersIcon
        },
        {
          id: 'admin-content',
          label: 'Content',
          path: '/admin/content',
          icon: DocumentIcon
        },
        {
          id: 'admin-logs',
          label: 'Audit Logs',
          path: '/admin/logs',
          icon: ClipboardIcon
        }
      ]
    }
  ] : []

  const handleNavClick = (linkId, path) => {
    setActiveLink(linkId)
    if (path) {
      onNavigate?.(path, linkId)
    }
  }

  const handleResourcesToggle = () => {
    setIsResourcesExpanded(!isResourcesExpanded)
  }

  const handleAdminToggle = () => {
    setIsAdminExpanded(!isAdminExpanded)
  }

  const handleSubLinkClick = (subLink) => {
    setActiveLink(subLink.id)
    onNavigate?.(subLink.path, subLink.id)
  }

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/')
    }
  }

  return (
    <>
      <div 
        className="sidebar_app_wrapper"
        style={{
          transform: isOpen ? 'translate(0%)' : 'translate(-100%)',
          transition: 'transform 0.4s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div className="sidebar_app_header">
          <a href="/" className="navbar_app_logo-link w-nav-brand">
            <img src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/69426dffe6149e1de06911c1_Group%204%20(1).svg" loading="lazy" alt="TradeGuard AI Logo" className="navbar_logo" />
          </a>
          <div className="text-size-large text-weight-medium">Dashboard</div>
          <div className="text-color-secondary" style={{ fontSize: '1rem' }}>
            Hey there, {userName}!
          </div>
        </div>

        <div className="sidebar_app_link_wrapper" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Admin Section - Rendered at TOP if user is admin */}
          {adminLinks.map((link) => (
            <React.Fragment key={link.id}>
              <button
                onClick={handleAdminToggle}
                className={`sidebar_app_link sidebar_app_link--expandable ${
                  activeLink.startsWith('admin') ? 'is-active' : ''
                }`}
                style={!activeLink.startsWith('admin') ? { color: '#666' } : {}}
              >
                <div className="text-size-medium" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <span>{link.label}</span>
                  <ChevronIcon isExpanded={isAdminExpanded} />
                </div>
              </button>
              
              {/* Admin Submenu */}
              <div 
                className="sidebar_submenu"
                style={{
                  maxHeight: isAdminExpanded ? '250px' : '0',
                  opacity: isAdminExpanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease, opacity 0.3s ease'
                }}
              >
                {link.subLinks.map((subLink) => {
                  const IconComponent = subLink.icon
                  return (
                    <button
                      key={subLink.id}
                      onClick={() => handleSubLinkClick(subLink)}
                      className={`sidebar_app_sublink ${activeLink === subLink.id ? 'is-active' : ''}`}
                    >
                      <IconComponent />
                      <span className="text-size-small">{subLink.label}</span>
                    </button>
                  )
                })}
              </div>
            </React.Fragment>
          ))}

          {navigationLinks.map((link) => (
            <React.Fragment key={link.id}>
              {link.hasSubmenu ? (
                <>
                  {/* Resources parent link with toggle */}
                  <button
                    onClick={handleResourcesToggle}
                    className={`sidebar_app_link sidebar_app_link--expandable ${
                      activeLink.startsWith('resources') ? 'is-active' : ''
                    }`}
                    style={!activeLink.startsWith('resources') ? { color: '#666' } : {}}
                  >
                    <div className="text-size-medium" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {link.label}
                      <ChevronIcon isExpanded={isResourcesExpanded} />
                    </div>
                  </button>
                  
                  {/* Submenu with animation */}
                  <div 
                    className="sidebar_submenu"
                    style={{
                      maxHeight: isResourcesExpanded ? '200px' : '0',
                      opacity: isResourcesExpanded ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease, opacity 0.3s ease'
                    }}
                  >
                    {link.subLinks.map((subLink) => {
                      const IconComponent = subLink.icon
                      return (
                        <button
                          key={subLink.id}
                          onClick={() => handleSubLinkClick(subLink)}
                          className={`sidebar_app_sublink ${activeLink === subLink.id ? 'is-active' : ''}`}
                        >
                          <IconComponent />
                          <span className="text-size-small">{subLink.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => handleNavClick(link.id, link.path)}
                  className={`sidebar_app_link ${activeLink === link.id ? 'is-active' : ''}`}
                  style={activeLink !== link.id ? { color: '#666' } : {}}
                >
                  <div className="text-size-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {link.label}
                    {link.planLabel && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '0.25rem',
                        backgroundColor: 'rgba(38, 166, 154, 0.1)',
                        color: 'var(--color-green, #26a69a)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap'
                      }}>
                        {link.planLabel}
                      </span>
                    )}
                  </div>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile-only Profile & Logout Section */}
        {isMobile && (
          <div className="sidebar_mobile_footer">
            <div className="sidebar_mobile_divider"></div>
            <button
              onClick={() => {
                setActiveLink('profile')
                onNavigate?.('/profile', 'profile')
              }}
              className={`sidebar_app_link sidebar_mobile_link ${activeLink === 'profile' ? 'is-active' : ''}`}
              style={activeLink !== 'profile' ? { color: '#666' } : {}}
            >
              <div className="text-size-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ProfileIcon />
                Profile Settings
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="sidebar_app_link sidebar_mobile_link sidebar_logout_link"
            >
              <div className="text-size-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <LogoutIcon />
                Log Out
              </div>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 992px) {
          .sidebar_app_wrapper {
            transform: translate(0%) !important;
          }
        }
        
        .sidebar_app_link--expandable {
          cursor: pointer;
        }
        
        .sidebar_submenu {
          display: flex;
          flex-direction: column;
          padding-left: 0;
          background-color: rgba(30, 101, 250, 0.02);
        }
        
        .sidebar_app_sublink {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem 0.625rem 1.75rem;
          border: none;
          background: transparent;
          color: #666;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }
        
        .sidebar_app_sublink:hover {
          background-color: rgba(30, 101, 250, 0.04);
          color: #1e65fa;
        }
        
        .sidebar_app_sublink.is-active {
          background-color: rgba(30, 101, 250, 0.08);
          color: #1e65fa;
        }
        
        .sidebar_app_sublink svg {
          flex-shrink: 0;
        }

        /* Mobile footer styles */
        .sidebar_mobile_footer {
          padding: 0.5rem 0 1rem;
          flex-shrink: 0;
        }

        .sidebar_mobile_divider {
          height: 1px;
          background-color: var(--border-color--border-primary, #e5e5e7);
          margin: 0.5rem 1rem 0.75rem;
        }

        .sidebar_mobile_link {
          display: flex !important;
        }

        .sidebar_mobile_link svg {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
        }

        .sidebar_logout_link {
          color: #ef5350 !important;
        }

        .sidebar_logout_link:hover {
          background-color: rgba(239, 83, 80, 0.08) !important;
          color: #ef5350 !important;
        }

        /* Scrollbar styling for sidebar */
        .sidebar_app_link_wrapper::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar_app_link_wrapper::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar_app_link_wrapper::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .sidebar_app_link_wrapper::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  )
}