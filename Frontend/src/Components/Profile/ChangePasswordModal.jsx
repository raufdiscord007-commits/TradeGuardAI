import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ModalWrapper from '../Memberstack/ModalWrapper';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { updateMemberAuth, logout } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e) => {
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

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await updateMemberAuth(formData.currentPassword, null, formData.newPassword);
      
      if (result.success) {
        setSuccess(true);
        // Log out user after password change so they can log in with new password
        setTimeout(async () => {
          await logout();
          navigate('/login');
        }, 2000);
      } else {
        setError(result.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Password change exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordChecks({ length: false, number: false, special: false, capital: false });
    setError('');
    setSuccess(false);
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
        <form onSubmit={handleSubmit} className="main_form">
          <div className="main_form_header">
            <h2 className="heading-style-h3">Change Password</h2>
            <p className="text-size-regular text-color-secondary">
              Update your password to keep your account secure.
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

          {success && (
            <div style={{ 
              padding: '0.75rem', 
              marginBottom: '1rem', 
              backgroundColor: 'rgba(38, 166, 154, 0.1)', 
              color: '#26a69a', 
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              border: '1px solid rgba(38, 166, 154, 0.2)'
            }}>
              Password updated successfully!
            </div>
          )}

          <div className="main_form_fields_wrapper">
            <div className="main_form_fields">
              <label htmlFor="currentPassword" className="main_form_label">Current Password</label>
              <input
                className="main_form_input w-input"
                name="currentPassword"
                placeholder="Enter your current password"
                type="password"
                id="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="main_form_fields">
              <label htmlFor="newPassword" className="main_form_label">New Password</label>
              <input
                className="main_form_input w-input"
                name="newPassword"
                placeholder="Enter new password"
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
                    color: passwordChecks.capital ? '#26a69a' : '#858c95',
                    marginBottom: '0.25rem'
                  }}>
                    <CheckIcon checked={passwordChecks.capital} />
                    At least one uppercase letter
                  </li>
                </ul>
              </div>
            </div>

            <div className="main_form_fields">
              <label htmlFor="confirmPassword" className="main_form_label">Confirm New Password</label>
              <input
                className="main_form_input w-input"
                name="confirmPassword"
                placeholder="Confirm new password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                minLength="8"
                required
              />
            </div>
          </div>

          <div className="main_form_footer" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={handleClose}
              className="button is-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button"
              style={{ flex: 1 }}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          <div 
            className="main_form_close_button" 
            onClick={handleClose} 
            style={{ cursor: 'pointer' }}
          >
            <img 
              src="https://cdn.prod.website-files.com/69284f1f4a41d1c19de618ec/696807b39a055f53b4271712_close_black_24dp.svg" 
              loading="lazy" 
              alt="Close" 
              className="main_form_close_icon" 
            />
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
};

export default ChangePasswordModal;
