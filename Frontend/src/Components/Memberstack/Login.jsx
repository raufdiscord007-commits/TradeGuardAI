import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = ({ onClose, showCloseButton = true }) => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add styles for autofill
  const autofillStyles = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px #f5f5f5 inset !important;
      box-shadow: 0 0 0 30px #f5f5f5 inset !important;
      -webkit-text-fill-color: #000 !important;
    }
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        if (onClose) onClose();
        navigate('/app');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleGoogleLogin = (e) => {
    e.preventDefault();
    setError('');
    // This redirects to Google OAuth - no loading state needed as page navigates away
    loginWithGoogle();
  };

  return (
    <>
      <style>{autofillStyles}</style>
      <div className="main_form_block w-form">
        <form onSubmit={handleSubmit} className="main_form">
          <h2 className="heading-style-h3">Login</h2>
          
          {error && (
            <div style={{ 
              padding: '0.75rem', 
              marginBottom: '1rem', 
              backgroundColor: '#fee', 
              color: '#c33', 
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          
          <div className="main_form_fields_wrapper">
            <div className="main_form_fields">
              <label htmlFor="Email-Five-2" className="main_form_label">
                Email Address
              </label>
              <input
                className="main_form_input w-input"
                maxLength="256"
                name="email"
                placeholder="e.g. howard@gmail.com"
                type="email"
                id="Email-Five-2"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="main_form_fields">
              <label htmlFor="Password-Five-2" className="login-input-label ms-is-forgot-password w-clearfix">
                Password Input{' '}
                <Link to="/forgot-password" className="ms-link ms-is-forgot">
                  Forgot Password
                </Link>
              </label>
              <input
                className="main_form_input w-input"
                maxLength="256"
                name="password"
                placeholder="⁕ ⁕ ⁕ ⁕ ⁕ ⁕ ⁕ ⁕"
                type="password"
                id="Password-Five-2"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          <div className="main_form_footer">
            <input 
              type="submit" 
              className="button is-full-width w-button"
              value={isLoading ? 'Please wait...' : 'Submit'}
              disabled={isLoading}
            />
            <div className="main_form_divider">
              <div className="main_form_divider_line"></div>
              <div className="main_form_divider_text">OR</div>
              <div className="main_form_divider_line"></div>
            </div>
            <a 
              href="#" 
              onClick={handleGoogleLogin} 
              className="main_form_social_button w-inline-block"
            >
              <div className="ms-social-inner ms-is-center">
                <img alt="" loading="lazy" src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/6936e975945489a24f875895_b7727941c0e8a117b6cfd8f06a1cb7ed_google.svg" className="ms-social-image" />
                <div className="ms-social-text">
                  Continue with Google
                </div>
              </div>
            </a>
          </div>
          
          {showCloseButton && (
            <div className="main_form_close_button" onClick={onClose} style={{ cursor: 'pointer' }}>
              <img src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/696807b39a055f53b4271712_close_black_24dp.svg" loading="lazy" alt="" className="main_form_close_icon" />
            </div>
          )}
        </form>
        <div className="w-form-done">
          <div>Thank you! Your submission has been received!</div>
        </div>
        <div className="w-form-fail">
          <div>Oops! Something went wrong while submitting the form.</div>
        </div>
    </div>
    </>
  );
};

export default Login;
