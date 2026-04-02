import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../Components/Dashboard Pages/Sidebar';
import Navbar from '../../Components/Dashboard Pages/Navbar';
import RichTextEditor from '../../Components/Admin/RichTextEditor';
import CustomSelect from '../../Components/Admin/CustomSelect';

// Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12,19 5,12 12,5" />
  </svg>
);

const SaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
);

const DraftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CATEGORIES = [
  'Getting Started',
  'Trading Basics',
  'Technical Analysis',
  'Risk Management',
  'Market Psychology',
  'Advanced Strategies',
  'News & Updates'
];

const ArticleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { member } = useAuth();
  const isEditing = Boolean(id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    imageUrl: '',
    readTime: '',
    status: 'draft'
  });
  const [changeMessage, setChangeMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setFetching(true);
      setError(null);

      const { getArticle } = await import('../../services/adminApi');
      const result = await getArticle(id);
      const article = result.data || result;
      
      setFormData({
        title: article.title || '',
        description: article.description || article.excerpt || '',
        content: article.content || '',
        category: article.category || '',
        imageUrl: article.imageUrl || article.thumbnailUrl || '',
        readTime: article.readTime || '',
        status: article.status || (article.published ? 'published' : 'draft')
      });
    } catch (err) {
      console.error('Error fetching article:', err);
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
  };

  const handleSubmit = async (status) => {
    try {
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        status: status || formData.status,
        ...(isEditing && changeMessage.trim() && { changeMessage: changeMessage.trim() })
      };

      const { createArticle, updateArticle } = await import('../../services/adminApi');
      
      if (isEditing) {
        await updateArticle(id, payload);
      } else {
        await createArticle(payload);
      }

      setSaveSuccess(true);
      setChangeMessage('');
      
      // If publishing, redirect to content management
      if (status === 'published') {
        setTimeout(() => {
          navigate('/admin/content?tab=articles');
        }, 1000);
      }
    } catch (err) {
      console.error('Error saving article:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-wrapper">
        <div className="main-wrapper is-dashboard">
          <Sidebar isOpen={isSidebarOpen} onNavigate={(path) => navigate(path)} activePage="admin-content" />
          <div className="dashboard_main_wrapper">
            <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
            <div className="dashboard_main_app">
              <div className="admin-form-page">
                <div className="admin-loading">
                  <div className="admin-loading-spinner"></div>
                  <p>Loading article...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar isOpen={isSidebarOpen} onNavigate={(path) => navigate(path)} activePage="admin-content" />
        <div className="dashboard_main_wrapper">
          <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
          <div className="dashboard_main_app">
            <div className="admin-form-page">
              <div className="admin-form-header">
                <button 
                  className="button is-secondary is-icon is-small"
                  onClick={() => navigate('/admin/content?tab=articles')}
                >
                  <ArrowLeftIcon /> Back to Articles
                </button>
                <h1>{isEditing ? 'Edit Article' : 'Create New Article'}</h1>
              </div>

              {error && (
                <div className="admin-form-error">
                  {error}
                </div>
              )}

              {saveSuccess && (
                <div className="admin-form-success">
                  Article saved successfully!
                </div>
              )}

              <div className="admin-form-container">
                <div className="admin-form-main">
                  {/* Title */}
                  <div className="admin-form-group">
                    <label>Title <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => handleChange('title', e.target.value)}
                      className="admin-input admin-input--large"
                      placeholder="Enter article title..."
                    />
                  </div>

                  {/* Description */}
                  <div className="admin-form-group">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => handleChange('description', e.target.value)}
                      className="admin-textarea"
                      placeholder="Brief description of the article..."
                      rows={3}
                    />
                  </div>

                  {/* Content */}
                  <div className="admin-form-group">
                    <label>Content</label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={value => handleChange('content', value)}
                      placeholder="Write your article content here..."
                      minHeight="400px"
                    />
                  </div>
                </div>

                <div className="admin-form-sidebar">
                  {/* Status */}
                  <div className="admin-sidebar-card">
                    <h3>Status</h3>
                    <div className="admin-status-selector">
                      <label className={`admin-status-option ${formData.status === 'draft' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={formData.status === 'draft'}
                          onChange={e => handleChange('status', e.target.value)}
                        />
                        <DraftIcon />
                        <span>Draft</span>
                      </label>
                      <label className={`admin-status-option ${formData.status === 'published' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="status"
                          value="published"
                          checked={formData.status === 'published'}
                          onChange={e => handleChange('status', e.target.value)}
                        />
                        <SaveIcon />
                        <span>Published</span>
                      </label>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="admin-sidebar-card">
                    <h3>Category</h3>
                    <CustomSelect
                      value={formData.category}
                      onChange={(value) => handleChange('category', value)}
                      options={[
                        { value: '', label: 'Select category...' },
                        ...CATEGORIES.map(cat => ({ value: cat, label: cat }))
                      ]}
                      placeholder="Select category..."
                    />
                  </div>

                  {/* Image URL */}
                  <div className="admin-sidebar-card">
                    <h3>Featured Image</h3>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={e => handleChange('imageUrl', e.target.value)}
                      className="admin-input"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.imageUrl && (
                      <div className="admin-image-preview">
                        <img 
                          src={formData.imageUrl} 
                          alt="Preview" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Read Time */}
                  <div className="admin-sidebar-card">
                    <h3>Read Time</h3>
                    <input
                      type="text"
                      value={formData.readTime}
                      onChange={e => handleChange('readTime', e.target.value)}
                      className="admin-input"
                      placeholder="e.g., 5 min read"
                    />
                  </div>

                  {/* Change Message (only when editing) */}
                  {isEditing && (
                    <div className="admin-sidebar-card">
                      <h3>Change Details</h3>
                      <textarea
                        value={changeMessage}
                        onChange={e => setChangeMessage(e.target.value)}
                        className="admin-textarea"
                        placeholder="Describe what you changed (e.g., Updated pricing section, Fixed typos...)"
                        rows={3}
                      />
                      <span className="admin-input-hint">This will be logged in the audit trail</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--secondary"
                      onClick={() => handleSubmit('draft')}
                      disabled={loading}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <DraftIcon /> Save as Draft
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--primary"
                      onClick={() => handleSubmit('published')}
                      disabled={loading}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <SaveIcon /> {loading ? 'Saving...' : 'Publish'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleFormPage;
