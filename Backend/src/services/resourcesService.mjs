/**
 * Resources Service
 * Handles all database operations for Learning Articles, Chart Patterns, and Bookmarks
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// LEARNING ARTICLES
// ============================================

/**
 * Get all published learning articles with optional filtering
 */
export async function getArticles({
  category = null,
  difficulty = null,
  tag = null,
  featured = null,
  page = 1,
  limit = 12,
  sortBy = 'publishedAt',
  sortOrder = 'desc'
} = {}) {
  try {
    const skip = (page - 1) * limit;
    
    const where = {
      published: true,
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(tag && { tags: { has: tag } }),
      ...(featured !== null && { featured })
    };

    const [articles, total] = await Promise.all([
      prisma.learningArticle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          thumbnailUrl: true,
          category: true,
          tags: true,
          readTime: true,
          authorName: true,
          authorAvatar: true,
          difficulty: true,
          featured: true,
          viewCount: true,
          publishedAt: true
        }
      }),
      prisma.learningArticle.count({ where })
    ]);

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw new Error('Failed to fetch articles');
  }
}

/**
 * Get a single article by slug
 */
export async function getArticleBySlug(slug, incrementView = true) {
  try {
    const article = await prisma.learningArticle.findUnique({
      where: { slug, published: true }
    });

    if (!article) {
      return null;
    }

    // Increment view count
    if (incrementView) {
      await prisma.learningArticle.update({
        where: { slug },
        data: { viewCount: { increment: 1 } }
      });
    }

    return article;
  } catch (error) {
    console.error('Error fetching article:', error);
    throw new Error('Failed to fetch article');
  }
}

/**
 * Get related articles based on category and tags
 */
export async function getRelatedArticles(articleId, category, tags, limit = 4) {
  try {
    const relatedArticles = await prisma.learningArticle.findMany({
      where: {
        published: true,
        id: { not: articleId },
        OR: [
          { category },
          { tags: { hasSome: tags } }
        ]
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnailUrl: true,
        category: true,
        readTime: true,
        difficulty: true
      }
    });

    return relatedArticles;
  } catch (error) {
    console.error('Error fetching related articles:', error);
    throw new Error('Failed to fetch related articles');
  }
}

/**
 * Get all unique categories
 */
export async function getArticleCategories() {
  try {
    const articles = await prisma.learningArticle.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ['category']
    });
    
    return articles.map(a => a.category);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

/**
 * Get all unique tags
 */
export async function getArticleTags() {
  try {
    const articles = await prisma.learningArticle.findMany({
      where: { published: true },
      select: { tags: true }
    });
    
    const allTags = new Set();
    articles.forEach(a => a.tags.forEach(tag => allTags.add(tag)));
    
    return Array.from(allTags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error('Failed to fetch tags');
  }
}

// ============================================
// CHART PATTERNS
// ============================================

/**
 * Get all published chart patterns with optional filtering
 */
export async function getPatterns({
  patternType = null,
  difficulty = null,
  reliability = null,
  page = 1,
  limit = 12,
  sortBy = 'createdAt',
  sortOrder = 'desc'
} = {}) {
  try {
    const skip = (page - 1) * limit;
    
    const where = {
      published: true,
      ...(patternType && { patternType }),
      ...(difficulty && { difficulty }),
      ...(reliability && { reliability })
    };

    const [patterns, total] = await Promise.all([
      prisma.chartPattern.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          excerpt: true,
          patternType: true,
          difficulty: true,
          reliability: true,
          viewCount: true
        }
      }),
      prisma.chartPattern.count({ where })
    ]);

    return {
      patterns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    console.error('Error fetching patterns:', error);
    throw new Error('Failed to fetch patterns');
  }
}

/**
 * Get a single pattern by slug
 */
export async function getPatternBySlug(slug, incrementView = true) {
  try {
    const pattern = await prisma.chartPattern.findUnique({
      where: { slug, published: true }
    });

    if (!pattern) {
      return null;
    }

    // Increment view count
    if (incrementView) {
      await prisma.chartPattern.update({
        where: { slug },
        data: { viewCount: { increment: 1 } }
      });
    }

    return pattern;
  } catch (error) {
    console.error('Error fetching pattern:', error);
    throw new Error('Failed to fetch pattern');
  }
}

/**
 * Get related patterns based on type
 */
