import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Login, SignUp } from '../Memberstack';
import { AuthContext } from '../../contexts/AuthContext';

const Navbar = () => {
  const { member, loading } = useContext(AuthContext);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // Check if we're on login or signup pages
  const isOnLoginPage = location.pathname === '/login';
  const isOnSignUpPage = location.pathname === '/signup';
  const isOnAuthPage = isOnLoginPage || isOnSignUpPage;

  useEffect(() => {
    if (showLogin || showSignUp) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLogin, showSignUp]);

  return (
    <>
      <div
        className="navbar_component padding-global w-nav"
        data-animation="default"
        data-easing2="ease"
        fs-scrolldisable-element="smart-nav"
        data-easing="ease"
        data-collapse="medium"
        data-w-id="efc93928-0c24-2ffd-e35b-5ce5acc3567f"
        role="banner"
        data-duration="400"
        data-wf--navbar--variant="base"
      >
        <div className="navbar_container">
          <Link to="/" className="navbar_logo-link w-nav-brand">
            <img src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/69426dffe6149e1de06911c1_Group%204%20(1).svg" loading="lazy" alt="TradeGuard AI" className="navbar_logo" />
          </Link>
          <nav 
            role="navigation" 
            className={`navbar_menu is-page-height-tablet w-nav-menu ${isMenuOpen ? 'w--open' : ''}`}
            {...(isMenuOpen && { 'data-nav-menu-open': '' })}
          >
            <Link to="/" className="navbar_link w-nav-link" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
            <Link to="/resources" className="navbar_link w-nav-link" onClick={() => setIsMenuOpen(false)}>
              Resources
            </Link>
            <Link to="/contact" className="navbar_link w-nav-link" onClick={() => setIsMenuOpen(false)}>
              Contact
            </Link>
            <div className="navbar_menu-buttons">
              {loading ? (
                // Show nothing or a subtle loading indicator while checking auth
                <div style={{ width: '120px', height: '40px' }}></div>
              ) : member ? (
                <Link
                  to="/dashboard"
                  className="button w-button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  {isOnAuthPage ? (
                    // On login/signup pages, use Link navigation instead of popups
                    <>
                      <Link to="/signup" className="button w-button" onClick={() => setIsMenuOpen(false)}>
                        Sign up
                      </Link>
                      <Link to="/login" className="button is-secondary w-button" onClick={() => setIsMenuOpen(false)}>
                        Log in
                      </Link>
                    </>
                  ) : (
                    // On other pages, show popups
                    <>
                      <a onClick={() => { setShowSignUp(true); setIsMenuOpen(false); }} className="button w-button" style={{ cursor: 'pointer' }}>
                        Sign up
                      </a>
                      <a onClick={() => { setShowLogin(true); setIsMenuOpen(false); }} className="button is-secondary w-button" style={{ cursor: 'pointer' }}>
                        Log in
                      </a>
                    </>
                  )}
                </>
              )}
            </div>
          </nav>
          <div 
            className={`navbar_menu-button w-nav-button ${isMenuOpen ? 'w--open' : ''}`} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="menu"
            aria-expanded={isMenuOpen}
          >
            <div className="menu-icon">
              <div className="menu-icon_line-top"></div>
              <div className="menu-icon_line-middle">
                <div className="menu-icon_line-middle-inner"></div>
              </div>
              <div className="menu-icon_line-bottom"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Simple Overlay - Only show on pages other than login/signup */}
      {!isOnAuthPage && (showLogin || showSignUp) && (
        <div 
          onClick={() => {
            setShowLogin(false);
            setShowSignUp(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '100%', overflow: 'auto' }}>
            {showLogin && <Login onClose={() => setShowLogin(false)} />}
            {showSignUp && <SignUp onClose={() => setShowSignUp(false)} />}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
