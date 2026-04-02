import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import VerificationCodeInput from '../Auth/VerificationCodeInput';

const SignUp = ({ onClose, showCloseButton = true }) => {
  const navigate = useNavigate();
  const { 
    initiateSignup, 
    verifyRegistration, 
    resendVerificationCode,
    cancelRegistration,
    pendingRegistration,
    loginWithGoogle 
  } = useAuth();
  
  const [step, setStep] = useState('form'); // 'form' or 'verify'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    number: false,
    capital: false
  });

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

  // Sync with pending registration state
  useEffect(() => {
    if (pendingRegistration) {
      setStep('verify');
    }
  }, [pendingRegistration]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    // Validate password requirements
    const password = formData.password;
    setPasswordValidation({
      length: password.length >= 8,
      number: /\d/.test(password),
      capital: /[A-Z]/.test(password)
    });
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password meets all requirements
    const allValid = Object.values(passwordValidation).every(v => v);
    if (!allValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const result = await initiateSignup(
        formData.email, 
        formData.password, 
        firstName,
        lastName
      );
      
      if (result.success) {
        setStep('verify');
        setResendCooldown(60); // 60 second cooldown for resend
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = async (code) => {
    setError('');
    setIsLoading(true);

    try {
      const result = await verifyRegistration(code);
      
      if (result.success) {
        if (onClose) onClose();
        navigate('/app');
      } else {
        setError(result.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setError('');
    setIsLoading(true);

    try {
      const result = await resendVerificationCode();
      
      if (result.success) {
        setResendCooldown(60);
      } else {
        setError(result.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    cancelRegistration();
    setStep('form');
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleGoogleSignup = (e) => {
    e.preventDefault();
    setError('');
    // This redirects to Google OAuth - no loading state needed
    loginWithGoogle();
  };

  // Verification step UI
  if (step === 'verify') {
    return (
      <>
        <style>{autofillStyles}</style>
        <div className="main_form_block w-form">
          <div className="main_form">
            <div className="main_form_header">
              <h1 className="heading-style-h3">Verify Your Email</h1>
              <div className="text-size-regular" style={{ marginTop: '0.5rem' }}>
                We've sent a 6-digit verification code to<br />
                <strong>{pendingRegistration?.email || formData.email}</strong>
              </div>
            </div>
            
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
            
            <div style={{ padding: '1.5rem 0' }}>
              <VerificationCodeInput
                length={6}
                onComplete={handleVerificationComplete}
                disabled={isLoading}
                error={null}
                autoFocus={true}
              />
            </div>
            
            <div className="main_form_footer">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span className="text-size-regular">Didn't receive the code? </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#888' : '#007bff',
                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    padding: 0,
                    fontSize: 'inherit',
                    textDecoration: 'underline'
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
              
              <button
                type="button"
                onClick={handleBackToForm}
                className="button is-secondary is-full-width w-button"
                style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to signup
              </button>
            </div>
            
            {showCloseButton && (
              <div className="main_form_close_button" onClick={onClose} style={{ cursor: 'pointer' }}>
                <img src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/696807b39a055f53b4271712_close_black_24dp.svg" loading="lazy" alt="" className="main_form_close_icon" />
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Initial signup form
  return (
    <>
      <style>{autofillStyles}</style>
      <div className="main_form_block w-form">
        <form onSubmit={handleSubmit} className="main_form">
          <h1 className="heading-style-h3">Signup</h1>
          
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
              <label htmlFor="Name-Two-2" className="main_form_label">
                Name
              </label>
              <input
                className="main_form_input w-input"
                maxLength="256"
                name="name"
                placeholder="e.g. Howard Thurman"
                type="text"
                id="Name-Two-2"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="main_form_fields">
              <label htmlFor="Email-One-2" className="main_form_label">
                Email Address
              </label>
              <input
                className="main_form_input w-input"
                maxLength="256"
                name="email"
                placeholder="e.g. howard@gmail.com"
                type="email"
                id="Email-One-2"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="main_form_fields">
              <label htmlFor="Password-One-2" className="main_form_label">
                Password Input
              </label>
              <input
                className="main_form_input w-input"
                maxLength="256"
                name="password"
                placeholder="⁕ ⁕ ⁕ ⁕ ⁕ ⁕ ⁕ ⁕"
                type="password"
                id="Password-One-2"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <div className="update_password-check">
                <div className="text-size-small text-color-secondary text-weight-semibold">
                  Your password must contains:
                </div>
                <ul role="list" className="login-list">
                  <li
                    id="length-6"
                    className={`password-requirements ${passwordValidation.length ? 'is-valid' : ''}`}
                  >
                    A minimum of 8 characters.
                  </li>
                  <li
                    id="number-6"
                    className={`password-requirements ${passwordValidation.number ? 'is-valid' : ''}`}
                  >
                    At least one number
                  </li>
                  <li
                    id="capital-6"
                    className={`password-requirements ${passwordValidation.capital ? 'is-valid' : ''}`}
                  >
                    At least one uppercase letter
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="main_form_footer">
            <input 
              type="submit" 
              className="button is-full-width w-button"
              value={isLoading ? 'Please wait...' : 'Continue'}
              disabled={isLoading}
            />
            <div className="main_form_divider">
              <div className="main_form_divider_line"></div>
              <div className="main_form_divider_text">OR</div>
              <div className="main_form_divider_line"></div>
            </div>
            <a 
              href="#" 
              onClick={handleGoogleSignup} 
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

export default SignUp;
