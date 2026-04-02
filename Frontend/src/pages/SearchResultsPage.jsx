/**
 * Search Results Page
 * Displays search results for articles and patterns
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../Components/Dashboard Pages/Sidebar'
import Navbar from '../Components/Dashboard Pages/Navbar'

const getApiBaseUrl = () => {
  const viteUrl = import.meta.env.VITE_API_URL;
  return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
};
const API_BASE_URL = getApiBaseUrl()

// Tab component
const TabButton = ({ label, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`search-tab ${isActive ? 'is-active' : ''}`}
  >
    {label}
    {count !== undefined && (
      <span className="search-tab__count">{count}</span>
    )}
  </button>
)

// Article result card
const ArticleResultCard = ({ article, onClick }) => (
  <div className="search-result-card" onClick={onClick}>
    <div className="search-result-card__image">
      <img 
        src={article.thumbnailUrl || 'https://via.placeholder.com/120x80?text=Article'} 
        alt={article.title}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/120x80?text=Article' }}
      />
    </div>
    <div className="search-result-card__content">
      <span className="search-result-card__type">Article</span>
      <h3 className="search-result-card__title">{article.title}</h3>
      <p className="search-result-card__excerpt">{article.excerpt}</p>
      <div className="search-result-card__meta">
        <span>{article.readTime} min read</span>
        <span>•</span>
        <span style={{ textTransform: 'capitalize' }}>{article.difficulty}</span>
        {article.tags?.slice(0, 2).map((tag, i) => (
          <span key={i} className="search-result-card__tag">#{tag}</span>
        ))}
      </div>
    </div>
  </div>
)

// Pattern result card
const PatternResultCard = ({ pattern, onClick }) => (
  <div className="search-result-card" onClick={onClick}>
    <div className="search-result-card__image">
      <img 
        src={pattern.imageUrl || 'https://via.placeholder.com/120x80?text=Pattern'} 
        alt={pattern.name}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/120x80?text=Pattern' }}
      />
    </div>
    <div className="search-result-card__content">
      <span className="search-result-card__type search-result-card__type--pattern">Pattern</span>
      <h3 className="search-result-card__title">{pattern.name}</h3>
      <p className="search-result-card__excerpt">{pattern.excerpt}</p>
      <div className="search-result-card__meta">
        <span style={{ textTransform: 'capitalize' }}>{pattern.patternType}</span>
        <span>•</span>
        <span style={{ textTransform: 'capitalize' }}>{pattern.difficulty}</span>
        <span>•</span>
        <span style={{ textTransform: 'capitalize' }}>{pattern.reliability} reliability</span>
      </div>
    </div>
  </div>
)

// Empty state
const EmptyState = ({ query }) => (
  <div className="search-empty-state">
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <h3>No results found</h3>
    <p>
      We couldn't find any resources matching "<strong>{query}</strong>".
      <br />
      Try different keywords or check your spelling.
    </p>
    <div className="search-suggestions">
      <p>Suggestions:</p>
      <ul>
        <li>Use more general terms</li>
        <li>Check for typos</li>
        <li>Try searching for patterns like "head and shoulders" or "bullish"</li>
        <li>Browse our <a href="/resources/learning">Learning Platform</a> or <a href="/resources/patterns">Chart Patterns</a></li>
      </ul>
    </div>
  </div>
)

// Loading skeleton
const SearchResultSkeleton = () => (
  <div className="search-result-card search-result-card--skeleton">
    <div className="skeleton-pulse" style={{ width: '120px', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '0.5rem' }}></div>
    <div className="search-result-card__content">
      <div className="skeleton-pulse" style={{ width: '60px', height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
      <div className="skeleton-pulse" style={{ width: '80%', height: '24px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
      <div className="skeleton-pulse" style={{ width: '100%', height: '40px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
      <div className="skeleton-pulse" style={{ width: '50%', height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}></div>
    </div>
  </div>
)

// Error state
const ErrorState = ({ message, onRetry }) => (
  <div className="search-error-state">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <h3>Search failed</h3>
    <p>{message}</p>
    {onRetry && (
      <button className="button" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
)

export default function SearchResultsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { member } = useAuth()
  
  const query = searchParams.get('q') || ''
  
  // State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [articles, setArticles] = useState([])
  const [patterns, setPatterns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [pagination, setPagination] = useState({ articlesTotal: 0, patternsTotal: 0, total: 0 })
  
  // Fetch search results
  const fetchSearchResults = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setArticles([])
      setPatterns([])
      setPagination({ articlesTotal: 0, patternsTotal: 0, total: 0 })
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/resources/search?q=${encodeURIComponent(searchQuery)}`
      )
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setArticles(data.data.articles || [])
        setPatterns(data.data.patterns || [])
        setPagination(data.pagination || { articlesTotal: 0, patternsTotal: 0, total: 0 })
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (err) {
      console.error('Error searching:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and query change
  useEffect(() => {
    if (query) {
      fetchSearchResults(query)
    }
  }, [query, fetchSearchResults])

  // Handle search from navbar
  const handleSearch = (newQuery) => {
    setSearchParams({ q: newQuery })
    setActiveTab('all')
  }

  // Handle sidebar navigation
  const handleSidebarNavigate = (path) => {
    navigate(path)
  }

  // Filter results based on active tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'articles':
        return { articles, patterns: [] }
      case 'patterns':
        return { articles: [], patterns }
      default:
        return { articles, patterns }
    }
  }

  const filtered = getFilteredResults()
  const hasResults = articles.length > 0 || patterns.length > 0

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onNavigate={handleSidebarNavigate} 
          activePage="resources" 
        />
        
        <div className="dashboard_main_wrapper">
          <Navbar 
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            onSearch={handleSearch}
          />
          
          <div className="dashboard_main_app">
            {/* Page Header */}
            <div className="search-header">
              <h1 className="text-size-xlarge text-weight-semibold">
                Search Results
              </h1>
              {query && (
                <p className="text-size-regular text-color-secondary">
                  {loading ? 'Searching...' : (
                    hasResults 
                      ? `Found ${pagination.total} results for "${query}"`
                      : `No results for "${query}"`
                  )}
                </p>
              )}
            </div>

            {/* Tabs */}
            {hasResults && !loading && (
              <div className="search-tabs">
                <TabButton 
                  label="All" 
                  count={pagination.total}
                  isActive={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}
                />
                <TabButton 
                  label="Articles" 
                  count={pagination.articlesTotal}
                  isActive={activeTab === 'articles'}
                  onClick={() => setActiveTab('articles')}
                />
                <TabButton 
                  label="Patterns" 
                  count={pagination.patternsTotal}
                  isActive={activeTab === 'patterns'}
                  onClick={() => setActiveTab('patterns')}
                />
              </div>
            )}

            {/* Content */}
            <div className="search-results-container">
              {!query ? (
                <div className="search-empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <h3>Start searching</h3>
                  <p>Enter a search term in the navbar to find articles and chart patterns.</p>
                </div>
              ) : loading ? (
                <div className="search-results-list">
                  {[...Array(5)].map((_, i) => (
                    <SearchResultSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <ErrorState 
                  message={error} 
                  onRetry={() => fetchSearchResults(query)} 
                />
              ) : !hasResults ? (
                <EmptyState query={query} />
              ) : (
                <div className="search-results-list">
                  {/* Articles */}
                  {filtered.articles.length > 0 && (
                    <>
                      {activeTab === 'all' && filtered.patterns.length > 0 && (
                        <h2 className="search-section-title">Articles</h2>
                      )}
                      {filtered.articles.map((article) => (
                        <ArticleResultCard
                          key={article.id}
                          article={article}
                          onClick={() => navigate(`/resources/learning/${article.slug}`)}
                        />
                      ))}
                    </>
                  )}

                  {/* Patterns */}
                  {filtered.patterns.length > 0 && (
                    <>
                      {activeTab === 'all' && filtered.articles.length > 0 && (
                        <h2 className="search-section-title" style={{ marginTop: '2rem' }}>
                          Chart Patterns
                        </h2>
                      )}
                      {filtered.patterns.map((pattern) => (
                        <PatternResultCard
                          key={pattern.id}
                          pattern={pattern}
                          onClick={() => navigate(`/resources/patterns/${pattern.slug}`)}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
