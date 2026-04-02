/**
 * Learning Platform Page
 * Displays educational articles and blog posts with video content
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

// Category configuration with display names and colors
const CATEGORIES = [
  { id: 'all', label: 'All Articles', color: '#1e65fa' },
  { id: 'beginner', label: 'Beginner', color: '#26a69a' },
  { id: 'technical-analysis', label: 'Technical Analysis', color: '#7c3aed' },
  { id: 'trading-strategies', label: 'Trading Strategies', color: '#f59e0b' },
  { id: 'market-analysis', label: 'Market Analysis', color: '#ef5350' }
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
    <span 
      className="difficulty-badge"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        textTransform: 'capitalize'
      }}
    >
      {difficulty}
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
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
  </button>
)

// Article card component
const ArticleCard = ({ article, isBookmarked, onBookmarkToggle, bookmarkLoading, onClick }) => (
  <div 
    className="card_app_wrapper article-card"
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    {/* Thumbnail */}
    <div className="article-card__thumbnail">
      <img 
        src={article.thumbnailUrl || 'https://via.placeholder.com/400x200?text=Article'} 
        alt={article.title}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/400x200?text=Article'
        }}
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
          {article.tags?.slice(0, 2).map((tag, index) => (
            <span key={index} className="article-card__tag">#{tag}</span>
          ))}
        </div>
        <div className="article-card__actions">
          <DifficultyBadge difficulty={article.difficulty} />
          <BookmarkButton 
            isBookmarked={isBookmarked} 
            onToggle={onBookmarkToggle}
            loading={bookmarkLoading}
          />
        </div>
      </div>
    </div>
  </div>
)

// Empty state component
const EmptyState = ({ title, description, icon }) => (
  <div className="empty-state">
    <div className="empty-state__icon">{icon}</div>
    <h3 className="empty-state__title">{title}</h3>
    <p className="empty-state__description">{description}</p>
  </div>
)

// Loading skeleton component
const ArticleCardSkeleton = () => (
  <div className="card_app_wrapper article-card article-card--skeleton">
    <div className="article-card__thumbnail skeleton-pulse" style={{ height: '160px', backgroundColor: '#f0f0f0' }}></div>
    <div className="article-card__content">
      <div className="skeleton-pulse" style={{ height: '16px', width: '40%', marginBottom: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
      <div className="skeleton-pulse" style={{ height: '24px', width: '90%', marginBottom: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
      <div className="skeleton-pulse" style={{ height: '48px', width: '100%', marginBottom: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
      <div className="skeleton-pulse" style={{ height: '20px', width: '60%', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
    </div>
  </div>
)

// Error state component
const ErrorState = ({ message, onRetry }) => (
  <div className="error-state">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <h3>Something went wrong</h3>
    <p>{message}</p>
    {onRetry && (
      <button className="button" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
)

export default function LearningPlatformPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { member, isAuthenticated } = useAuth()
  
  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all')
  const [bookmarks, setBookmarks] = useState({})
  const [bookmarkLoading, setBookmarkLoading] = useState({})
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  
  const userId = member?.id

  // Fetch articles
  const fetchArticles = useCallback(async (category = 'all', page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(category !== 'all' && { category })
      })
      
      const response = await fetch(`${API_BASE_URL}/api/resources/articles?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setArticles(data.data)
        setPagination(data.pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch articles')
      }
    } catch (err) {
      console.error('Error fetching articles:', err)
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
    fetchArticles(activeCategory, 1)
    fetchBookmarks()
  }, [fetchArticles, fetchBookmarks, activeCategory])

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId)
    setSearchParams(categoryId !== 'all' ? { category: categoryId } : {})
    fetchArticles(categoryId, 1)
  }

  // Handle bookmark toggle (requires authentication)
  const handleBookmarkToggle = async (articleId) => {
    if (!userId || !getAccessToken()) {
      navigate('/login')
      return
    }

    const bookmarkKey = `ARTICLE_${articleId}`
    const isCurrentlyBookmarked = bookmarks[bookmarkKey]
    
    setBookmarkLoading(prev => ({ ...prev, [articleId]: true }))
    
    try {
      await apiRequest('/api/resources/bookmarks', {
        method: isCurrentlyBookmarked ? 'DELETE' : 'POST',
        body: JSON.stringify({
          resourceType: 'ARTICLE',
          resourceId: articleId
        })
      })
      
      setBookmarks(prev => ({
        ...prev,
        [bookmarkKey]: !isCurrentlyBookmarked
      }))
    } catch (err) {
      console.error('Error toggling bookmark:', err)
    } finally {
      setBookmarkLoading(prev => ({ ...prev, [articleId]: false }))
    }
  }

  // Handle article click
  const handleArticleClick = (slug) => {
    navigate(`/resources/learning/${slug}`)
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
    fetchArticles(activeCategory, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onNavigate={handleSidebarNavigate} 
          activePage="resources-learning" 
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
                <h1 className="text-size-xlarge text-weight-semibold" style={{marginBottom: '6px'}}>Learning Platform</h1>
                <p className="text-size-regular text-color-secondary">
                  Expand your crypto knowledge with our educational articles and video tutorials
                </p>
              </div>
              
              {/* Stats */}
              <div className="page-header__stats">
                <div className="stat-item">
                  <span className="stat-value">{pagination.total || 0}</span>
                  <span className="stat-label">Articles</span>
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`category-tab ${activeCategory === category.id ? 'is-active' : ''}`}
                  style={activeCategory === category.id ? { 
                    borderColor: category.color,
                    color: category.color
                  } : {}}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="articles-grid-container">
              {loading ? (
                <div className="articles-grid">
                  {[...Array(6)].map((_, i) => (
                    <ArticleCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <ErrorState 
                  message={error} 
                  onRetry={() => fetchArticles(activeCategory, pagination.page)} 
                />
              ) : articles.length === 0 ? (
                <EmptyState
                  title="No articles found"
                  description={activeCategory !== 'all' 
                    ? `No articles in the "${activeCategory.replace('-', ' ')}" category yet.`
                    : "No articles available at the moment. Check back soon!"
                  }
                  icon={
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  }
                />
              ) : (
                <>
                  <div className="articles-grid">
                    {articles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isBookmarked={!!bookmarks[`ARTICLE_${article.id}`]}
                        onBookmarkToggle={() => handleBookmarkToggle(article.id)}
                        bookmarkLoading={bookmarkLoading[article.id]}
                        onClick={() => handleArticleClick(article.slug)}
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
