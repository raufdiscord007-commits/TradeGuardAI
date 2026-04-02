/**
 * Resources Routes
 * API endpoints for Learning Articles, Chart Patterns, Bookmarks, and Search
 */

import express from 'express';
import * as resourcesService from '../services/resourcesService.mjs';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// ERROR HANDLER MIDDLEWARE
// ============================================

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// LEARNING ARTICLES ROUTES
// ============================================

/**
 * GET /api/resources/articles
 * Get all published articles with optional filtering
 */
router.get('/articles', asyncHandler(async (req, res) => {
  const { 
    category, 
    difficulty, 
    tag, 
    featured,
    page = 1, 
    limit = 12,
    sortBy = 'publishedAt',
    sortOrder = 'desc'
  } = req.query;

  const result = await resourcesService.getArticles({
    category,
    difficulty,
    tag,
    featured: featured === 'true' ? true : featured === 'false' ? false : null,
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  });

  res.json({
    success: true,
    data: result.articles,
    pagination: result.pagination
  });
}));

/**
 * GET /api/resources/articles/categories
 * Get all unique article categories
 */
router.get('/articles/categories', asyncHandler(async (req, res) => {
  const categories = await resourcesService.getArticleCategories();
  
  res.json({
    success: true,
    data: categories
  });
}));

/**
 * GET /api/resources/articles/tags
 * Get all unique article tags
 */
router.get('/articles/tags', asyncHandler(async (req, res) => {
  const tags = await resourcesService.getArticleTags();
  
  res.json({
    success: true,
    data: tags
  });
}));

/**
 * GET /api/resources/articles/:slug
 * Get a single article by slug
 */
router.get('/articles/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { noView } = req.query;

  const article = await resourcesService.getArticleBySlug(slug, noView !== 'true');

  if (!article) {
    return res.status(404).json({
      success: false,
      error: 'Article not found'
    });
  }

  // Get related articles
  const related = await resourcesService.getRelatedArticles(
    article.id,
    article.category,
    article.tags,
    4
  );

  res.json({
    success: true,
    data: {
      article,
      relatedArticles: related
    }
  });
}));

// ============================================
// CHART PATTERNS ROUTES
// ============================================

/**
 * GET /api/resources/patterns
 * Get all published patterns with optional filtering
 */
router.get('/patterns', asyncHandler(async (req, res) => {
  const { 
    patternType, 
    difficulty, 
    reliability,
    page = 1, 
    limit = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const result = await resourcesService.getPatterns({
    patternType,
    difficulty,
    reliability,
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    sortOrder
  });

  res.json({
    success: true,
    data: result.patterns,
    pagination: result.pagination
  });
}));

/**
 * GET /api/resources/patterns/types
 * Get all pattern types
 */
router.get('/patterns/types', asyncHandler(async (req, res) => {
  const types = await resourcesService.getPatternTypes();
  
  res.json({
    success: true,
    data: types
  });
}));

/**
 * GET /api/resources/patterns/:slug
 * Get a single pattern by slug
 */
router.get('/patterns/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { noView } = req.query;

  const pattern = await resourcesService.getPatternBySlug(slug, noView !== 'true');

  if (!pattern) {
    return res.status(404).json({
      success: false,
      error: 'Pattern not found'
    });
  }

  // Get related patterns
  const related = await resourcesService.getRelatedPatterns(
    pattern.id,
    pattern.patternType,
    4
  );

  res.json({
    success: true,
    data: {
      pattern,
      relatedPatterns: related
    }
  });
}));

// ============================================
// SEARCH ROUTES
// ============================================

/**
 * GET /api/resources/search
 * Search across articles and patterns
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters'
    });
  }

  const result = await resourcesService.searchResources(q, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: {
      articles: result.articles,
      patterns: result.patterns
    },
    pagination: result.pagination,
    query: q
  });
}));

// ============================================
// BOOKMARKS ROUTES (Protected - require authentication)
// ============================================

/**
 * GET /api/resources/bookmarks
 * Get authenticated user's bookmarks
 */
