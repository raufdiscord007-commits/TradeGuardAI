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

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18,15 12,9 6,15" />
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

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ArticleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

const PatternIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </svg>
);

// Format date
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get action color
const getActionColor = (action) => {
  switch (action) {
    case 'CREATE': return '#10b981';
    case 'UPDATE': return '#3b82f6';
    case 'DELETE': return '#ef4444';
    default: return '#6b7280';
  }
};

// Get action background
const getActionBg = (action) => {
  switch (action) {
    case 'CREATE': return 'rgba(16, 185, 129, 0.15)';
    case 'UPDATE': return 'rgba(59, 130, 246, 0.15)';
    case 'DELETE': return 'rgba(239, 68, 68, 0.15)';
    default: return 'rgba(107, 114, 128, 0.15)';
  }
};

// Get target icon
const getTargetIcon = (targetType) => {
  switch (targetType) {
    case 'USER': return <UserIcon />;
    case 'ARTICLE': return <ArticleIcon />;
    case 'PATTERN': return <PatternIcon />;
    default: return null;
  }
};

// Format field name for display
const formatFieldName = (field) => {
  const fieldLabels = {
    // User fields
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    role: 'Role',
    emailVerified: 'Email Verified',
    planTier: 'Plan Tier',
    status: 'Status',
    stripeSubscriptionId: 'Stripe Subscription',
    currentPeriodEnd: 'Subscription Expires',
    cancelAtPeriodEnd: 'Cancel at Period End',
    // Article fields
    title: 'Title',
    slug: 'Slug',
    excerpt: 'Excerpt',
    content: 'Content',
    category: 'Category',
    tags: 'Tags',
    readTime: 'Read Time',
    difficulty: 'Difficulty',
    published: 'Published',
    featured: 'Featured',
    thumbnailUrl: 'Thumbnail URL',
    authorName: 'Author',
    // Pattern fields
    name: 'Name',
    description: 'Description',
    patternType: 'Pattern Type',
    keyPoints: 'Key Points',
    howToTrade: 'How to Trade',
    reliability: 'Reliability',
    imageUrl: 'Image URL',
    // Common fields
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    lastLogin: 'Last Login',
    googleId: 'Google Linked',
    id: 'ID',
    subscription: 'Subscription'
  };
  return fieldLabels[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

// Format value for display
const formatValue = (value, field) => {
  if (value === null || value === undefined) return <span className="admin-value-null">Not set</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }
    } catch (e) {}
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="admin-value-null">Empty</span>;
    return value.join(', ');
  }
  if (typeof value === 'object') {
    // Handle subscription object
    if (field === 'subscription' && value.planTier) {
      return `${value.planTier} (${value.status || 'ACTIVE'})`;
    }
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }
  return String(value);
};

// Fields to ignore in diff display
const ignoredFields = ['id', 'createdAt', 'updatedAt', 'password', 'passwordHash', 'googleId', 'stripeCustomerId', 'stripeSubscriptionId', 'stripePriceId'];

// User-friendly fields to show for different target types
const priorityFieldsByType = {
  USER: ['email', 'firstName', 'lastName', 'role', 'emailVerified', 'subscription'],
  ARTICLE: ['title', 'slug', 'category', 'published', 'featured', 'difficulty'],
  PATTERN: ['name', 'slug', 'patternType', 'published', 'difficulty', 'reliability']
};

