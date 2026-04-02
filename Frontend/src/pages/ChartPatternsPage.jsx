/**
 * Chart Patterns Page
 * Displays chart patterns with images and explanations
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

// Pattern type configuration with colors
const PATTERN_TYPES = [
  { id: 'all', label: 'All Patterns', color: '#1e65fa' },
  { id: 'bullish', label: 'Bullish', color: '#26a69a' },
  { id: 'bearish', label: 'Bearish', color: '#ef5350' },
  { id: 'continuation', label: 'Continuation', color: '#7c3aed' },
  { id: 'reversal', label: 'Reversal', color: '#f59e0b' }
]

// Difficulty badge component
const DifficultyBadge = ({ difficulty }) => {
  const colors = {
    beginner: { bg: 'rgba(38, 166, 154, 0.1)', text: '#26a69a' },
    intermediate: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    advanced: { bg: 'rgba(239, 83, 80, 0.1)', text: '#ef5350' }
  }
  const style = colors[difficulty] || colors.beginner
  
  return (
    <span className="difficulty-badge" style={{
      backgroundColor: style.bg,
      color: style.text,
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      textTransform: 'capitalize'
    }}>
      {difficulty}
    </span>
  )
}

// Reliability badge component
const ReliabilityBadge = ({ reliability }) => {
  const colors = {
    low: { bg: 'rgba(239, 83, 80, 0.1)', text: '#ef5350' },
    medium: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    high: { bg: 'rgba(38, 166, 154, 0.1)', text: '#26a69a' }
  }
  const style = colors[reliability] || colors.medium
  
  return (
    <span style={{
      backgroundColor: style.bg,
      color: style.text,
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      textTransform: 'capitalize'
    }}>
      {reliability} reliability
    </span>
  )
}

// Pattern type tag
const PatternTypeTag = ({ type }) => {
  const colors = {
    bullish: '#26a69a',
    bearish: '#ef5350',
    continuation: '#7c3aed',
    reversal: '#f59e0b'
  }
  
  return (
    <span style={{
      backgroundColor: colors[type] || '#1e65fa',
      color: 'white',
      padding: '0.25rem 0.625rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'capitalize'
    }}>
      {type}
    </span>
  )
}

// Bookmark button component
const BookmarkButton = ({ isBookmarked, onToggle, loading }) => (
  <button
    onClick={(e) => {
      e.stopPropagation()
      onToggle()
    }}
    disabled={loading}
    className="bookmark-btn"
    style={{
      background: 'transparent',
      border: 'none',
      cursor: loading ? 'wait' : 'pointer',
      padding: '0.5rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s ease'
    }}
    title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
  >
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill={isBookmarked ? '#1e65fa' : 'none'} 
      stroke={isBookmarked ? '#1e65fa' : '#666'} 
      strokeWidth="2"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
  </button>
)

// Pattern card component
const PatternCard = ({ pattern, isBookmarked, onBookmarkToggle, bookmarkLoading, onClick }) => (
  <div 
    className="card_app_wrapper pattern-card"
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    {/* Image */}
    <div className="pattern-card__image">
      <img 
        src={pattern.imageUrl || 'https://via.placeholder.com/400x250?text=Chart+Pattern'} 
        alt={pattern.name}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/400x250?text=Chart+Pattern'
        }}
      />
      <div className="pattern-card__type-badge">
        <PatternTypeTag type={pattern.patternType} />
      </div>
    </div>
    
    {/* Content */}
    <div className="pattern-card__content">
      <h3 className="pattern-card__title">{pattern.name}</h3>
      <p className="pattern-card__excerpt">{pattern.excerpt}</p>
      
      <div className="pattern-card__footer">
        <div className="pattern-card__badges">
          <DifficultyBadge difficulty={pattern.difficulty} />
          <ReliabilityBadge reliability={pattern.reliability} />
        </div>
        <BookmarkButton 
          isBookmarked={isBookmarked} 
          onToggle={onBookmarkToggle}
          loading={bookmarkLoading}
        />
      </div>
    </div>
  </div>
)

// Empty state component
const EmptyState = ({ title, description }) => (
  <div className="empty-state">
    <div className="empty-state__icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    </div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
)

