/**
 * Article Detail Page
 * Displays a single learning article with YouTube video, content, and related articles
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

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url) => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

// Difficulty badge component
const DifficultyBadge = ({ difficulty }) => {
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
      padding: '0.375rem 0.75rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      textTransform: 'capitalize'
    }}>
      {difficulty}
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
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.625rem',
      padding: '0.75rem 1.25rem',
      border: isBookmarked ? '1px solid #1e65fa' : '1px solid #e5e5e7',
      background: isBookmarked ? '#f0f4ff' : 'white',
      borderRadius: '0.5rem',
      color: isBookmarked ? '#1e65fa' : '#858c95',
      cursor: loading ? 'wait' : 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: '500',
      fontSize: '0.875rem'
    }}
    onMouseEnter={(e) => {
      if (!isBookmarked && !loading) {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.background = '#f8fafc';
      }
    }}
    onMouseLeave={(e) => {
      if (!isBookmarked && !loading) {
        e.target.style.borderColor = '#e5e5e7';
        e.target.style.background = 'white';
      }
    }}
  >
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill={isBookmarked ? '#1e65fa' : 'none'} 
      stroke={isBookmarked ? '#1e65fa' : 'currentColor'} 
      strokeWidth="2"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
    {isBookmarked ? 'Saved' : 'Save Article'}
  </button>
)

// Related article card
const RelatedArticleCard = ({ article, onClick }) => (
  <div 
    className="related-article-card"
    onClick={onClick}
  >
    <div className="related-article-card__thumbnail">
      <img 
        src={article.thumbnailUrl || 'https://via.placeholder.com/200x120?text=Article'} 
        alt={article.title}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/200x120?text=Article' }}
      />
    </div>
    <div className="related-article-card__content">
      <h4>{article.title}</h4>
      <span className="related-article-card__meta">
        {article.readTime} min read · {article.difficulty}
      </span>
    </div>
  </div>
)

// Loading skeleton
const ArticleDetailSkeleton = () => (
  <div className="article-detail-skeleton">
    <div className="skeleton-pulse" style={{ height: '400px', backgroundColor: '#f0f0f0', borderRadius: '0.75rem', marginBottom: '1.5rem' }}></div>
    <div className="skeleton-pulse" style={{ height: '48px', width: '80%', backgroundColor: '#f0f0f0', borderRadius: '0.5rem', marginBottom: '1rem' }}></div>
    <div className="skeleton-pulse" style={{ height: '24px', width: '40%', backgroundColor: '#f0f0f0', borderRadius: '0.5rem', marginBottom: '2rem' }}></div>
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
    <h2>Article Not Found</h2>
    <p>{message}</p>
    <button className="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Learning Platform
    </button>
  </div>
)

export default function ArticleDetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { member } = useAuth()
  
  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [article, setArticle] = useState(null)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  
  const userId = member?.id

  // Fetch article
  const fetchArticle = useCallback(async () => {
    if (!slug) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/resources/articles/${slug}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('This article could not be found.')
        }
        throw new Error('Failed to fetch article')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setArticle(data.data.article)
        setRelatedArticles(data.data.relatedArticles || [])
      } else {
        throw new Error(data.error || 'Failed to fetch article')
      }
    } catch (err) {
      console.error('Error fetching article:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  // Check bookmark status (requires authentication)
  const checkBookmarkStatus = useCallback(async () => {
    if (!userId || !article?.id || !getAccessToken()) return
    
    try {
      const data = await apiRequest(
        `/api/resources/bookmarks/check?resourceType=ARTICLE&resourceId=${article.id}`
      )
      setIsBookmarked(data.data?.isBookmarked || false)
    } catch (err) {
      console.error('Error checking bookmark status:', err)
    }
  }, [userId, article?.id])

  // Initial load
  useEffect(() => {
    fetchArticle()
  }, [fetchArticle])

  // Check bookmark after article loads
  useEffect(() => {
    if (article?.id) {
      checkBookmarkStatus()
    }
  }, [article?.id, checkBookmarkStatus])

  // Handle bookmark toggle (requires authentication)
  const handleBookmarkToggle = async () => {
    if (!userId || !getAccessToken()) {
      navigate('/login')
      return
    }

    if (!article?.id) return
    
    setBookmarkLoading(true)
    
    try {
      await apiRequest('/api/resources/bookmarks', {
        method: isBookmarked ? 'DELETE' : 'POST',
        body: JSON.stringify({
          resourceType: 'ARTICLE',
          resourceId: article.id
        })
      })
      
      setIsBookmarked(!isBookmarked)
    } catch (err) {
      console.error('Error toggling bookmark:', err)
    } finally {
      setBookmarkLoading(false)
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

  const videoId = article?.youtubeUrl ? getYouTubeVideoId(article.youtubeUrl) : null

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
            {loading ? (
              <ArticleDetailSkeleton />
            ) : error ? (
              <ErrorState 
                message={error} 
                onBack={() => navigate('/resources/learning')}
              />
            ) : article ? (
              <div className="article-detail-layout">
                {/* Main Content */}
                <article className="article-detail">
                  {/* Breadcrumb */}
                  <nav className="breadcrumb">
                    <Link to="/resources/learning">Learning Platform</Link>
                    <span className="breadcrumb__separator">/</span>
                    <span className="breadcrumb__current">{article.category?.replace('-', ' ')}</span>
                  </nav>

                  {/* Thumbnail Image - Display if available */}
                  {article.thumbnailUrl && (
                    <div className="article-detail__video" style={{ aspectRatio: '16/9', background: '#f0f0f0', marginBottom: '1.5rem' }}>
                      <img 
                        src={article.thumbnailUrl} 
                        alt={article.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '0.75rem'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Video Section */}
                  {videoId && (
                    <div className="article-detail__video">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={article.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}

                  {/* Header */}
                  <header className="article-detail__header">
                    <div className="article-detail__meta">
                      <DifficultyBadge difficulty={article.difficulty} />
                      <span className="article-detail__category">{article.category?.replace('-', ' ')}</span>
                      <span className="article-detail__read-time">{article.readTime} min read</span>
                      <span className="article-detail__views">{article.viewCount || 0} views</span>
                    </div>
                    
                    <h1 className="article-detail__title">{article.title}</h1>
                    
                    {article.excerpt && (
                      <p className="article-detail__excerpt">{article.excerpt}</p>
                    )}

                    <div className="article-detail__actions">
                      <BookmarkButton 
                        isBookmarked={isBookmarked}
                        onToggle={handleBookmarkToggle}
                        loading={bookmarkLoading}
                      />
                      
                      {article.authorName && (
                        <div className="article-detail__author">
                          {article.authorAvatar && (
                            <img 
                              src={article.authorAvatar} 
                              alt={article.authorName}
                              className="article-detail__author-avatar"
                            />
                          )}
                          <span>By {article.authorName}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {article.tags?.length > 0 && (
                      <div className="article-detail__tags">
                        {article.tags.map((tag, index) => (
                          <span key={index} className="article-detail__tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </header>

                  {/* Content */}
                  <div 
                    className="article-detail__content text-rich-text"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />

                  {/* Published Date */}
                  {article.publishedAt && (
                    <footer className="article-detail__footer">
                      <span>Published on {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </footer>
                  )}
                </article>

                {/* Sidebar - Related Articles */}
                <aside className="article-sidebar">
                  <div className="card_app_wrapper article-sidebar__card">
                    <div className="card_app_header">
                      <h3>Related Articles</h3>
                    </div>
                    <div className="article-sidebar__content">
                      {relatedArticles.length > 0 ? (
                        relatedArticles.map((relArticle) => (
                          <RelatedArticleCard
                            key={relArticle.id}
                            article={relArticle}
                            onClick={() => navigate(`/resources/learning/${relArticle.slug}`)}
                          />
                        ))
                      ) : (
                        <p className="text-color-secondary text-size-small" style={{ padding: '1rem' }}>
                          No related articles found.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Back to Learning */}
                  <button 
                    className="button is-secondary is-icon is-small"
                    onClick={() => navigate('/resources/learning')}
                    style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Learning Platform
                  </button>
                </aside>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
