/**
 * Bookmarks Page
 * Displays user's saved articles and chart patterns
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest, getAccessToken } from '../services/api'
import Sidebar from '../Components/Dashboard Pages/Sidebar'
import Navbar from '../Components/Dashboard Pages/Navbar'

const getApiBaseUrl = () => {
  const viteUrl = import.meta.env.VITE_API_URL;
  return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
};
const API_BASE_URL = getApiBaseUrl()

// Tab component
const TabButton = ({ label, count, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`bookmark-tab ${isActive ? 'is-active' : ''}`}
  >
    {icon}
    {label}
    {count !== undefined && (
      <span className="bookmark-tab__count">{count}</span>
    )}
  </button>
)

// Article bookmark card
const ArticleBookmarkCard = ({ bookmark, onRemove, removing, onClick }) => {
  const article = bookmark.resource
  if (!article) return null
  
  return (
    <div className="card_app_wrapper article-card" onClick={onClick}>
      {/* Thumbnail */}
      <div className="article-card__thumbnail">
        <img 
          src={article.thumbnailUrl || 'https://via.placeholder.com/400x200?text=Article'} 
          alt={article.title}
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Article' }}
        />
        {article.youtubeUrl && (
          <div className="article-card__video-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Video
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="article-card__content">
        <div className="article-card__meta">
          <span className="article-card__category">{article.category?.replace('-', ' ')}</span>
          <span className="article-card__read-time">{article.readTime} min read</span>
        </div>
        
        <h3 className="article-card__title">{article.title}</h3>
        <p className="article-card__excerpt">{article.excerpt}</p>
        
        <div className="article-card__footer">
          <div className="article-card__tags">
            <span className="article-card__tag">Saved {new Date(bookmark.addedAt).toLocaleDateString()}</span>
          </div>
          <div className="article-card__actions">
            <span 
              className="difficulty-badge"
              style={{
                backgroundColor: article.difficulty === 'beginner' ? 'rgba(38, 166, 154, 0.1)' : 
                               article.difficulty === 'intermediate' ? 'rgba(245, 158, 11, 0.1)' : 
                               'rgba(239, 83, 80, 0.1)',
                color: article.difficulty === 'beginner' ? '#26a69a' : 
                       article.difficulty === 'intermediate' ? '#f59e0b' : 
                       '#ef5350',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {article.difficulty}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              disabled={removing}
              className="bookmark-btn"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: removing ? 'wait' : 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease'
              }}
              title="Remove bookmark"
            >
              {removing ? (
                <div className="spinner-small"></div>
              ) : (
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="#1e65fa" 
                  stroke="#1e65fa" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Pattern bookmark card
const PatternBookmarkCard = ({ bookmark, onRemove, removing, onClick }) => {
  const pattern = bookmark.resource
  if (!pattern) return null
  
  const typeColors = {
    bullish: { bg: 'rgba(38, 166, 154, 0.1)', text: '#26a69a' },
    bearish: { bg: 'rgba(239, 83, 80, 0.1)', text: '#ef5350' },
    continuation: { bg: 'rgba(124, 58, 237, 0.1)', text: '#7c3aed' },
    reversal: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }
  }
  
  const typeStyle = typeColors[pattern.patternType] || typeColors.continuation
  
  return (
    <div className="card_app_wrapper pattern-card" onClick={onClick}>
      {/* Thumbnail */}
      <div className="pattern-card__thumbnail">
        <img 
          src={pattern.imageUrl || 'https://via.placeholder.com/400x200?text=Pattern'} 
          alt={pattern.name}
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Pattern' }}
        />
        <div className="pattern-card__type-badge" style={{backgroundColor: 'rgb(38, 166, 154)', color: 'white', padding: '0.25rem 0.625rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize'}}>
          {pattern.patternType}
        </div>
      </div>
      
      {/* Content */}
      <div className="pattern-card__content">
        <div className="pattern-card__meta">
          <span className="pattern-card__reliability">{pattern.reliability} reliability</span>
        </div>
        
        <h3 className="pattern-card__title">{pattern.name}</h3>
        <p className="pattern-card__excerpt">{pattern.excerpt}</p>
        
        <div className="pattern-card__footer">
          <div className="pattern-card__info">
            <span className="pattern-card__tag">Saved {new Date(bookmark.addedAt).toLocaleDateString()}</span>
          </div>
          <div className="pattern-card__actions">
            <span 
              className="difficulty-badge"
              style={{
                backgroundColor: pattern.difficulty === 'beginner' ? 'rgba(38, 166, 154, 0.1)' : 
                               pattern.difficulty === 'intermediate' ? 'rgba(245, 158, 11, 0.1)' : 
                               'rgba(239, 83, 80, 0.1)',
                color: pattern.difficulty === 'beginner' ? '#26a69a' : 
                       pattern.difficulty === 'intermediate' ? '#f59e0b' : 
                       '#ef5350',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {pattern.difficulty}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              disabled={removing}
              className="bookmark-btn"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: removing ? 'wait' : 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease'
              }}
              title="Remove bookmark"
            >
              {removing ? (
                <div className="spinner-small"></div>
              ) : (
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="#1e65fa" 
                  stroke="#1e65fa" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Empty state
const EmptyState = ({ type, onBrowse }) => {
  const config = {
    all: {
      title: "No bookmarks yet",
      description: "Start saving articles and chart patterns to access them quickly later.",
      actions: [
        { label: "Browse Articles", path: "/resources/learning" },
        { label: "Browse Patterns", path: "/resources/patterns" }
      ]
    },
    articles: {
      title: "No articles saved",
      description: "Browse our learning platform and save articles you want to read later.",
      actions: [{ label: "Browse Articles", path: "/resources/learning" }]
    },
    patterns: {
      title: "No patterns saved",
      description: "Explore chart patterns and save the ones you want to reference later.",
      actions: [{ label: "Browse Patterns", path: "/resources/patterns" }]
    }
  }
  
  const content = config[type] || config.all
  
  return (
    <div className="bookmarks-empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
      <h3>{content.title}</h3>
      <p>{content.description}</p>
      <div className="bookmarks-empty-actions">
        {content.actions.map((action, i) => (
          <button 
            key={i}
            className="admin-action-btn admin-action-btn--secondary"
            onClick={() => onBrowse(action.path)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Loading skeleton
const BookmarkCardSkeleton = () => (
  <div className="card_app_wrapper article-card">
    <div className="skeleton-pulse" style={{ width: '100%', height: '180px', backgroundColor: '#f0f0f0' }}></div>
    <div className="article-card__content">
      <div className="skeleton-pulse" style={{ width: '50%', height: '14px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.75rem' }}></div>
      <div className="skeleton-pulse" style={{ width: '80%', height: '22px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
      <div className="skeleton-pulse" style={{ width: '100%', height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
      <div className="skeleton-pulse" style={{ width: '90%', height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem' }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton-pulse" style={{ width: '40%', height: '14px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
        <div className="skeleton-pulse" style={{ width: '60px', height: '24px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
      </div>
    </div>
  </div>
)

// Error state
const ErrorState = ({ message, onRetry }) => (
  <div className="bookmarks-error-state">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <h3>Failed to load bookmarks</h3>
    <p>{message}</p>
    {onRetry && (
      <button className="admin-action-btn admin-action-btn--primary" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
)

export default function BookmarksPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { member, isAuthenticated } = useAuth()
  
  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all')
  const [removingIds, setRemovingIds] = useState({})
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  
  const userId = member?.id

  // Counts
  const articleCount = bookmarks.filter(b => b.resourceType === 'ARTICLE').length
  const patternCount = bookmarks.filter(b => b.resourceType === 'PATTERN').length

  // Fetch bookmarks (requires authentication)
  const fetchBookmarks = useCallback(async () => {
    if (!userId || !getAccessToken()) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await apiRequest('/api/resources/bookmarks?limit=50')
      
      if (data.success) {
        setBookmarks(data.data || [])
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })
      } else {
        throw new Error(data.error || 'Failed to fetch bookmarks')
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchBookmarks()
  }, [fetchBookmarks, isAuthenticated, navigate])

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams(tab !== 'all' ? { type: tab } : {})
  }

  // Handle remove bookmark (requires authentication)
  const handleRemoveBookmark = async (bookmark) => {
    const key = `${bookmark.resourceType}_${bookmark.resourceId}`
    setRemovingIds(prev => ({ ...prev, [key]: true }))
    
    try {
      await apiRequest('/api/resources/bookmarks', {
        method: 'DELETE',
        body: JSON.stringify({
          resourceType: bookmark.resourceType,
          resourceId: bookmark.resourceId
        })
      })
      
      setBookmarks(prev => prev.filter(b => b.id !== bookmark.id))
    } catch (err) {
      console.error('Error removing bookmark:', err)
    } finally {
      setRemovingIds(prev => ({ ...prev, [key]: false }))
    }
  }

  // Handle search from navbar
  const handleSearch = (query) => {
    navigate(`/resources/search?q=${encodeURIComponent(query)}`)
  }

  // Handle sidebar navigation
  const handleSidebarNavigate = (path) => {
    navigate(path)
  }

  // Filter bookmarks based on active tab
  const getFilteredBookmarks = () => {
    switch (activeTab) {
      case 'articles':
        return bookmarks.filter(b => b.resourceType === 'ARTICLE')
      case 'patterns':
        return bookmarks.filter(b => b.resourceType === 'PATTERN')
      default:
        return bookmarks
    }
  }

  const filteredBookmarks = getFilteredBookmarks()

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onNavigate={handleSidebarNavigate} 
          activePage="resources-bookmarks" 
        />
        
        <div className="dashboard_main_wrapper">
          <Navbar 
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            onSearch={handleSearch}
          />
          
          <div className="dashboard_main_app">
            {/* Page Header */}
            <div className="bookmarks-header">
              <div className="bookmarks-header__content">
                <h1>My Bookmarks</h1>
                <p>Your saved articles and chart patterns for quick reference</p>
              </div>
              
              {/* Stats */}
              <div className="bookmarks-header__stats">
                <div className="stat-item">
                  <span className="stat-value">{bookmarks.length}</span>
                  <span className="stat-label">Total Saved</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bookmarks-tabs">
              <TabButton 
                label="All" 
                count={bookmarks.length}
                isActive={activeTab === 'all'}
                onClick={() => handleTabChange('all')}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                }
              />
              <TabButton 
                label="Articles" 
                count={articleCount}
                isActive={activeTab === 'articles'}
                onClick={() => handleTabChange('articles')}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                }
              />
              <TabButton 
                label="Patterns" 
                count={patternCount}
                isActive={activeTab === 'patterns'}
                onClick={() => handleTabChange('patterns')}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                }
              />
            </div>

            {/* Content */}
            <div className="bookmarks-container">
              {loading ? (
                <div className="articles-grid">
                  {[...Array(3)].map((_, i) => (
                    <BookmarkCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <ErrorState 
                  message={error} 
                  onRetry={fetchBookmarks} 
                />
              ) : filteredBookmarks.length === 0 ? (
                <EmptyState 
                  type={activeTab} 
                  onBrowse={(path) => navigate(path)}
                />
              ) : (
                <div className="articles-grid">
                  {filteredBookmarks.map((bookmark) => {
                    const key = `${bookmark.resourceType}_${bookmark.resourceId}`
                    
                    if (bookmark.resourceType === 'ARTICLE') {
                      return (
                        <ArticleBookmarkCard
                          key={bookmark.id}
                          bookmark={bookmark}
                          onRemove={() => handleRemoveBookmark(bookmark)}
                          removing={removingIds[key]}
                          onClick={() => navigate(`/resources/learning/${bookmark.resource?.slug}`)}
                        />
                      )
                    } else if (bookmark.resourceType === 'PATTERN') {
                      return (
                        <PatternBookmarkCard
                          key={bookmark.id}
                          bookmark={bookmark}
                          onRemove={() => handleRemoveBookmark(bookmark)}
                          removing={removingIds[key]}
                          onClick={() => navigate(`/resources/patterns/${bookmark.resource?.slug}`)}
                        />
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
