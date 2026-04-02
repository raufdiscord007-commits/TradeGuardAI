import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../Components/Dashboard Pages/Sidebar';
import Navbar from '../../Components/Dashboard Pages/Navbar';
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

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const DIFFICULTY_LEVELS = [
  { value: 'Beginner', label: 'Beginner', color: '#10b981' },
  { value: 'Intermediate', label: 'Intermediate', color: '#f59e0b' },
  { value: 'Advanced', label: 'Advanced', color: '#ef4444' }
];

const PatternFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { member } = useAuth();
  const isEditing = Boolean(id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    excerpt: '',
    description: '',
    patternType: 'Bullish',
    difficulty: 'Beginner',
    imageUrl: '',
    keyPoints: [''],
    howToTrade: '',
    reliability: 'Medium',
    status: 'Draft'
  });
  const [changeMessage, setChangeMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchPattern();
    }
  }, [id]);

  const fetchPattern = async () => {
    try {
      setFetching(true);
      setError(null);

      const { getPattern } = await import('../../services/adminApi');
      const result = await getPattern(id);
      const pattern = result.data || result;
      
      setFormData({
        name: pattern.name || '',
        excerpt: pattern.excerpt || '',
        description: pattern.description || '',
        patternType: pattern.patternType || 'bullish',
        difficulty: pattern.difficulty || 'beginner',
        imageUrl: pattern.imageUrl || '',
        keyPoints: pattern.keyPoints?.length > 0 ? pattern.keyPoints : [''],
        howToTrade: pattern.howToTrade || '',
        reliability: pattern.reliability || 'medium',
        status: pattern.published ? 'published' : 'draft'
      });
    } catch (err) {
      console.error('Error fetching pattern:', err);
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

  const handleKeyPointChange = (index, value) => {
    const newKeyPoints = [...formData.keyPoints];
    newKeyPoints[index] = value;
    setFormData(prev => ({
      ...prev,
      keyPoints: newKeyPoints
    }));
    setSaveSuccess(false);
  };

  const addKeyPoint = () => {
    setFormData(prev => ({
      ...prev,
      keyPoints: [...prev.keyPoints, '']
    }));
  };

  const removeKeyPoint = (index) => {
    if (formData.keyPoints.length <= 1) return;
    const newKeyPoints = formData.keyPoints.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      keyPoints: newKeyPoints
    }));
  };

  const handleSubmit = async (status) => {
    try {
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }

      setLoading(true);
      setError(null);

      // Filter out empty key points
      const cleanKeyPoints = formData.keyPoints.filter(kp => kp.trim());

      const payload = {
        name: formData.name,
        excerpt: formData.excerpt,
        description: formData.description,
        patternType: formData.patternType,
        difficulty: formData.difficulty,
        imageUrl: formData.imageUrl,
        keyPoints: cleanKeyPoints,
        howToTrade: formData.howToTrade,
        reliability: formData.reliability,
        status: status || formData.status,
        ...(isEditing && changeMessage.trim() && { changeMessage: changeMessage.trim() })
      };

      const { createPattern, updatePattern } = await import('../../services/adminApi');
      
      if (isEditing) {
        await updatePattern(id, payload);
      } else {
        await createPattern(payload);
      }

      setSaveSuccess(true);
      setChangeMessage('');
      
      // If publishing, redirect to content management
      if (status === 'published') {
        setTimeout(() => {
          navigate('/admin/content?tab=patterns');
        }, 1000);
      }
    } catch (err) {
      console.error('Error saving pattern:', err);
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
                  <p>Loading pattern...</p>
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
              onClick={() => navigate('/admin/content?tab=patterns')}
            >
              <ArrowLeftIcon /> Back to Patterns
            </button>
            <h1>{isEditing ? 'Edit Pattern' : 'Create New Pattern'}</h1>
          </div>

          {error && (
            <div className="admin-form-error">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="admin-form-success">
              Pattern saved successfully!
            </div>
          )}

          <div className="admin-form-container">
            <div className="admin-form-main">
              {/* Name */}
              <div className="admin-form-group">
                <label>Pattern Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="admin-input admin-input--large"
                  placeholder="Enter pattern name..."
                />
              </div>

              {/* Excerpt */}
              <div className="admin-form-group">
                <label>Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={e => handleChange('excerpt', e.target.value)}
                  className="admin-textarea"
                  placeholder="Brief summary of the pattern..."
                  rows={2}
                />
              </div>

              {/* Description */}
              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  className="admin-textarea admin-textarea--large"
                  placeholder="Detailed description of the pattern, how to identify it..."
                  rows={6}
                />
              </div>

              {/* How to Trade */}
              <div className="admin-form-group">
                <label>How to Trade</label>
                <textarea
                  value={formData.howToTrade}
                  onChange={e => handleChange('howToTrade', e.target.value)}
                  className="admin-textarea"
                  placeholder="Trading strategy for this pattern..."
                  rows={4}
                />
              </div>

              {/* Key Points */}
              <div className="admin-form-group">
                <label>Key Points</label>
                <div className="admin-key-points">
                  {formData.keyPoints.map((point, index) => (
                    <div key={index} className="admin-key-point-row">
                      <span className="admin-key-point-number">{index + 1}</span>
                      <input
                        type="text"
                        value={point}
                        onChange={e => handleKeyPointChange(index, e.target.value)}
                        className="admin-input"
                        placeholder="Enter a key point..."
                      />
                      {formData.keyPoints.length > 1 && (
                        <button
                          type="button"
                          className="admin-key-point-remove"
                          onClick={() => removeKeyPoint(index)}
                          title="Remove"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="admin-add-key-point"
                    onClick={addKeyPoint}
                  >
                    <PlusIcon /> Add Key Point
                  </button>
                </div>
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

              {/* Pattern Type */}
              <div className="admin-sidebar-card">
                <h3>Pattern Type</h3>
                <CustomSelect
                  value={formData.patternType}
                  onChange={(value) => handleChange('patternType', value)}
                  options={[
                    { value: 'bullish', label: 'Bullish' },
                    { value: 'bearish', label: 'Bearish' },
                    { value: 'continuation', label: 'Continuation' },
                    { value: 'reversal', label: 'Reversal' }
                  ]}
                  placeholder="Select pattern type..."
                />
              </div>

              {/* Reliability */}
              <div className="admin-sidebar-card">
                <h3>Reliability</h3>
                <CustomSelect
                  value={formData.reliability}
                  onChange={(value) => handleChange('reliability', value)}
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' }
                  ]}
                  placeholder="Select reliability..."
                />
              </div>

              {/* Difficulty */}
              <div className="admin-sidebar-card">
                <h3>Difficulty Level</h3>
                <div className="admin-difficulty-selector">
                  {DIFFICULTY_LEVELS.map(level => (
                    <label 
                      key={level.value}
                      className={`admin-difficulty-option ${formData.difficulty === level.value ? 'active' : ''}`}
                      style={{ 
                        '--difficulty-color': level.color,
                        borderColor: formData.difficulty === level.value ? level.color : '#e5e5e7'
                      }}
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={level.value}
                        checked={formData.difficulty === level.value}
                        onChange={e => handleChange('difficulty', e.target.value)}
                      />
                      <span style={{ color: formData.difficulty === level.value ? level.color : '#858c95' }}>
                        {level.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Image URL */}
              <div className="admin-sidebar-card">
                <h3>Pattern Image</h3>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={e => handleChange('imageUrl', e.target.value)}
                  className="admin-input"
                  placeholder="https://example.com/pattern.jpg"
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

              {/* Change Message (only when editing) */}
              {isEditing && (
                <div className="admin-sidebar-card">
                  <h3>Change Details</h3>
                  <textarea
                    value={changeMessage}
                    onChange={e => setChangeMessage(e.target.value)}
                    className="admin-textarea"
                    placeholder="Describe what you changed (e.g., Updated pattern image, Added key points...)"
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

export default PatternFormPage;