export async function getRelatedPatterns(patternId, patternType, limit = 4) {
  try {
    const relatedPatterns = await prisma.chartPattern.findMany({
      where: {
        published: true,
        id: { not: patternId },
        patternType
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        excerpt: true,
        patternType: true,
        difficulty: true,
        reliability: true
      }
    });

    return relatedPatterns;
  } catch (error) {
    console.error('Error fetching related patterns:', error);
    throw new Error('Failed to fetch related patterns');
  }
}

/**
 * Get all pattern types
 */
export async function getPatternTypes() {
  try {
    const patterns = await prisma.chartPattern.findMany({
      where: { published: true },
      select: { patternType: true },
      distinct: ['patternType']
    });
    
    return patterns.map(p => p.patternType);
  } catch (error) {
    console.error('Error fetching pattern types:', error);
    throw new Error('Failed to fetch pattern types');
  }
}

// ============================================
// SEARCH
// ============================================

/**
 * Global search across articles and patterns
 */
export async function searchResources(query, { page = 1, limit = 20 } = {}) {
  try {
    if (!query || query.trim().length < 2) {
      return { articles: [], patterns: [], total: 0 };
    }

    const searchTerm = query.trim().toLowerCase();
    const skip = (page - 1) * limit;
    const halfLimit = Math.ceil(limit / 2);

    // Search articles
    const [articles, articlesTotal] = await Promise.all([
      prisma.learningArticle.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { excerpt: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { hasSome: [searchTerm] } }
          ]
        },
        skip,
        take: halfLimit,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          thumbnailUrl: true,
          category: true,
          tags: true,
          readTime: true,
          difficulty: true
        }
      }),
      prisma.learningArticle.count({
        where: {
          published: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { excerpt: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { hasSome: [searchTerm] } }
          ]
        }
      })
    ]);

    // Search patterns
    const [patterns, patternsTotal] = await Promise.all([
      prisma.chartPattern.findMany({
        where: {
          published: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { excerpt: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        skip,
        take: halfLimit,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          excerpt: true,
          patternType: true,
          difficulty: true,
          reliability: true
        }
      }),
      prisma.chartPattern.count({
        where: {
          published: true,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { excerpt: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }
      })
    ]);

    return {
      articles,
      patterns,
      pagination: {
        page,
        limit,
        articlesTotal,
        patternsTotal,
        total: articlesTotal + patternsTotal,
        hasMore: page * limit < (articlesTotal + patternsTotal)
      }
    };
  } catch (error) {
    console.error('Error searching resources:', error);
    throw new Error('Failed to search resources');
  }
}

// ============================================
// BOOKMARKS
// ============================================

/**
 * Add a bookmark
 */
export async function addBookmark(userId, resourceType, resourceId) {
  try {
    // Validate resource exists
    if (resourceType === 'ARTICLE') {
      const article = await prisma.learningArticle.findUnique({
        where: { id: resourceId }
      });
      if (!article) {
        throw new Error('Article not found');
      }
    } else if (resourceType === 'PATTERN') {
      const pattern = await prisma.chartPattern.findUnique({
        where: { id: resourceId }
      });
      if (!pattern) {
        throw new Error('Pattern not found');
      }
    }

    const bookmark = await prisma.userBookmark.create({
      data: {
        userId,
        resourceType,
        resourceId
      }
    });

    return bookmark;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new Error('Bookmark already exists');
    }
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(userId, resourceType, resourceId) {
  try {
    const deleted = await prisma.userBookmark.deleteMany({
      where: {
        userId,
        resourceType,
        resourceId
      }
    });

    return deleted.count > 0;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw new Error('Failed to remove bookmark');
  }
}

/**
 * Get user's bookmarks with full resource data
 */
export async function getUserBookmarks(userId, { resourceType = null, page = 1, limit = 20 } = {}) {
  try {
    const skip = (page - 1) * limit;
    
    const where = {
      userId,
      ...(resourceType && { resourceType })
    };

    const [bookmarks, total] = await Promise.all([
      prisma.userBookmark.findMany({
        where,
        skip,
        take: limit,
        orderBy: { addedAt: 'desc' }
      }),
      prisma.userBookmark.count({ where })
    ]);

    // Fetch full resource data for each bookmark
    const enrichedBookmarks = await Promise.all(
      bookmarks.map(async (bookmark) => {
        let resource = null;
        
        if (bookmark.resourceType === 'ARTICLE') {
          resource = await prisma.learningArticle.findUnique({
            where: { id: bookmark.resourceId },
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              thumbnailUrl: true,
              category: true,
              readTime: true,
              difficulty: true
            }
          });
        } else if (bookmark.resourceType === 'PATTERN') {
          resource = await prisma.chartPattern.findUnique({
            where: { id: bookmark.resourceId },
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              excerpt: true,
              patternType: true,
              difficulty: true,
              reliability: true
            }
          });
        }

        return {
          ...bookmark,
          resource
        };
      })
    );

    // Filter out bookmarks where resource was deleted
    const validBookmarks = enrichedBookmarks.filter(b => b.resource !== null);

    return {
      bookmarks: validBookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw new Error('Failed to fetch bookmarks');
  }
}

