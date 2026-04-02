import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../Components/Dashboard Pages/Sidebar';
import Navbar from '../../Components/Dashboard Pages/Navbar';
import CustomSelect from '../../Components/Admin/CustomSelect';

// Icons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

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

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ArticleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const PatternIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
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

// Delete Confirmation Modal
const DeleteModal = ({ item, type, onClose, onConfirm, deleting }) => {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal--small" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header admin-modal-header--danger">
          <h2>Delete {type === 'article' ? 'Article' : 'Pattern'}</h2>
          <button className="admin-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="admin-modal-body">
          <p className="admin-delete-warning">
            Are you sure you want to delete this {type}? This action cannot be undone.
          </p>
          <div className="admin-delete-item-info">
            <strong>{item?.title || item?.name}</strong>
            {item?.category && <span>Category: {item.category}</span>}
            {item?.patternType && <span>Type: {item.patternType}</span>}
          </div>
        </div>
        <div className="admin-modal-footer">
          <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="admin-btn admin-btn--danger" 
            onClick={() => onConfirm(item.id)}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ContentManagementPage = () => {
  const navigate = useNavigate();
  const { member } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'articles');
  const [articles, setArticles] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [patternsCount, setPatternsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch counts for both tabs
  const fetchCounts = useCallback(async () => {
    try {
      const { getArticles, getPatterns } = await import('../../services/adminApi');
      
      const [articlesData, patternsData] = await Promise.all([
        getArticles().catch(() => ({ data: [] })),
        getPatterns().catch(() => ({ data: [] }))
      ]);

      const articles = articlesData.data || articlesData.articles || articlesData || [];
      setArticlesCount(Array.isArray(articles) ? articles.length : 0);

      const patterns = patternsData.data || patternsData.patterns || patternsData || [];
      setPatternsCount(Array.isArray(patterns) ? patterns.length : 0);
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { getArticles, getPatterns } = await import('../../services/adminApi');
      
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') {
        if (activeTab === 'articles') {
          // For articles, map status to published boolean
          params.published = statusFilter === 'published' ? 'true' : 'false';
        } else {
          params.status = statusFilter;
        }
      }
      if (categoryFilter !== 'all') params.category = categoryFilter;

      const data = activeTab === 'articles' 
        ? await getArticles(params)
        : await getPatterns(params);
      
      if (activeTab === 'articles') {
        // Backend returns { success: true, data: articles }
        const articlesData = data.data || data.articles || data;
        const articlesArray = Array.isArray(articlesData) ? articlesData : [];
        setArticles(articlesArray);
        setArticlesCount(articlesArray.length);
      } else {
        const patternsData = data.data || data.patterns || data;
        // Map pattern.name to pattern.title for consistent display
        const normalizedPatterns = (Array.isArray(patternsData) ? patternsData : []).map(p => ({
          ...p,
          title: p.name || p.title,
          status: p.published ? 'published' : 'draft',
          category: p.patternType || p.category,
          summary: p.excerpt || p.summary
        }));
        setPatterns(normalizedPatterns);
        setPatternsCount(normalizedPatterns.length);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err.message);
      // Reset to empty arrays on error
      if (activeTab === 'articles') {
        setArticles([]);
      } else {
        setPatterns([]);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Fetch counts on initial load
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    setSearchParams({ tab: activeTab, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) });
  }, [activeTab, statusFilter, setSearchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      const { deleteArticle, deletePattern } = await import('../../services/adminApi');
      
      if (activeTab === 'articles') {
        await deleteArticle(id);
      } else {
        await deletePattern(id);
      }

      setDeletingItem(null);
      fetchContent();
      fetchCounts(); // Refresh counts after deletion
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const currentItems = activeTab === 'articles' ? articles : patterns;

  // Get unique categories from current items
  const categories = [...new Set(currentItems.map(item => item.category).filter(Boolean))];

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar isOpen={isSidebarOpen} onNavigate={(path) => navigate(path)} activePage="admin-content" />
        <div className="dashboard_main_wrapper">
          <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
          <div className="dashboard_main_app">
            <div className="admin-page">
          <div className="admin-page-header">
            <div className="admin-page-title">
              <h1>Content Management</h1>
              <p>Manage articles and chart patterns</p>
            </div>
            <Link 
              to={`/admin/content/${activeTab === 'articles' ? 'articles' : 'patterns'}/new`}
              className="button is-secondary is-icon is-small"
            >
              <PlusIcon /> New {activeTab === 'articles' ? 'Article' : 'Pattern'}
            </Link>
          </div>

          {/* Tabs */}
          <div className="admin-tabs">
            <button 
              className={`admin-tab ${activeTab === 'articles' ? 'admin-tab--active' : ''}`}
              onClick={() => handleTabChange('articles')}
            >
              <ArticleIcon /> Articles
              <span className="admin-tab-count">{articlesCount}</span>
            </button>
            <button 
              className={`admin-tab ${activeTab === 'patterns' ? 'admin-tab--active' : ''}`}
              onClick={() => handleTabChange('patterns')}
            >
              <PatternIcon /> Chart Patterns
              <span className="admin-tab-count">{patternsCount}</span>
            </button>
          </div>

          {/* Filters */}
          <div className="admin-filters">
            <div className="admin-search">
              <SearchIcon />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>
            <div className="admin-filter-group">
              <CustomSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' }
                ]}
              />
            </div>
            {categories.length > 0 && (
              <div className="admin-filter-group">
                <CustomSelect
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map(cat => ({ value: cat, label: cat }))
                  ]}
                />
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="admin-loading">
              <div className="admin-loading-spinner"></div>
              <p>Loading content...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="admin-error">
              <p>Error: {error}</p>
              <button onClick={fetchContent} className="admin-retry-btn">
                Try Again
              </button>
            </div>
          )}

          {/* Content Grid */}
          {!loading && !error && (
            <>
              {currentItems.length > 0 ? (
                <div className="admin-content-cards">
                  {currentItems.map(item => (
                    <div key={item.id} className="admin-content-card">
                      {item.imageUrl && (
                        <div className="admin-content-card-image">
                          <img src={item.imageUrl} alt={item.title} />
                        </div>
                      )}
                      <div className="admin-content-card-body">
                        <div className="admin-content-card-header">
                          <span className={`admin-status-badge admin-status-badge--${item.status?.toLowerCase() || 'published'}`}>
                            {item.status || 'Published'}
                          </span>
                          {item.category && (
                            <span className="admin-category-badge">{item.category}</span>
                          )}
                        </div>
                        <h3 className="admin-content-card-title">{item.title}</h3>
                        {item.description && (
                          <p className="admin-content-card-desc">
                            {item.description.length > 120 
                              ? item.description.substring(0, 120) + '...' 
                              : item.description
                            }
                          </p>
                        )}
                        {item.summary && (
                          <p className="admin-content-card-desc">
                            {item.summary.length > 120 
                              ? item.summary.substring(0, 120) + '...' 
                              : item.summary
                            }
                          </p>
                        )}
                        <div className="admin-content-card-meta">
                          <span className="admin-content-card-date">
                            {formatDate(item.createdAt)}
                          </span>
                          {item.viewCount !== undefined && (
                            <span className="admin-content-card-views">
                              <ViewIcon /> {item.viewCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="admin-content-card-actions">
                        <Link 
                          to={`/admin/content/${activeTab === 'articles' ? 'articles' : 'patterns'}/${item.id}/edit`}
                          className="admin-card-btn"
                          title="Edit"
                        >
                          <EditIcon /> Edit
                        </Link>
                        <button 
                          className="admin-card-btn admin-card-btn--danger"
                          onClick={() => setDeletingItem(item)}
                          title="Delete"
                        >
                          <TrashIcon /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-empty">
                  <div className="admin-empty-icon">
                    {activeTab === 'articles' ? <ArticleIcon /> : <PatternIcon />}
                  </div>
                  <h3>No {activeTab} found</h3>
                  <p>
                    {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : `Get started by creating your first ${activeTab === 'articles' ? 'article' : 'pattern'}`
                    }
                  </p>
                  <Link 
                    to={`/admin/content/${activeTab === 'articles' ? 'articles' : 'patterns'}/new`}
                    className="button is-icon is-small"
                  >
                    <PlusIcon /> Create {activeTab === 'articles' ? 'Article' : 'Pattern'}
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Delete Modal */}
          {deletingItem && (
            <DeleteModal
              item={deletingItem}
              type={activeTab === 'articles' ? 'article' : 'pattern'}
              onClose={() => setDeletingItem(null)}
              onConfirm={handleDelete}
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

export default ContentManagementPage;
