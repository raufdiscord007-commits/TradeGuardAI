import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ModalWrapper from '../Memberstack/ModalWrapper';
import VerificationCodeInput from '../Auth/VerificationCodeInput';

const SetPasswordModal = ({ isOpen, onClose }) => {
  const { initiateSetPassword, verifySetPassword, resendSetPasswordCode } = useAuth();
  
  // Flow states: 'initial', 'verify', 'success'
  const [step, setStep] = useState('initial');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    number: false,
    special: false,
    capital: false
  });

  const validatePassword = (password) => {
    setPasswordChecks({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      capital: /[A-Z]/.test(password)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (name === 'newPassword') {
      validatePassword(value);
    }
    
    if (error) setError('');
  };

  const handleCodeComplete = (code) => {
    setFormData({ ...formData, verificationCode: code });
    if (error) setError('');
  };

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleInitiate = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!passwordChecks.length || !passwordChecks.number || !passwordChecks.special || !passwordChecks.capital) {
      setError('Password does not meet requirements.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await initiateSetPassword();
      
      if (result.success) {
        setStep('verify');
        startResendTimer();
      } else {
        setError(result.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifySetPassword(formData.verificationCode, formData.newPassword);
      
      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || 'Invalid verification code.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setError('');
    setIsLoading(true);

    try {
      const result = await resendSetPasswordCode();
      
      if (result.success) {
        startResendTimer();
      } else {
        setError(result.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ newPassword: '', confirmPassword: '', verificationCode: '' });
    setPasswordChecks({ length: false, number: false, special: false, capital: false });
    setError('');
    setStep('initial');
    onClose();
  };

  const CheckIcon = ({ checked }) => (
    <span style={{ 
      color: checked ? '#26a69a' : '#858c95',
      marginRight: '0.5rem'
    }}>
      {checked ? '✓' : '○'}
    </span>
  );

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose}>
      <div className="main_form_block w-form" style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* Step 1: Enter Password */}
        {step === 'initial' && (
          <form onSubmit={handleInitiate} className="main_form">
            <div className="main_form_header">
              <h2 className="heading-style-h3">Set Password</h2>
              <p className="text-size-regular text-color-secondary">
                Create a password to enable email & password login alongside Google.
              </p>
            </div>

            {error && (
              <div style={{ 
                padding: '0.75rem', 
                marginBottom: '1rem', 
                backgroundColor: 'rgba(239, 83, 80, 0.1)', 
                color: '#ef5350', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                border: '1px solid rgba(239, 83, 80, 0.2)'
              }}>
                {error}
              </div>
            )}

            <div className="main_form_fields_wrapper">
              <div className="main_form_fields">
                <label htmlFor="newPassword" className="main_form_label">Password</label>
                <input
                  className="main_form_input w-input"
                  name="newPassword"
                  placeholder="Enter a strong password"
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
                
                {/* Password Requirements */}
                <div className="update_password-check" style={{ marginTop: '0.75rem' }}>
                  <div className="text-size-small text-color-secondary text-weight-semibold" style={{ marginBottom: '0.5rem' }}>
                    Your password must contain:
                  </div>
                  <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li className="text-size-small" style={{ 
                      color: passwordChecks.length ? '#26a69a' : '#858c95',
                      marginBottom: '0.25rem'
                    }}>
                      <CheckIcon checked={passwordChecks.length} />
                      A minimum of 8 characters
                    </li>
                    <li className="text-size-small" style={{ 
                      color: passwordChecks.number ? '#26a69a' : '#858c95',
                      marginBottom: '0.25rem'
                    }}>
                      <CheckIcon checked={passwordChecks.number} />
                      At least one number
                    </li>
                    <li className="text-size-small" style={{ 
                      color: passwordChecks.special ? '#26a69a' : '#858c95',
                      marginBottom: '0.25rem'
                    }}>
                      <CheckIcon checked={passwordChecks.special} />
                      At least one special character
                    </li>
                    <li className="text-size-small" style={{ 
                      color: passwordChecks.capital ? '#26a69a' : '#858c95'
                    }}>
                      <CheckIcon checked={passwordChecks.capital} />
                      At least one capital letter
                    </li>
                  </ul>
                </div>
              </div>

              <div className="main_form_fields">
                <label htmlFor="confirmPassword" className="main_form_label">Confirm Password</label>
                <input
                  className="main_form_input w-input"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="main_form_buttons" style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="button w-button"
                disabled={isLoading}
                style={{ width: '100%' }}
              >
                {isLoading ? 'Sending Code...' : 'Continue'}
              </button>
              <button
                type="button"
                className="button is-secondary w-button"
                onClick={handleClose}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} className="main_form">
            <div className="main_form_header">
              <h2 className="heading-style-h3">Verify Your Email</h2>
              <p className="text-size-regular text-color-secondary">
                We've sent a 6-digit code to your email. Enter it below to set your password.
              </p>
            </div>

            {error && (
              <div style={{ 
                padding: '0.75rem', 
                marginBottom: '1rem', 
                backgroundColor: 'rgba(239, 83, 80, 0.1)', 
                color: '#ef5350', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                border: '1px solid rgba(239, 83, 80, 0.2)'
              }}>
                {error}
              </div>
            )}

            <div className="main_form_fields_wrapper">
              <div className="main_form_fields">
                <label className="main_form_label" style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
                  Enter Verification Code
                </label>
                <VerificationCodeInput
                  length={6}
                  onComplete={handleCodeComplete}
                  disabled={isLoading}
                  error={error}
                  autoFocus={true}
                />
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1e65fa',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Resend code
                  </button>
                ) : (
                  <span className="text-size-small text-color-secondary">
                    Resend code in {resendTimer}s
                  </span>
                )}
              </div>
            </div>

            <div className="main_form_buttons" style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="button w-button"
                disabled={isLoading || formData.verificationCode.length !== 6}
                style={{ width: '100%' }}
              >
                {isLoading ? 'Verifying...' : 'Set Password'}
              </button>
              <button
                type="button"
                className="button is-secondary w-button"
                onClick={() => setStep('initial')}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="main_form" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(38, 166, 154, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#26a69a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="heading-style-h3" style={{ marginBottom: '0.75rem' }}>Password Set!</h2>
            <p className="text-size-regular text-color-secondary" style={{ marginBottom: '1.5rem' }}>
              You can now log in with either Google or your email and password.
            </p>
            <button
              type="button"
              className="button w-button"
              onClick={handleClose}
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

export default SetPasswordModal;
