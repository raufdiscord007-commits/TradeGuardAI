import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../Components/Dashboard Pages/Sidebar';
import Navbar from '../../Components/Dashboard Pages/Navbar';

// Icons
const UsersIcon = () => (
  <svg className="admin-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ArticleIcon = () => (
  <svg className="admin-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const PatternIcon = () => (
  <svg className="admin-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </svg>
);

const DraftIcon = () => (
  <svg className="admin-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ViewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Get action color
const getActionColor = (action) => {
  switch (action) {
    case 'CREATE': return '#10b981';
    case 'UPDATE': return '#3b82f6';
    case 'DELETE': return '#ef4444';
    default: return '#858c95';
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

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { member } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { adminApi } = await import('../../services/adminApi');
      const result = await adminApi.get('/api/admin/stats');
      
      // Backend returns { success: true, data: stats }
      const statsData = result.data || result;
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle sidebar navigation
  const handleSidebarNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onNavigate={handleSidebarNavigate} 
          activePage="admin" 
        />
        
        <div className="dashboard_main_wrapper">
          <Navbar 
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
          />
          
          <div className="dashboard_main_app">
            <div className="admin-dashboard">
              {/* Page Header */}
              <div className="admin-dashboard-header">
                <div className="admin-dashboard-title">
                  <h1 className="text-size-xlarge text-weight-semibold">Admin Dashboard</h1>
                  <p className="text-size-regular text-color-secondary">Manage users, content, and monitor activity</p>
                </div>
                <div className="admin-dashboard-actions">
                  <Link to="/admin/content/articles/new" className="button is-small is-icon">
                    <PlusIcon /> New Article
                  </Link>
                  <Link to="/admin/content/patterns/new" className="button is-secondary is-small is-icon">
                    <PlusIcon /> New Pattern
                  </Link>
                </div>
              </div>

              {loading && (
                <div className="admin-loading">
                  <div className="admin-loading-spinner"></div>
                  <p>Loading dashboard...</p>
                </div>
              )}

              {error && (
                <div className="admin-error">
                  <p>Error: {error}</p>
                  <button onClick={fetchDashboardStats} className="admin-retry-btn">
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && stats && (
                <>
                  {/* Stats Cards */}
                  <div className="admin-stats-grid">
                    <div className="card_app_wrapper admin-stat-card admin-stat-card--users">
                      <div className="admin-stat-top">
                        <div className="admin-stat-icon-wrapper">
                          <UsersIcon />
                        </div>
                        <span className="admin-stat-title">Total Users</span>
                        <span className="admin-stat-value">{stats.users?.total || 0}</span>
                      </div>
                      <Link to="/admin/users" className="button is-secondary is-small is-icon">View All</Link>
                    </div>

                    <div className="card_app_wrapper admin-stat-card admin-stat-card--articles">
                      <div className="admin-stat-top">
                        <div className="admin-stat-icon-wrapper">
                          <ArticleIcon />
                        </div>
                        <span className="admin-stat-title">Articles</span>
                        <span className="admin-stat-value">{stats.articles?.total || 0}</span>
                      </div>
                      <Link to="/admin/content?tab=articles" className="button is-secondary is-small is-icon">View All</Link>
                    </div>

                    <div className="card_app_wrapper admin-stat-card admin-stat-card--patterns">
                      <div className="admin-stat-top">
                        <div className="admin-stat-icon-wrapper">
                          <PatternIcon />
                        </div>
                        <span className="admin-stat-title">Chart Patterns</span>
                        <span className="admin-stat-value">{stats.patterns?.total || 0}</span>
                      </div>
                      <Link to="/admin/content?tab=patterns" className="button is-secondary is-small is-icon">View All</Link>
                    </div>

                    <div className="card_app_wrapper admin-stat-card admin-stat-card--drafts">
                      <div className="admin-stat-top">
                        <div className="admin-stat-icon-wrapper">
                          <DraftIcon />
                        </div>
                        <span className="admin-stat-title">Drafts</span>
                        <span className="admin-stat-value">{stats.articles?.drafts || 0}</span>
                      </div>
                      <Link to="/admin/content?status=draft" className="button is-secondary is-small is-icon">View All</Link>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="admin-content-grid">
                    {/* Recent Activity */}
                    <div className="card_app_wrapper admin-panel">
                      <div className="card_app_header">
                        <h2 className="text-size-medium text-weight-semibold">Recent Activity</h2>
                        <Link to="/admin/logs" className="button is-secondary is-small is-icon">View All</Link>
                      </div>
                      <div className="admin-panel-content">
                        {stats.recentActivity?.length > 0 ? (
                          <div className="admin-activity-list">
                            {stats.recentActivity.map((activity) => (
                              <div key={activity.id} className="admin-activity-item">
                                <div className="admin-activity-icon" style={{ color: getActionColor(activity.action) }}>
                                  {getTargetIcon(activity.targetType)}
                                </div>
                                <div className="admin-activity-content">
                                  <span className="admin-activity-action" style={{ color: getActionColor(activity.action) }}>
                                    {activity.action}
                                  </span>
                                  <span className="admin-activity-target">
                                    {activity.targetType}: {activity.targetName}
                                  </span>
                                  <span className="admin-activity-meta">
                                    by {activity.adminEmail} • {formatTimeAgo(activity.createdAt)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="admin-empty-state">
                            <p>No recent activity</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Popular Content */}
                    <div className="card_app_wrapper admin-panel">
                      <div className="card_app_header">
                        <h2 className="text-size-medium text-weight-semibold">Popular Content</h2>
                      </div>
                      <div className="admin-panel-content">
                        {(stats.popularContent && stats.popularContent.length > 0) ? (
                          <div className="admin-popular-list">
                            {stats.popularContent.map((item, index) => (
                              <div key={`${item.type}-${item.id}`} className="admin-popular-item">
                                <span className="admin-popular-rank">{index + 1}</span>
                                <div className="admin-popular-content">
                                  <span className="admin-popular-title">{item.title || item.name}</span>
                                  <span className="admin-popular-type">{item.type}</span>
                                </div>
                                <div className="admin-popular-stats">
                                  <ViewIcon />
                                  <span>{item.viewCount || 0}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="admin-empty-state">
                            <p>No content yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card_app_wrapper admin-panel">
                      <div className="card_app_header">
                        <h2 className="text-size-medium text-weight-semibold">Quick Actions</h2>
                      </div>
                      <div className="admin-panel-content">
                        <div className="admin-quick-actions">
                          <Link to="/admin/users" className="admin-quick-action">
                            <UsersIcon />
                            <span>Manage Users</span>
                          </Link>
                          <Link to="/admin/content/articles/new" className="admin-quick-action">
                            <ArticleIcon />
                            <span>Create Article</span>
                          </Link>
                          <Link to="/admin/content/patterns/new" className="admin-quick-action">
                            <PatternIcon />
                            <span>Create Pattern</span>
                          </Link>
                          <Link to="/admin/logs" className="admin-quick-action">
                            <DraftIcon />
                            <span>View Audit Logs</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Recent Content */}
                    <div className="card_app_wrapper admin-panel">
                      <div className="card_app_header">
                        <h2 className="text-size-medium text-weight-semibold">Recent Content</h2>
                        <Link to="/admin/content" className="button is-secondary is-small is-icon">View All</Link>
                      </div>
                      <div className="admin-panel-content">
                        {(stats.recentContent && stats.recentContent.length > 0) ? (
                          <div className="admin-recent-list">
                            {stats.recentContent.map((item) => (
                              <div key={`${item.type}-${item.id}`} className="admin-recent-item">
                                <div className="admin-recent-info">
                                  <span className="admin-recent-title">{item.title || item.name}</span>
                                  <span className="admin-recent-meta">
                                    <span className={`admin-status-badge admin-status-badge--${item.published ? 'published' : 'draft'}`}>
                                      {item.published ? 'Published' : 'Draft'}
                                    </span>
                                    <span className="admin-recent-type">• {item.type}</span>
                                    <span>• {formatTimeAgo(item.createdAt)}</span>
                                  </span>
                                </div>
                                <div className="admin-recent-actions">
                                  <Link 
                                    to={`/admin/content/${item.type === 'article' ? 'articles' : 'patterns'}/${item.id}/edit`}
                                    className="admin-icon-btn"
                                    title="Edit"
                                  >
                                    <EditIcon />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="admin-empty-state">
                            <p>No content yet</p>
                            <Link to="/admin/content/articles/new" className="button is-icon is-small">
                              Create your first article
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
