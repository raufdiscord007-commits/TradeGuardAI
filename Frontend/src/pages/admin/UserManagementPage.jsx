import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../Components/Dashboard Pages/Sidebar';
import Navbar from '../../Components/Dashboard Pages/Navbar';
import CustomSelect from '../../Components/Admin/CustomSelect';

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15,18 9,12 15,6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Available plans - matches PlanTier enum in Prisma schema
const PLANS = [
  { id: 'FREE', name: 'Free', color: '#6b7280' },
  { id: 'PRO', name: 'Pro', color: '#1e65fa' },
  { id: 'API_PLAN', name: 'API Plan', color: '#f59e0b' }
];

// Edit User Modal
const EditUserModal = ({ user, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState({
    firstName: user?.customFields?.firstName || '',
    lastName: user?.customFields?.lastName || '',
    planTier: user?.subscription?.planTier || 'FREE',
    verified: user?.verified || false,
    customFields: { ...user?.customFields }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, formData);
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-header-content">
            <h2>Edit User</h2>
            <p className="admin-modal-subtitle">{user?.auth?.email}</p>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {/* User Identity Section */}
            <div className="admin-form-section">
              <div className="admin-form-section-header">
                <h3>User Information</h3>
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => handleCustomFieldChange('firstName', e.target.value)}
                    className="admin-input"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => handleCustomFieldChange('lastName', e.target.value)}
                    className="admin-input"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Email Address</label>
                <input
                  type="text"
                  value={user?.auth?.email || ''}
                  disabled
                  className="admin-input admin-input--disabled"
                />
                <span className="admin-input-hint">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', marginRight: '4px' }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  Email cannot be changed
                </span>
              </div>

              <div className="admin-form-group">
                <label className="admin-checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={e => handleChange('verified', e.target.checked)}
                    className="admin-checkbox"
                  />
                  <span className="admin-checkbox-label-text">
                    <span className="admin-checkbox-label-title">Email Verified</span>
                    <span className="admin-checkbox-label-desc">User has verified their email address</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="admin-form-section">
              <div className="admin-form-section-header">
                <h3>Subscription & Access</h3>
              </div>

              <div className="admin-form-group">
                <label>Plan Tier</label>
                <CustomSelect
                  value={formData.planTier}
                  onChange={(value) => handleChange('planTier', value)}
                  options={PLANS.map(plan => ({ value: plan.id, label: plan.name }))}
                />
                
                {formData.planTier !== (user?.subscription?.planTier || 'FREE') && (
                  <div className={`admin-notice ${formData.planTier === 'FREE' ? 'admin-notice--warning' : 'admin-notice--success'}`}>
                    <div className="admin-notice-icon">
                      {formData.planTier === 'FREE' ? '⚠️' : '✓'}
                    </div>
                    <div className="admin-notice-content">
                      <div className="admin-notice-title">
                        {formData.planTier === 'FREE' ? 'Plan Downgrade' : 'Plan Upgrade'}
                      </div>
                      <div className="admin-notice-text">
                        {formData.planTier === 'FREE' 
                          ? 'User will lose access to paid features immediately.'
                          : `User will receive ${PLANS.find(p => p.id === formData.planTier)?.name} features without payment.`
                        }
                      </div>
                    </div>
                  </div>
                )}

                {user?.subscription && !user.subscription.stripeSubscriptionId && user.subscription.planTier !== 'FREE' && (
                  <div className="admin-badge admin-badge--success">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Admin-granted (no payment required)
                  </div>
                )}
                
                {user?.subscription?.stripeSubscriptionId && (
                  <div className="admin-badge admin-badge--neutral">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    Stripe-managed subscription
                  </div>
                )}
              </div>
            </div>

            {/* Account Details Section */}
            <div className="admin-form-section">
              <div className="admin-form-section-header">
                <h3>Account Details</h3>
              </div>
              
              <div className="admin-info-grid">
                <div className="admin-info-item">
                  <span className="admin-info-label">Member ID</span>
                  <span className="admin-info-value admin-info-value--mono">{user?.id}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">Joined</span>
                  <span className="admin-info-value">{formatDate(user?.createdAt)}</span>
                </div>
                <div className="admin-info-item">
                  <span className="admin-info-label">Last Login</span>
                  <span className="admin-info-value">{formatDate(user?.lastLogin)}</span>
                </div>
                {user?.subscription?.currentPeriodEnd && (
                  <div className="admin-info-item">
                    <span className="admin-info-label">Plan Expires</span>
                    <span className="admin-info-value">{formatDate(user.subscription.currentPeriodEnd)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="admin-modal-footer">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? (
                <>
                  <svg className="admin-btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ user, onClose, onConfirm, deleting }) => {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--small" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header admin-modal-header--danger">
          <h2>Delete User</h2>
          <button className="admin-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="admin-modal-body">
          <p className="admin-delete-warning">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
          <div className="admin-delete-user-info">
            <strong>{user?.auth?.email}</strong>
            {user?.customFields?.firstName && (
              <span>{user.customFields.firstName} {user.customFields.lastName}</span>
            )}
          </div>
        </div>
        <div className="admin-modal-footer">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="admin-btn admin-btn--danger" 
            onClick={() => onConfirm(user.id)}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { member } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const USERS_PER_PAGE = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: USERS_PER_PAGE.toString()
      });

      if (searchQuery) params.append('search', searchQuery);
      if (planFilter !== 'all') params.append('plan', planFilter);

      const { getUsers } = await import('../../services/adminApi');
      const result = await getUsers(Object.fromEntries(params));
      
      // Backend returns { success: true, data: members, pagination: ... }
      const members = result.data || result.members || [];
      setUsers(Array.isArray(members) ? members : []);
      setTotalUsers(result.pagination?.total || result.totalCount || 0);
      setWarning(result.warning || null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePlanFilter = (value) => {
    setPlanFilter(value);
    setCurrentPage(1);
  };

  const handleSaveUser = async (userId, formData) => {
    try {
      setSaving(true);
      
      const { updateUser } = await import('../../services/adminApi');
      await updateUser(userId, formData);

      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setDeleting(true);
      
      const { deleteUser } = await import('../../services/adminApi');
      await deleteUser(userId);

      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  const handleSidebarNavigate = (path) => {
    navigate(path);
  };

  const getPlanBadge = (user) => {
    // Get plan tier from subscription data
    const planTier = user?.subscription?.planTier || 'FREE';
    const plan = PLANS.find(p => p.id === planTier) || PLANS[0];
    
    // Show subscription status indicator if not active
    const status = user?.subscription?.status;
    const isActive = !status || status === 'ACTIVE' || status === 'TRIALING';
    
    // Check if admin-granted (no Stripe subscription but has paid plan)
    const isAdminGranted = !user?.subscription?.stripeSubscriptionId && planTier !== 'FREE';
    
    // Build tooltip text
    let tooltipText = '';
    if (!isActive) tooltipText = `Status: ${status}`;
    else if (isAdminGranted) tooltipText = 'Admin-granted (no payment)';
    else if (user?.subscription?.stripeSubscriptionId) tooltipText = 'Stripe subscription';
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span 
          className="admin-plan-badge" 
          style={{ 
            background: `${plan.color}20`, 
            color: plan.color, 
            borderColor: `${plan.color}40`,
            opacity: isActive ? 1 : 0.6
          }}
          title={tooltipText}
        >
          {plan.name}
          {!isActive && <span style={{ marginLeft: '4px', fontSize: '0.7em' }}>({status})</span>}
        </span>
        {isAdminGranted && (
          <span 
            style={{ 
              fontSize: '0.65rem', 
              color: '#16a34a', 
              background: '#f0fdf4',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #bbf7d0'
            }}
            title="This plan was granted by an admin"
          >
            Admin
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onNavigate={handleSidebarNavigate} 
          activePage="admin-users" 
        />
        <div className="dashboard_main_wrapper">
          <Navbar 
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
          />
          <div className="dashboard_main_app">
            <div className="admin-page">
            <div className="admin-page-header">
              <div className="admin-page-title">
                <h1>User Management</h1>
                <p>Manage all registered users and their subscriptions</p>
              </div>
              <button 
                className="admin-action-btn admin-action-btn--primary"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshIcon /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="admin-filters">
              <div className="admin-search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="admin-search-input"
                />
              </div>
              <div className="admin-filter-group">
                <CustomSelect
                  value={planFilter}
                  onChange={handlePlanFilter}
                  options={[
                    { value: 'all', label: 'All Plans' },
                    ...PLANS.map(plan => ({ value: plan.id, label: plan.name }))
                  ]}
                />
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="admin-loading">
                <div className="admin-loading-spinner"></div>
                <p>Loading users...</p>
              </div>
            )}

            {/* Warning */}
            {warning && !error && (
              <div className="admin-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <p>{warning}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="admin-error">
                <p>Error: {error}</p>
                <button onClick={fetchUsers} className="admin-retry-btn">
                  Try Again
                </button>
              </div>
            )}

            {/* Users Table */}
            {!loading && !error && (
              <>
                {/* Desktop Table View */}
                <div className="admin-table-container admin-desktop-only">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map(user => (
                          <tr key={user.id}>
                            <td>
                              <div className="admin-user-cell">
                                <div className="admin-user-avatar">
                                  {(user.customFields?.firstName?.[0] || user.auth?.email?.[0] || 'U').toUpperCase()}
                                </div>
                                <div className="admin-user-details">
                                  <span className="admin-user-name">
                                    {user.customFields?.firstName 
                                      ? `${user.customFields.firstName} ${user.customFields.lastName || ''}`
                                      : 'No name'
                                    }
                                  </span>
                                  <span className="admin-user-email">{user.auth?.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>{getPlanBadge(user)}</td>
                            <td>
                              <span className={`admin-status ${user.verified ? 'admin-status--verified' : 'admin-status--unverified'}`}>
                                {user.verified ? 'Verified' : 'Unverified'}
                              </span>
                            </td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td>{formatDate(user.lastLogin)}</td>
                            <td>
                              <div className="admin-table-actions">
                                <button 
                                  className="admin-icon-btn"
                                  onClick={() => setEditingUser(user)}
                                  title="Edit User"
                                >
                                  <EditIcon />
                                </button>
                                <button 
                                  className="admin-icon-btn admin-icon-btn--danger"
                                  onClick={() => setDeletingUser(user)}
                                  title="Delete User"
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="admin-table-empty">
                            {searchQuery || planFilter !== 'all' 
                              ? 'No users match your filters'
                              : 'No users found'
                            }
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="admin-mobile-only">
                  {users.length > 0 ? (
                    <div className="admin-user-cards">
                      {users.map(user => (
                        <div key={user.id} className="admin-user-card">
                          {/* Card Header */}
                          <div className="admin-user-card-header">
                            <div className="admin-user-card-avatar">
                              {(user.customFields?.firstName?.[0] || user.auth?.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div className="admin-user-card-identity">
                              <span className="admin-user-card-name">
                                {user.customFields?.firstName 
                                  ? `${user.customFields.firstName} ${user.customFields.lastName || ''}`
                                  : 'No name'
                                }
                              </span>
                              <span className="admin-user-card-email">{user.auth?.email}</span>
                            </div>
                            <div className="admin-user-card-actions">
                              <button 
                                className="admin-icon-btn"
                                onClick={() => setEditingUser(user)}
                                title="Edit User"
                              >
                                <EditIcon />
                              </button>
                              <button 
                                className="admin-icon-btn admin-icon-btn--danger"
                                onClick={() => setDeletingUser(user)}
                                title="Delete User"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="admin-user-card-body">
                            <div className="admin-user-card-row">
                              <span className="admin-user-card-label">Plan</span>
                              <div className="admin-user-card-value">{getPlanBadge(user)}</div>
                            </div>
                            <div className="admin-user-card-row">
                              <span className="admin-user-card-label">Status</span>
                              <span className={`admin-status ${user.verified ? 'admin-status--verified' : 'admin-status--unverified'}`}>
                                {user.verified ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                            <div className="admin-user-card-row">
                              <span className="admin-user-card-label">Joined</span>
                              <span className="admin-user-card-value">{formatDate(user.createdAt)}</span>
                            </div>
                            <div className="admin-user-card-row">
                              <span className="admin-user-card-label">Last Login</span>
                              <span className="admin-user-card-value">{formatDate(user.lastLogin)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-empty-state">
                      <div className="admin-empty-state-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <p className="admin-empty-state-text">
                        {searchQuery || planFilter !== 'all' 
                          ? 'No users match your filters'
                          : 'No users found'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="admin-pagination">
                    <span className="admin-pagination-info">
                      Showing {(currentPage - 1) * USERS_PER_PAGE + 1} - {Math.min(currentPage * USERS_PER_PAGE, totalUsers)} of {totalUsers} users
                    </span>
                    <div className="admin-pagination-controls">
                      <button 
                        className="admin-pagination-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeftIcon />
                      </button>
                      <span className="admin-pagination-current">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button 
                        className="admin-pagination-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Edit Modal */}
            {editingUser && (
              <EditUserModal
                user={editingUser}
                onClose={() => setEditingUser(null)}
                onSave={handleSaveUser}
                saving={saving}
              />
            )}

            {/* Delete Modal */}
            {deletingUser && (
              <DeleteModal
                user={deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={handleDeleteUser}
                deleting={deleting}
              />
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
