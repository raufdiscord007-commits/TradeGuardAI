import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword = ({ onClose }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sendPasswordResetEmail, resetPassword } = useAuth();
  const [currentStep, setCurrentStep] = useState('forgot'); // 'forgot', 'reset', 'success'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    number: false,
    special: false,
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

  // Check for reset token in URL on mount
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const urlEmail = searchParams.get('email');
    if (urlToken && urlEmail) {
      setToken(urlToken);
      setEmail(urlEmail);
      setCurrentStep('reset');
    }
  }, [searchParams]);

  useEffect(() => {
    // Validate password requirements
    setPasswordValidation({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      capital: /[A-Z]/.test(password)
    });
  }, [password]);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await sendPasswordResetEmail(email);
      
      if (result.success) {
        setCurrentStep('reset');
      } else {
        setError(result.error || 'Failed to send reset email.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const allValid = Object.values(passwordValidation).every(v => v);
    if (!allValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await resetPassword(email, token, password);
      
      if (result.success) {
        setCurrentStep('success');
      } else {
        setError(result.error || 'Password reset failed.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (onClose) onClose();
    navigate('/login');
  };

  return (
    <>
      <style>{autofillStyles}</style>
      <div className="main_form_component is-flex">
      {/* Success Card */}
      {currentStep === 'success' && (
        <div className="main_form_block">
          <div className="main_form">
            <div className="main_form_header">
              <h1 className="heading-style-h3">Password reset</h1>
              <div className="text-size-regular">
                Your password has been successfully reset.
                <br />
                Click below to log in.
              </div>
            </div>
            <a onClick={handleBackToLogin} href="#" className="button is-full-width w-button">
              Back to login
            </a>
          </div>
          <div className="main_form_close_button" onClick={onClose} style={{ cursor: 'pointer' }}>
            <img src="/images/close_black_24dp.svg" loading="lazy" alt="" className="main_form_close_icon" />
          </div>
        </div>
      )}

      {/* Forgot Password Form */}
      {currentStep === 'forgot' && (
        <div className="main_form_block w-form">
          <form onSubmit={handleForgotSubmit} className="main_form" data-ms-form="forgot-password">
            <div className="main_form_header">
              <h1 className="heading-style-h3">Forgot your password?</h1>
              <div className="text-size-regular">No worries, we'll send you reset instructions.</div>
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
            
            <div className="main_form_fields">
              <label htmlFor="Forgot-Email-2" className="ms-input-label">
                Email
              </label>
              <input
                className="main_form_input w-input"
                maxLength="256"
                name="email"
                placeholder="e.g. howard.thurman@gmail.com"
                type="email"
                id="Forgot-Email-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="main_form_footer">
              <input 
                type="submit" 
                data-wait="Please wait..." 
                className="button w-button"
                value={isLoading ? 'Please wait...' : 'Reset password'}
                disabled={isLoading}
              />
            </div>
            <div className="main_form_close_button" onClick={onClose} style={{ cursor: 'pointer' }}>
              <img src="/images/close_black_24dp.svg" loading="lazy" alt="" className="main_form_close_icon" />
            </div>
          </form>
          <div className="w-form-done">
            <div>Thank you! Your submission has been received!</div>
          </div>
          <div className="w-form-fail">
            <div>Oops! Something went wrong while submitting the form.</div>
          </div>
        </div>
      )}

      {/* Reset Password Form */}
      {currentStep === 'reset' && (
        <div className="main_form_block w-form">
          <form onSubmit={handleResetSubmit} className="main_form" data-ms-form="reset-password">
            <div className="main_form_header">
              <h1 className="heading-style-h3">Check your email</h1>
              <div className="text-size-regular">
                Please enter your 6-digit code. Then create and confirm your new password.
                <br />
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
            
            <div className="main_form_fields_wrapper">
              <div className="main_form_fields">
                <label htmlFor="Forgot-Token-2" className="main_form_label">
                  6-digit code
                </label>
                <input
                  className="main_form_input w-input"
                  maxLength="6"
                  minLength="6"
                  name="token"
                  placeholder=""
                  type="text"
                  id="Forgot-Token-2"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  data-ms-member="token"
                  required
                />
              </div>
              <div className="main_form_fields">
                <label htmlFor="password-2" className="main_form_label">
                  New Password
                </label>
                <input
                  className="main_form_input w-input"
                  maxLength="256"
                  minLength="8"
                  name="password"
                  placeholder=""
                  type="password"
                  id="password-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  data-ms-member="password"
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
                      id="special-6"
                      className={`password-requirements ${passwordValidation.special ? 'is-valid' : ''}`}
                    >
                      At least 1 special character
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
              <div className="main_form_fields">
                <label htmlFor="confirm-password-2" className="main_form_label">
                  Confirm Password
                </label>
                <input
                  className="main_form_input w-input"
                  maxLength="256"
                  minLength="8"
                  name="confirmPassword"
                  placeholder=""
                  type="password"
                  id="confirm-password-2"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  data-ms-member="password"
                  required
                />
              </div>
            </div>
            <div className="main_form_footer">
              <input 
                type="submit" 
                data-wait="Please wait..." 
                className="button w-button"
                value={isLoading ? 'Please wait...' : 'Reset password'}
                disabled={isLoading}
              />
            </div>
            <div className="main_form_close_button" onClick={onClose} style={{ cursor: 'pointer' }}>
              <img src="/images/close_black_24dp.svg" loading="lazy" alt="" className="main_form_close_icon" />
            </div>
          </form>
          <div className="w-form-done">
            <div>Thank you! Your submission has been received!</div>
          </div>
          <div className="w-form-fail">
            <div>Oops! Something went wrong while submitting the form.</div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ForgotPassword;