router.get('/bookmarks', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { resourceType, page = 1, limit = 20 } = req.query;

  const result = await resourcesService.getUserBookmarks(userId, {
    resourceType: resourceType?.toUpperCase(),
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: result.bookmarks,
    pagination: result.pagination
  });
}));

/**
 * GET /api/resources/bookmarks/ids
 * Get authenticated user's bookmark IDs for quick checks
 */
router.get('/bookmarks/ids', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const bookmarkIds = await resourcesService.getUserBookmarkIds(userId);

  res.json({
    success: true,
    data: bookmarkIds
  });
}));

/**
 * POST /api/resources/bookmarks
 * Add a bookmark for authenticated user
 */
router.post('/bookmarks', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { resourceType, resourceId } = req.body;

  if (!resourceType || !resourceId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: resourceType, resourceId'
    });
  }

  const validTypes = ['ARTICLE', 'PATTERN'];
  if (!validTypes.includes(resourceType.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid resource type. Must be ARTICLE or PATTERN'
    });
  }

  try {
    const bookmark = await resourcesService.addBookmark(
      userId,
      resourceType.toUpperCase(),
      resourceId
    );

    res.status(201).json({
      success: true,
      data: bookmark,
      message: 'Bookmark added successfully'
    });
  } catch (error) {
    if (error.message === 'Bookmark already exists') {
      return res.status(409).json({
        success: false,
        error: 'Resource is already bookmarked'
      });
    }
    if (error.message === 'Article not found' || error.message === 'Pattern not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
}));

/**
 * DELETE /api/resources/bookmarks
 * Remove a bookmark for authenticated user
 */
router.delete('/bookmarks', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { resourceType, resourceId } = req.body;

  if (!resourceType || !resourceId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: resourceType, resourceId'
    });
  }

  const deleted = await resourcesService.removeBookmark(
    userId,
    resourceType.toUpperCase(),
    resourceId
  );

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Bookmark not found'
    });
  }

  res.json({
    success: true,
    message: 'Bookmark removed successfully'
  });
}));

/**
 * GET /api/resources/bookmarks/check
 * Check if a resource is bookmarked for authenticated user
 */
router.get('/bookmarks/check', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { resourceType, resourceId } = req.query;

  if (!resourceType || !resourceId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: resourceType, resourceId'
    });
  }

  const isBookmarked = await resourcesService.isBookmarked(
    userId,
    resourceType.toUpperCase(),
    resourceId
  );

  res.json({
    success: true,
    data: { isBookmarked }
  });
}));

// ============================================
// READING PROGRESS ROUTES
// ============================================

/**
 * POST /api/resources/progress
 * Update reading progress for an article
 */
router.post('/progress', asyncHandler(async (req, res) => {
  const { userId, articleId, progress, completed } = req.body;

  if (!userId || !articleId || progress === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: userId, articleId, progress'
    });
  }

  const result = await resourcesService.updateReadingProgress(
    userId,
    articleId,
    parseInt(progress),
    completed || false
  );

  res.json({
    success: true,
    data: result
  });
}));

/**
 * GET /api/resources/progress/:userId
 * Get user's reading progress
 */
router.get('/progress/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { articleIds } = req.query;

  const ids = articleIds ? articleIds.split(',') : [];
  const progress = await resourcesService.getUserReadingProgress(userId, ids);

  res.json({
    success: true,
    data: progress
  });
}));

// ============================================
// FEATURED & STATS ROUTES
// ============================================

/**
 * GET /api/resources/featured
 * Get featured content for dashboard
 */
router.get('/featured', asyncHandler(async (req, res) => {
  const featured = await resourcesService.getFeaturedContent();

  res.json({
    success: true,
    data: featured
  });
}));

/**
 * GET /api/resources/stats
 * Get resource statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await resourcesService.getResourceStats();

  res.json({
    success: true,
    data: stats
  });
}));

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

router.use((err, req, res, next) => {
  console.error('Resources API Error:', err);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

export default router;