// Get changed fields between before and after
const getChangedFields = (before, after, targetType) => {
  if (!before || !after) return [];
  
  const changes = [];
  const priorityFields = priorityFieldsByType[targetType] || [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  // Process priority fields first, then others
  const sortedKeys = [...allKeys].sort((a, b) => {
    const aIndex = priorityFields.indexOf(a);
    const bIndex = priorityFields.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
  
  for (const key of sortedKeys) {
    if (ignoredFields.includes(key)) continue;
    
    const beforeVal = before[key];
    const afterVal = after[key];
    
    // Handle subscription object specially for users
    if (key === 'subscription') {
      const beforePlan = beforeVal?.planTier;
      const afterPlan = afterVal?.planTier;
      const beforeStatus = beforeVal?.status;
      const afterStatus = afterVal?.status;
      
      if (beforePlan !== afterPlan || beforeStatus !== afterStatus) {
        changes.push({
          field: key,
          before: beforeVal,
          after: afterVal
        });
      }
      continue;
    }
    
    // Compare values
    const beforeStr = JSON.stringify(beforeVal);
    const afterStr = JSON.stringify(afterVal);
    
    if (beforeStr !== afterStr) {
      changes.push({
        field: key,
        before: beforeVal,
        after: afterVal
      });
    }
  }
  
  return changes;
};

// Changes Diff Component
const ChangesDiff = ({ changes, action, targetType }) => {
  if (!changes) {
    return <span className="admin-no-changes">No changes recorded</span>;
  }

  // Display custom change message if it exists
  if (changes.message) {
    return (
      <div className="admin-change-message">
        <div className="admin-change-message-content">
          <span className="admin-change-message-label">Change Description</span>
          <p className="admin-change-message-text">{changes.message}</p>
        </div>
      </div>
    );
  }

  // Handle CREATE action - show created data
  if (action === 'CREATE' && changes.created) {
    const priorityFields = priorityFieldsByType[targetType] || [];
    const data = changes.created;
    const fieldsToShow = priorityFields.filter(f => data[f] !== undefined);
    
    return (
      <div className="admin-changes-created">
        <div className="admin-changes-section">
          <span className="admin-changes-section-label admin-changes-section-label--created">Created with values:</span>
          <div className="admin-changes-list">
            {fieldsToShow.map(field => (
              <div key={field} className="admin-change-item">
                <span className="admin-change-field">{formatFieldName(field)}:</span>
                <span className="admin-change-value admin-change-value--new">
                  {formatValue(data[field], field)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle DELETE action - show deleted data
  if (action === 'DELETE' && changes.deleted) {
    const priorityFields = priorityFieldsByType[targetType] || [];
    const data = changes.deleted;
    const fieldsToShow = priorityFields.filter(f => data[f] !== undefined);
    
    return (
      <div className="admin-changes-deleted">
        <div className="admin-changes-section">
          <span className="admin-changes-section-label admin-changes-section-label--deleted">Deleted data:</span>
          <div className="admin-changes-list">
            {fieldsToShow.map(field => (
              <div key={field} className="admin-change-item">
                <span className="admin-change-field">{formatFieldName(field)}:</span>
                <span className="admin-change-value admin-change-value--old">
                  {formatValue(data[field], field)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle UPDATE action with before/after
  if (changes.before && changes.after) {
    const changedFields = getChangedFields(changes.before, changes.after, targetType);
    
    if (changedFields.length === 0) {
      return <span className="admin-no-changes">No significant changes detected</span>;
    }
    
    // Check for plan change specifically
    const planChanged = changes.planChanged;
    
    return (
      <div className="admin-changes-diff">
        {planChanged && (
          <div className="admin-plan-change-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Subscription plan was changed by admin
          </div>
        )}
        <div className="admin-changes-grid">
          {changedFields.map(({ field, before, after }) => (
            <div key={field} className="admin-change-row">
              <span className="admin-change-field">{formatFieldName(field)}</span>
              <div className="admin-change-values">
                <div className="admin-change-before">
                  <span className="admin-change-label">Before:</span>
                  <span className="admin-change-value admin-change-value--old">
                    {formatValue(before, field)}
                  </span>
                </div>
                <div className="admin-change-arrow">→</div>
                <div className="admin-change-after">
                  <span className="admin-change-label">After:</span>
                  <span className="admin-change-value admin-change-value--new">
                    {formatValue(after, field)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for other change formats
  return <span className="admin-no-changes">No changes recorded</span>;
};

// Log Row Component (Desktop Table)
const LogRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  // Allow expansion for all actions that have changes
  const canExpand = log.changes && (
    log.changes.message || 
    log.changes.before || 
    log.changes.after || 
    log.changes.created || 
    log.changes.deleted
  );

  return (
    <>
      <tr className={`admin-log-row ${canExpand ? 'admin-log-row--expandable' : ''}`} onClick={() => canExpand && setExpanded(!expanded)}>
        <td>
          <div className="admin-log-time">
            {formatDateTime(log.createdAt)}
          </div>
        </td>
        <td>
          <span 
            className="admin-action-badge"
            style={{ 
              background: getActionBg(log.action),
              color: getActionColor(log.action)
            }}
          >
            {log.action}
          </span>
        </td>
        <td>
          <div className="admin-target-cell">
            <div className="admin-target-info">
              <span className="admin-target-type">{log.targetType}</span>
              <span className="admin-target-name">{log.targetName}</span>
            </div>
          </div>
        </td>
        <td>
          <div className="admin-admin-cell">
            <span className="admin-admin-email">{log.adminEmail}</span>
          </div>
        </td>
        <td>
          {canExpand && (
            <button className="admin-expand-btn" aria-label="Expand row">
              {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
          )}
        </td>
      </tr>
      {canExpand && expanded && (
        <tr className="admin-log-details-row">
          <td colSpan="5">
            <div className="admin-log-details">
              <div className="admin-log-details-header">
                <h4>
                  {log.action === 'CREATE' ? 'Created Data' : 
                   log.action === 'DELETE' ? 'Deleted Data' : 
                   'Change Details'}
                </h4>
              </div>
              <ChangesDiff changes={log.changes} action={log.action} targetType={log.targetType} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Log Card Component (Mobile)
const LogCard = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const canExpand = log.changes && (
    log.changes.message || 
    log.changes.before || 
    log.changes.after || 
    log.changes.created || 
    log.changes.deleted
  );

  return (
    <div className={`admin-log-card ${expanded ? 'admin-log-card--expanded' : ''}`}>
      <div 
        className="admin-log-card-header"
        onClick={() => canExpand && setExpanded(!expanded)}
      >
        <div className="admin-log-card-top">
          <span 
            className="admin-action-badge"
            style={{ 
              background: getActionBg(log.action),
              color: getActionColor(log.action)
            }}
          >
            {log.action}
          </span>
          <span className="admin-log-card-time">
            {formatDateTime(log.createdAt)}
          </span>
        </div>
        
        <div className="admin-log-card-target">
          <div className="admin-log-card-target-icon">
            {getTargetIcon(log.targetType)}
          </div>
          <div className="admin-log-card-target-info">
            <span className="admin-log-card-target-type">{log.targetType}</span>
            <span className="admin-log-card-target-name">{log.targetName}</span>
          </div>
        </div>

        <div className="admin-log-card-admin">
          <UserIcon />
          <span>{log.adminEmail}</span>
        </div>

        {canExpand && (
          <button className="admin-log-card-expand" aria-label="Expand">
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        )}
      </div>

      {canExpand && expanded && (
        <div className="admin-log-card-details">
          <div className="admin-log-card-details-header">
            <h4>
              {log.action === 'CREATE' ? 'Created Data' : 
               log.action === 'DELETE' ? 'Deleted Data' : 
               'Change Details'}
            </h4>
          </div>
          <ChangesDiff changes={log.changes} action={log.action} targetType={log.targetType} />
        </div>
      )}
    </div>
  );
};

const AuditLogsPage = () => {
  const navigate = useNavigate();
  const { member } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const LOGS_PER_PAGE = 20;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage.toString(),
        limit: LOGS_PER_PAGE.toString()
      };

      if (searchQuery) params.search = searchQuery;
      if (actionFilter !== 'all') params.action = actionFilter;
      if (targetFilter !== 'all') params.targetType = targetFilter;

      const { getAuditLogs } = await import('../../services/adminApi');
      const result = await getAuditLogs(params);
      
      // Backend returns { success: true, data: logs, pagination: ... }
      const logsData = result.data || result.logs || [];
      setLogs(Array.isArray(logsData) ? logsData : []);
      setTotalLogs(result.pagination?.total || result.totalCount || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, actionFilter, targetFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar isOpen={isSidebarOpen} onNavigate={(path) => navigate(path)} activePage="admin-logs" />
        <div className="dashboard_main_wrapper">
          <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
          <div className="dashboard_main_app">
            <div className="admin-page">
          <div className="admin-page-header">
            <div className="admin-page-title">
              <h1>Audit Logs</h1>
              <p>Track all administrative actions and changes</p>
            </div>
            <button 
              className="admin-action-btn admin-action-btn--secondary"
              onClick={fetchLogs}
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
                placeholder="Search by admin email or target name..."
                value={searchQuery}
                onChange={handleSearch}
                className="admin-search-input"
              />
            </div>
            <div className="admin-filter-group">
              <CustomSelect
                value={actionFilter}
                onChange={(value) => { setActionFilter(value); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'All Actions' },
                  { value: 'CREATE', label: 'Create' },
                  { value: 'UPDATE', label: 'Update' },
                  { value: 'DELETE', label: 'Delete' }
                ]}
              />
            </div>
            <div className="admin-filter-group">
              <CustomSelect
                value={targetFilter}
                onChange={(value) => { setTargetFilter(value); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'USER', label: 'Users' },
                  { value: 'ARTICLE', label: 'Articles' },
                  { value: 'PATTERN', label: 'Patterns' }
                ]}
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="admin-loading">
              <div className="admin-loading-spinner"></div>
              <p>Loading audit logs...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="admin-error">
              <p>Error: {error}</p>
              <button onClick={fetchLogs} className="admin-retry-btn">
                Try Again
              </button>
            </div>
          )}

          {/* Logs Table */}
          {!loading && !error && (
            <>
              {/* Desktop Table View */}
              <div className="admin-table-container admin-logs-desktop card_app_wrapper">
                <table className="admin-table admin-logs-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Admin</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map(log => (
                        <LogRow key={log.id} log={log} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="admin-table-empty">
                          {searchQuery || actionFilter !== 'all' || targetFilter !== 'all'
                            ? 'No logs match your filters'
                            : 'No audit logs yet'
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="admin-logs-mobile">
                {logs.length > 0 ? (
                  logs.map(log => (
                    <LogCard key={log.id} log={log} />
                  ))
                ) : (
                  <div className="admin-logs-empty-card card_app_wrapper">
                    <p>
                      {searchQuery || actionFilter !== 'all' || targetFilter !== 'all'
                        ? 'No logs match your filters'
                        : 'No audit logs yet'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-info">
                    Showing {(currentPage - 1) * LOGS_PER_PAGE + 1} - {Math.min(currentPage * LOGS_PER_PAGE, totalLogs)} of {totalLogs} logs
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