/**
 * Check if a resource is bookmarked by user
 */
export async function isBookmarked(userId, resourceType, resourceId) {
  try {
    const bookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId
        }
      }
    });

    return !!bookmark;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }
}

/**
 * Get bookmark IDs for a user (for quick checks)
 */
export async function getUserBookmarkIds(userId) {
  try {
    const bookmarks = await prisma.userBookmark.findMany({
      where: { userId },
      select: {
        resourceType: true,
        resourceId: true
      }
    });

    return bookmarks.reduce((acc, b) => {
      const key = `${b.resourceType}_${b.resourceId}`;
      acc[key] = true;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching bookmark IDs:', error);
    return {};
  }
}

// ============================================
// READING PROGRESS (Optional Feature)
// ============================================

/**
 * Update reading progress
 */
export async function updateReadingProgress(userId, articleId, progress, completed = false) {
  try {
    const result = await prisma.readingProgress.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      },
      update: {
        progress,
        completed,
        lastReadAt: new Date()
      },
      create: {
        userId,
        articleId,
        progress,
        completed
      }
    });

    return result;
  } catch (error) {
    console.error('Error updating reading progress:', error);
    throw new Error('Failed to update reading progress');
  }
}

/**
 * Get user's reading progress for multiple articles
 */
export async function getUserReadingProgress(userId, articleIds = []) {
  try {
    const where = {
      userId,
      ...(articleIds.length > 0 && { articleId: { in: articleIds } })
    };

    const progress = await prisma.readingProgress.findMany({
      where
    });

    return progress.reduce((acc, p) => {
      acc[p.articleId] = {
        progress: p.progress,
        completed: p.completed,
        lastReadAt: p.lastReadAt
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching reading progress:', error);
    return {};
  }
}

// ============================================
// FEATURED & STATS
// ============================================

/**
 * Get featured content for homepage/dashboard
 */
export async function getFeaturedContent() {
  try {
    const [featuredArticles, popularPatterns] = await Promise.all([
      prisma.learningArticle.findMany({
        where: { published: true, featured: true },
        take: 4,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          thumbnailUrl: true,
          category: true,
          readTime: true,
          difficulty: true
        }
      }),
      prisma.chartPattern.findMany({
        where: { published: true },
        take: 4,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          excerpt: true,
          patternType: true,
          difficulty: true,
          reliability: true
        }
      })
    ]);

    return {
      featuredArticles,
      popularPatterns
    };
  } catch (error) {
    console.error('Error fetching featured content:', error);
    throw new Error('Failed to fetch featured content');
  }
}

/**
 * Get resource statistics
 */
export async function getResourceStats() {
  try {
    const [articlesCount, patternsCount, categoriesCount, totalViews] = await Promise.all([
      prisma.learningArticle.count({ where: { published: true } }),
      prisma.chartPattern.count({ where: { published: true } }),
      prisma.learningArticle.findMany({
        where: { published: true },
        select: { category: true },
        distinct: ['category']
      }),
      prisma.learningArticle.aggregate({
        where: { published: true },
        _sum: { viewCount: true }
      })
    ]);

    return {
      articlesCount,
      patternsCount,
      categoriesCount: categoriesCount.length,
      totalViews: totalViews._sum.viewCount || 0
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw new Error('Failed to fetch stats');
  }
}

export default {
  // Articles
  getArticles,
  getArticleBySlug,
  getRelatedArticles,
  getArticleCategories,
  getArticleTags,
  
  // Patterns
  getPatterns,
  getPatternBySlug,
  getRelatedPatterns,
  getPatternTypes,
  
  // Search
  searchResources,
  
  // Bookmarks
  addBookmark,
  removeBookmark,
  getUserBookmarks,
  isBookmarked,
  getUserBookmarkIds,
  
  // Reading Progress
  updateReadingProgress,
  getUserReadingProgress,
  
  // Featured & Stats
  getFeaturedContent,
  getResourceStats
};
