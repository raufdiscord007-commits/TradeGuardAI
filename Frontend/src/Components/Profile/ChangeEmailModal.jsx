import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ModalWrapper from '../Memberstack/ModalWrapper';

const ChangeEmailModal = ({ isOpen, onClose, currentEmail }) => {
  const { updateMemberAuth } = useAuth();
  const [formData, setFormData] = useState({
    newEmail: '',
    confirmEmail: '',
    currentPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.newEmail !== formData.confirmEmail) {
      setError('Email addresses do not match.');
      return;
    }

    if (formData.newEmail === currentEmail) {
      setError('New email must be different from current email.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateMemberAuth(formData.currentPassword, formData.newEmail);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({ newEmail: '', confirmEmail: '', currentPassword: '' });
        }, 2000);
      } else {
        setError(result.error || 'Failed to update email.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ newEmail: '', confirmEmail: '', currentPassword: '' });
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose}>
      <div className="main_form_block w-form" style={{ maxWidth: '480px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="main_form">
          <div className="main_form_header">
            <h2 className="heading-style-h3">Change Email</h2>
            <p className="text-size-regular text-color-secondary">
              Update your email address. You'll need to verify your new email.
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
              Email updated successfully!
            </div>
          )}

          <div className="main_form_fields_wrapper">
            <div className="main_form_fields">
              <label className="main_form_label">Current Email</label>
              <input
                className="main_form_input w-input"
                type="email"
                value={currentEmail}
                disabled
                style={{ backgroundColor: '#f5f5f5', color: '#858c95' }}
              />
            </div>

            <div className="main_form_fields">
              <label htmlFor="newEmail" className="main_form_label">New Email</label>
              <input
                className="main_form_input w-input"
                name="newEmail"
                placeholder="Enter new email address"
                type="email"
                id="newEmail"
                value={formData.newEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div className="main_form_fields">
              <label htmlFor="confirmEmail" className="main_form_label">Confirm New Email</label>
              <input
                className="main_form_input w-input"
                name="confirmEmail"
                placeholder="Confirm new email address"
                type="email"
                id="confirmEmail"
                value={formData.confirmEmail}
                onChange={handleChange}
                required
              />
            </div>

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
              {isLoading ? 'Updating...' : 'Update Email'}
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

export default ChangeEmailModal;
