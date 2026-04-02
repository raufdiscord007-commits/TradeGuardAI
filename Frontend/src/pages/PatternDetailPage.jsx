/**
 * Pattern Detail Page
 * Displays a single chart pattern with full explanation and key points
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest, getAccessToken } from '../services/api'
import Sidebar from '../Components/Dashboard Pages/Sidebar'
import Navbar from '../Components/Dashboard Pages/Navbar'

const getApiBaseUrl = () => {
  const viteUrl = import.meta.env.VITE_API_URL;
  return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
};
const API_BASE_URL = getApiBaseUrl()

// Difficulty badge component
const DifficultyBadge = ({ difficulty, large = false }) => {
  const colors = {
    beginner: { bg: 'rgba(38, 166, 154, 0.1)', text: '#26a69a' },
    intermediate: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    advanced: { bg: 'rgba(239, 83, 80, 0.1)', text: '#ef5350' }
  }
  const style = colors[difficulty] || colors.beginner
  
  return (
    <span style={{
      backgroundColor: style.bg,
      color: style.text,
      padding: large ? '0.5rem 1rem' : '0.375rem 0.75rem',
      borderRadius: '0.375rem',
      fontSize: large ? '0.875rem' : '0.75rem',
      fontWeight: '500',
      textTransform: 'capitalize'
    }}>
      {difficulty}
    </span>
  )
}

// Reliability indicator component
const ReliabilityIndicator = ({ reliability }) => {
  const levels = {
    low: { filled: 1, color: '#ef5350', label: 'Low Reliability' },
    medium: { filled: 2, color: '#f59e0b', label: 'Medium Reliability' },
    high: { filled: 3, color: '#26a69a', label: 'High Reliability' }
  }
  const level = levels[reliability] || levels.medium
  
  return (
    <div className="reliability-indicator">
      <div className="reliability-indicator__bars">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="reliability-indicator__bar"
            style={{ 
              backgroundColor: i <= level.filled ? level.color : '#e5e5e7',
              height: `${12 + (i * 4)}px`
            }}
          ></div>
        ))}
      </div>
      <span className="reliability-indicator__label" style={{ color: level.color }}>
        {level.label}
      </span>
    </div>
  )
}

// Pattern type tag
const PatternTypeTag = ({ type, large = false }) => {
  const colors = {
    bullish: { bg: '#26a69a', label: 'Bullish Pattern' },
    bearish: { bg: '#ef5350', label: 'Bearish Pattern' },
    continuation: { bg: '#7c3aed', label: 'Continuation Pattern' },
    reversal: { bg: '#f59e0b', label: 'Reversal Pattern' }
  }
  const config = colors[type] || { bg: '#1e65fa', label: type }
  
  return (
    <span style={{
      backgroundColor: config.bg,
      color: 'white',
      padding: large ? '0.5rem 1rem' : '0.375rem 0.75rem',
      borderRadius: '0.375rem',
      fontSize: large ? '0.875rem' : '0.75rem',
      fontWeight: '600'
    }}>
      {config.label}
    </span>
  )
}

// Bookmark button component
const BookmarkButton = ({ isBookmarked, onToggle, loading }) => (
  <button
    onClick={onToggle}
    disabled={loading}
    className="bookmark-btn-large"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.25rem',
      border: isBookmarked ? '1px solid #1e65fa' : '1px solid #e5e5e7',
      background: isBookmarked ? 'rgba(30, 101, 250, 0.05)' : 'white',
      borderRadius: '0.5rem',
      color: isBookmarked ? '#1e65fa' : '#666',
      cursor: loading ? 'wait' : 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: '500'
    }}
  >
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill={isBookmarked ? '#1e65fa' : 'none'} 
      stroke={isBookmarked ? '#1e65fa' : 'currentColor'} 
      strokeWidth="2"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
    {isBookmarked ? 'Saved' : 'Save Pattern'}
  </button>
)

// Key point item
const KeyPointItem = ({ point, index }) => (
  <li className="key-point-item">
    <span className="key-point-item__number">{index + 1}</span>
    <span className="key-point-item__text">{point}</span>
  </li>
)

// Related pattern card
const RelatedPatternCard = ({ pattern, onClick }) => (
  <div className="related-pattern-card" onClick={onClick}>
    <div className="related-pattern-card__image">
      <img 
        src={pattern.imageUrl || 'https://via.placeholder.com/200x120?text=Pattern'} 
        alt={pattern.name}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/200x120?text=Pattern' }}
      />
    </div>
    <div className="related-pattern-card__content">
      <h4>{pattern.name}</h4>
      <span className="related-pattern-card__meta">
        {pattern.difficulty} · {pattern.reliability} reliability
      </span>
    </div>
  </div>
)

// Loading skeleton
const PatternDetailSkeleton = () => (
  <div className="pattern-detail-skeleton">
    <div className="skeleton-pulse" style={{ height: '400px', backgroundColor: '#f0f0f0', borderRadius: '0.75rem', marginBottom: '1.5rem' }}></div>
    <div className="skeleton-pulse" style={{ height: '48px', width: '60%', backgroundColor: '#f0f0f0', borderRadius: '0.5rem', marginBottom: '1rem' }}></div>
    <div className="skeleton-pulse" style={{ height: '100px', backgroundColor: '#f0f0f0', borderRadius: '0.5rem', marginBottom: '1.5rem' }}></div>
    <div className="skeleton-pulse" style={{ height: '200px', backgroundColor: '#f0f0f0', borderRadius: '0.5rem' }}></div>
  </div>
)

// Error state
const ErrorState = ({ message, onBack }) => (
  <div className="error-state-detail">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <h2>Pattern Not Found</h2>
    <p>{message}</p>
    <button className="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Chart Patterns
    </button>
  </div>
)

// Image modal for full-size view
const ImageModal = ({ src, alt, onClose }) => (
  <div className="image-modal" onClick={onClose}>
    <button className="image-modal__close" onClick={onClose}>×</button>
    <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
  </div>
)

export default function PatternDetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { member } = useAuth()
  
  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pattern, setPattern] = useState(null)
  const [relatedPatterns, setRelatedPatterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState({ src: '', alt: '' })
  
  const userId = member?.id

  // Fetch pattern
  const fetchPattern = useCallback(async () => {
    if (!slug) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/resources/patterns/${slug}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('This chart pattern could not be found.')
        }
        throw new Error('Failed to fetch pattern')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPattern(data.data.pattern)
        setRelatedPatterns(data.data.relatedPatterns || [])
      } else {
        throw new Error(data.error || 'Failed to fetch pattern')
      }
    } catch (err) {
      console.error('Error fetching pattern:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  // Check bookmark status (requires authentication)
  const checkBookmarkStatus = useCallback(async () => {
    if (!userId || !pattern?.id || !getAccessToken()) return
    
    try {
      const data = await apiRequest(
        `/api/resources/bookmarks/check?resourceType=PATTERN&resourceId=${pattern.id}`
      )
      setIsBookmarked(data.data?.isBookmarked || false)
    } catch (err) {
      console.error('Error checking bookmark status:', err)
    }
  }, [userId, pattern?.id])

  // Initial load
  useEffect(() => {
    fetchPattern()
  }, [fetchPattern])

  // Check bookmark after pattern loads
  useEffect(() => {
    if (pattern?.id) {
      checkBookmarkStatus()
    }
  }, [pattern?.id, checkBookmarkStatus])

  // Handle bookmark toggle (requires authentication)
  const handleBookmarkToggle = async () => {
    if (!userId || !getAccessToken()) {
      navigate('/login')
      return
    }

    if (!pattern?.id) return
    
    setBookmarkLoading(true)
    
    try {
      await apiRequest('/api/resources/bookmarks', {
        method: isBookmarked ? 'DELETE' : 'POST',
        body: JSON.stringify({
          resourceType: 'PATTERN',
          resourceId: pattern.id
        })
      })
      
      setIsBookmarked(!isBookmarked)
    } catch (err) {
      console.error('Error toggling bookmark:', err)
    } finally {
      setBookmarkLoading(false)
    }
  }

  // Handle image click for modal
  const handleImageClick = (src, alt) => {
    setModalImage({ src, alt })
    setShowImageModal(true)
  }

  // Handle search from navbar
  const handleSearch = (query) => {
    navigate(`/resources/search?q=${encodeURIComponent(query)}`)
  }

  // Handle sidebar navigation
  const handleSidebarNavigate = (path) => {
    navigate(path)
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
            {loading ? (
              <PatternDetailSkeleton />
            ) : error ? (
              <ErrorState 
                message={error} 
                onBack={() => navigate('/resources/patterns')}
              />
            ) : pattern ? (
              <div className="pattern-detail-layout">
                {/* Main Content */}
                <div className="pattern-detail">
                  {/* Breadcrumb */}
                  <nav className="breadcrumb">
                    <Link to="/resources/patterns">Chart Patterns</Link>
                    <span className="breadcrumb__separator">/</span>
                    <span className="breadcrumb__current">{pattern.patternType}</span>
                  </nav>

                  {/* Main Image */}
                  <div 
                    className="pattern-detail__image"
                    onClick={() => handleImageClick(pattern.imageUrl, pattern.name)}
                  >
                    <img 
                      src={pattern.imageUrl || 'https://via.placeholder.com/800x500?text=Chart+Pattern'} 
                      alt={pattern.name}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/800x500?text=Chart+Pattern' }}
                    />
                    <div className="pattern-detail__image-overlay">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                      </svg>
                      <span>Click to enlarge</span>
                    </div>
                  </div>

                  {/* Header */}
                  <header className="pattern-detail__header">
                    <div className="pattern-detail__badges">
                      <PatternTypeTag type={pattern.patternType} large />
                      <DifficultyBadge difficulty={pattern.difficulty} large />
                    </div>
                    
                    <h1 className="pattern-detail__title">{pattern.name}</h1>
                    
                    <div className="pattern-detail__meta-row">
                      <ReliabilityIndicator reliability={pattern.reliability} />
                      <span className="pattern-detail__views">{pattern.viewCount || 0} views</span>
                    </div>

                    <div className="pattern-detail__actions">
                      <BookmarkButton 
                        isBookmarked={isBookmarked}
                        onToggle={handleBookmarkToggle}
                        loading={bookmarkLoading}
                      />
                    </div>
                  </header>

                  {/* Excerpt */}
                  {pattern.excerpt && (
                    <div className="pattern-detail__excerpt">
                      {pattern.excerpt}
                    </div>
                  )}

                  {/* Description */}
                  {pattern.description && (
                    <section className="pattern-detail__section">
                      <h2>Overview</h2>
                      <div 
                        className="pattern-detail__description"
                        dangerouslySetInnerHTML={{ __html: pattern.description }}
                      />
                    </section>
                  )}

                  {/* Key Points */}
                  {pattern.keyPoints?.length > 0 && (
                    <section className="pattern-detail__section">
                      <h2>Key Points to Remember</h2>
                      <ul className="key-points-list">
                        {pattern.keyPoints.map((point, index) => (
                          <KeyPointItem key={index} point={point} index={index} />
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* How to Trade */}
                  {pattern.howToTrade && (
                    <section className="pattern-detail__section pattern-detail__section--highlight">
                      <h2>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        How to Trade This Pattern
                      </h2>
                      <div 
                        className="pattern-detail__trade-guide"
                        dangerouslySetInnerHTML={{ __html: pattern.howToTrade }}
                      />
                    </section>
                  )}

                  {/* Example Images */}
                  {pattern.examples?.length > 0 && (
                    <section className="pattern-detail__section">
                      <h2>Real-World Examples</h2>
                      <div className="pattern-examples-grid">
                        {pattern.examples.map((example, index) => (
                          <div 
                            key={index}
                            className="pattern-example"
                            onClick={() => handleImageClick(example, `${pattern.name} Example ${index + 1}`)}
                          >
                            <img 
                              src={example} 
                              alt={`${pattern.name} Example ${index + 1}`}
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar */}
                <aside className="pattern-sidebar">
                  {/* Quick Info Card */}
                  <div className="card_app_wrapper pattern-info-card">
                    <div className="card_app_header">
                      <h3 className="text-size-medium text-weight-semibold">Quick Info</h3>
                    </div>
                    <div className="pattern-info-card__content">
                      <div className="pattern-info-row">
                        <span className="pattern-info-label">Type</span>
                        <span className="pattern-info-value" style={{ textTransform: 'capitalize' }}>
                          {pattern.patternType}
                        </span>
                      </div>
                      <div className="pattern-info-row">
                        <span className="pattern-info-label">Difficulty</span>
                        <span className="pattern-info-value" style={{ textTransform: 'capitalize' }}>
                          {pattern.difficulty}
                        </span>
                      </div>
                      <div className="pattern-info-row">
                        <span className="pattern-info-label">Reliability</span>
                        <span className="pattern-info-value" style={{ textTransform: 'capitalize' }}>
                          {pattern.reliability}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Related Patterns */}
                  <div className="card_app_wrapper pattern-related-card">
                    <div className="card_app_header">
                      <h3 className="text-size-medium text-weight-semibold">Related Patterns</h3>
                    </div>
                    <div className="pattern-related-card__content">
                      {relatedPatterns.length > 0 ? (
                        relatedPatterns.map((relPattern) => (
                          <RelatedPatternCard
                            key={relPattern.id}
                            pattern={relPattern}
                            onClick={() => navigate(`/resources/patterns/${relPattern.slug}`)}
                          />
                        ))
                      ) : (
                        <p className="text-color-secondary text-size-small" style={{ padding: '1rem' }}>
                          No related patterns found.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Back button */}
                  <button 
                    className="button is-secondary"
                    onClick={() => navigate('/resources/patterns')}
                    style={{ width: '100%', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Chart Patterns
                  </button>
                </aside>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <ImageModal 
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  )
}