// Loading skeleton
const PatternCardSkeleton = () => (
  <div className="card_app_wrapper pattern-card pattern-card--skeleton">
    <div className="skeleton-pulse" style={{ height: '200px', backgroundColor: '#f0f0f0' }}></div>
    <div className="pattern-card__content">
      <div className="skeleton-pulse" style={{ height: '24px', width: '80%', marginBottom: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
      <div className="skeleton-pulse" style={{ height: '48px', width: '100%', marginBottom: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
      <div className="skeleton-pulse" style={{ height: '24px', width: '60%', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
    </div>
  </div>
)

// Error state
const ErrorState = ({ message, onRetry }) => (
  <div className="empty-state">
    <div className="empty-state__icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h3>Something went wrong</h3>
    <p>{message}</p>
    {onRetry && (
      <button className="admin-action-btn admin-action-btn--primary" onClick={onRetry} style={{ marginTop: '1rem' }}>
        Try Again
      </button>
    )}
  </div>
)

export default function ChartPatternsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { member } = useAuth()
  
  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [patterns, setPatterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all')
  const [bookmarks, setBookmarks] = useState({})
  const [bookmarkLoading, setBookmarkLoading] = useState({})
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  
  const userId = member?.id

  // Fetch patterns
  const fetchPatterns = useCallback(async (patternType = 'all', page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(patternType !== 'all' && { patternType })
      })
      
      const response = await fetch(`${API_BASE_URL}/api/resources/patterns?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch patterns')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPatterns(data.data)
        setPagination(data.pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch patterns')
      }
    } catch (err) {
      console.error('Error fetching patterns:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch user bookmarks (requires authentication)
  const fetchBookmarks = useCallback(async () => {
    if (!userId || !getAccessToken()) return
    
    try {
      const data = await apiRequest('/api/resources/bookmarks/ids')
      if (data.success) {
        setBookmarks(data.data)
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    fetchPatterns(activeType, 1)
    fetchBookmarks()
  }, [fetchPatterns, fetchBookmarks, activeType])

  // Handle type change
  const handleTypeChange = (typeId) => {
    setActiveType(typeId)
    setSearchParams(typeId !== 'all' ? { type: typeId } : {})
    fetchPatterns(typeId, 1)
  }

  // Handle bookmark toggle (requires authentication)
  const handleBookmarkToggle = async (patternId) => {
    if (!userId || !getAccessToken()) {
      navigate('/login')
      return
    }

    const bookmarkKey = `PATTERN_${patternId}`
    const isCurrentlyBookmarked = bookmarks[bookmarkKey]
    
    setBookmarkLoading(prev => ({ ...prev, [patternId]: true }))
    
    try {
      await apiRequest('/api/resources/bookmarks', {
        method: isCurrentlyBookmarked ? 'DELETE' : 'POST',
        body: JSON.stringify({
          resourceType: 'PATTERN',
          resourceId: patternId
        })
      })
      
      setBookmarks(prev => ({
        ...prev,
        [bookmarkKey]: !isCurrentlyBookmarked
      }))
    } catch (err) {
      console.error('Error toggling bookmark:', err)
    } finally {
      setBookmarkLoading(prev => ({ ...prev, [patternId]: false }))
    }
  }

  // Handle pattern click
  const handlePatternClick = (slug) => {
    navigate(`/resources/patterns/${slug}`)
  }

  // Handle search from navbar
  const handleSearch = (query) => {
    navigate(`/resources/search?q=${encodeURIComponent(query)}`)
  }

  // Handle sidebar navigation
  const handleSidebarNavigate = (path) => {
    navigate(path)
  }

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchPatterns(activeType, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onNavigate={handleSidebarNavigate} 
          activePage="resources-patterns" 
        />
        
        <div className="dashboard_main_wrapper">
          <Navbar 
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            onSearch={handleSearch}
          />
          
          <div className="dashboard_main_app">
            {/* Page Header */}
            <div className="page-header">
              <div className="page-header__content">
                <h1>Chart Patterns</h1>
                <p>Master technical analysis with our comprehensive chart pattern guide</p>
              </div>
              
              {/* Stats */}
              <div className="page-header__stats">
                <div className="stat-item">
                  <span className="stat-value">{pagination.total || 0}</span>
                  <span className="stat-label">Patterns</span>
                </div>
              </div>
            </div>

            {/* Pattern Type Tabs */}
            <div className="pattern-type-tabs">
              {PATTERN_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`pattern-type-tab ${activeType === type.id ? 'is-active' : ''}`}
                  style={activeType === type.id ? { 
                    '--tab-color': type.color,
                    '--tab-bg': `${type.color}15`
                  } : {}}
                >
                  {type.id !== 'all' && (
                    <span 
                      className="pattern-type-tab__dot"
                      style={{ backgroundColor: type.color }}
                    ></span>
                  )}
                  {type.label}
                </button>
              ))}
            </div>

            {/* Pattern Type Legend */}
            <div className="pattern-legend">
              <div className="pattern-legend__item">
                <span className="pattern-legend__dot" style={{ backgroundColor: '#26a69a' }}></span>
                <span>Bullish - Upward price movement expected</span>
              </div>
              <div className="pattern-legend__item">
                <span className="pattern-legend__dot" style={{ backgroundColor: '#ef5350' }}></span>
                <span>Bearish - Downward price movement expected</span>
              </div>
              <div className="pattern-legend__item">
                <span className="pattern-legend__dot" style={{ backgroundColor: '#7c3aed' }}></span>
                <span>Continuation - Trend likely to continue</span>
              </div>
              <div className="pattern-legend__item">
                <span className="pattern-legend__dot" style={{ backgroundColor: '#f59e0b' }}></span>
                <span>Reversal - Trend likely to change</span>
              </div>
            </div>

            {/* Content */}
            <div className="patterns-grid-container">
              {loading ? (
                <div className="patterns-grid">
                  {[...Array(6)].map((_, i) => (
                    <PatternCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <ErrorState 
                  message={error} 
                  onRetry={() => fetchPatterns(activeType, pagination.page)} 
                />
              ) : patterns.length === 0 ? (
                <EmptyState
                  title="No patterns found"
                  description={activeType !== 'all' 
                    ? `No ${activeType} patterns available yet.`
                    : "No chart patterns available at the moment. Check back soon!"
                  }
                />
              ) : (
                <>
                  <div className="patterns-grid">
                    {patterns.map((pattern) => (
                      <PatternCard
                        key={pattern.id}
                        pattern={pattern}
                        isBookmarked={!!bookmarks[`PATTERN_${pattern.id}`]}
                        onBookmarkToggle={() => handleBookmarkToggle(pattern.id)}
                        bookmarkLoading={bookmarkLoading[pattern.id]}
                        onClick={() => handlePatternClick(pattern.slug)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination__btn"
                        disabled={pagination.page === 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                      >
                        ← Previous
                      </button>
                      <span className="pagination__info">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        className="pagination__btn"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
