/**
 * Admin Service
 * Handles all admin operations including:
 * - User management via Prisma (replaces Memberstack)
 * - Article and Pattern CRUD (including drafts)
 * - Audit logging
 * - Dashboard statistics
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction({
  adminEmail,
  adminId,
  action,
  targetType,
  targetId,
  targetName,
  changes = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    // Validate adminId is a valid ObjectId format (24 hex characters)
    // If not valid, use a placeholder ObjectId
    const validAdminId = adminId && /^[0-9a-fA-F]{24}$/.test(adminId) 
      ? adminId 
      : '000000000000000000000000'; // Placeholder for unknown admin

    const log = await prisma.adminAuditLog.create({
      data: {
        adminEmail: adminEmail || 'unknown@admin.com',
        adminId: validAdminId,
        action,
        targetType,
        targetId: targetId || 'unknown',
        targetName: targetName || 'Unknown',
        changes,
        ipAddress,
        userAgent
      }
    });
    console.log(`Audit log created: ${action} ${targetType} ${targetName}`);
    return log;
  } catch (error) {
    console.error('Error logging admin action:', error);
    console.error('Audit data:', { adminEmail, adminId, action, targetType, targetId, targetName });
    // Don't throw - logging should not break main operations
    return null;
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs({
  adminEmail = null,
  action = null,
  targetType = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 50
} = {}) {
  try {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(adminEmail && { adminEmail }),
      ...(action && { action }),
      ...(targetType && { targetType }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.adminAuditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

// ============================================
// USER MANAGEMENT (Prisma - replaces Memberstack)
// ============================================

/**
 * List all users with pagination and search
 */
export async function listMembers({
  page = 1,
  limit = 20,
  search = null,
  plan = null
} = {}) {
  try {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      } : {}),
      ...(plan && plan !== 'all' ? {
        subscription: {
          planTier: plan
        }
      } : {})
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          googleId: true,
          createdAt: true,
          lastLogin: true,
          subscription: {
            select: {
              id: true,
              planTier: true,
              status: true,
              stripeSubscriptionId: true,
              stripeCustomerId: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Map to member format for backwards compatibility
    const members = users.map(user => ({
      id: user.id,
      auth: {
        email: user.email
      },
      customFields: {
        'first-name': user.firstName || '',
        firstName: user.firstName || '',
        'last-name': user.lastName || '',
        lastName: user.lastName || ''
      },
      role: user.role,
      verified: user.emailVerified,
      emailVerified: user.emailVerified,
      hasGoogleLinked: !!user.googleId,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      subscription: user.subscription ? {
        id: user.subscription.id,
        planTier: user.subscription.planTier,
        status: user.subscription.status,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        stripeCustomerId: user.subscription.stripeCustomerId,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd
      } : {
        planTier: 'FREE',
        status: 'ACTIVE'
      }
    }));

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error listing users:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Get a single user by ID
 */
export async function getMember(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        googleId: true,
        createdAt: true,
        lastLogin: true,
        subscription: {
          select: {
            id: true,
            planTier: true,
            status: true,
            stripeSubscriptionId: true,
            stripeCustomerId: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true
          }
        }
      }
    });

    if (!user) return null;

    // Map to member format for backwards compatibility
    return {
      id: user.id,
      auth: {
        email: user.email
      },
      customFields: {
        'first-name': user.firstName || '',
        firstName: user.firstName || '',
        'last-name': user.lastName || '',
        lastName: user.lastName || ''
      },
      role: user.role,
      verified: user.emailVerified,
      emailVerified: user.emailVerified,
      hasGoogleLinked: !!user.googleId,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      subscription: user.subscription ? {
        id: user.subscription.id,
        planTier: user.subscription.planTier,
        status: user.subscription.status,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        stripeCustomerId: user.subscription.stripeCustomerId,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd
      } : {
        planTier: 'FREE',
        status: 'ACTIVE'
      }
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Update a user's data
 */
export async function updateMember(userId, updates, adminInfo) {
  try {
    // Get current data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Map incoming updates to prisma fields
    const prismaUpdates = {};
    if (updates.customFields?.['first-name'] !== undefined) {
      prismaUpdates.firstName = updates.customFields['first-name'];
    }
    if (updates.firstName !== undefined) {
      prismaUpdates.firstName = updates.firstName;
    }
    if (updates.lastName !== undefined) {
      prismaUpdates.lastName = updates.lastName;
    }
    if (updates.role !== undefined) {
      prismaUpdates.role = updates.role;
    }
    if (updates.emailVerified !== undefined) {
      prismaUpdates.emailVerified = updates.emailVerified;
    }
    if (updates.verified !== undefined) {
      prismaUpdates.emailVerified = updates.verified;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: prismaUpdates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        googleId: true,
        createdAt: true,
        lastLogin: true
      }
    });

    // Handle plan tier update - Admin can grant any plan without payment
    let updatedSubscription = currentUser.subscription;
    if (updates.planTier !== undefined && updates.planTier !== currentUser.subscription?.planTier) {
      const subscriptionData = {
        planTier: updates.planTier,
        status: 'ACTIVE', // Admin-granted plans are always active
        // Clear Stripe data since this is an admin-granted subscription (no payment required)
        stripeSubscriptionId: null,
        stripePriceId: null,
        currentPeriodStart: new Date(),
        // Set far future expiration for admin-granted paid plans (10 years)
        // For FREE tier, no expiration needed
        currentPeriodEnd: updates.planTier === 'FREE' 
          ? null 
          : new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      };

      if (currentUser.subscription) {
        // Update existing subscription
        updatedSubscription = await prisma.subscription.update({
          where: { userId: userId },
          data: subscriptionData
        });
      } else {
        // Create subscription if it doesn't exist
        updatedSubscription = await prisma.subscription.create({
          data: {
            userId: userId,
            ...subscriptionData
          }
        });
      }

      console.log(`Admin ${adminInfo.email} granted ${updates.planTier} plan to user ${currentUser.email}`);
    }

    // Log the action
    await logAdminAction({
      adminEmail: adminInfo.email,
      adminId: adminInfo.id,
      action: 'UPDATE',
      targetType: 'USER',
      targetId: userId,
      targetName: currentUser.email,
      changes: {
        before: { ...currentUser, subscription: currentUser.subscription },
        after: { ...updatedUser, subscription: updatedSubscription },
        planChanged: updates.planTier !== undefined && updates.planTier !== currentUser.subscription?.planTier
      },
      ipAddress: adminInfo.ipAddress,
      userAgent: adminInfo.userAgent
    });

    // Map to member format
    return {
      id: updatedUser.id,
      auth: {
        email: updatedUser.email
      },
      customFields: {
        'first-name': updatedUser.firstName || '',
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || ''
      },
      role: updatedUser.role,
      verified: updatedUser.emailVerified,
      emailVerified: updatedUser.emailVerified,
      hasGoogleLinked: !!updatedUser.googleId,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin,
      subscription: updatedSubscription ? {
        id: updatedSubscription.id,
        planTier: updatedSubscription.planTier,
        status: updatedSubscription.status,
        stripeSubscriptionId: updatedSubscription.stripeSubscriptionId,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd
      } : { planTier: 'FREE', status: 'ACTIVE' }
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete a user
 */
export async function deleteMember(userId, adminInfo) {
  try {
    // Get current data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Delete user (cascades to related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    // Log the action
    await logAdminAction({
      adminEmail: adminInfo.email,
      adminId: adminInfo.id,
      action: 'DELETE',
      targetType: 'USER',
      targetId: userId,
      targetName: currentUser.email,
      changes: { deleted: currentUser },
      ipAddress: adminInfo.ipAddress,
      userAgent: adminInfo.userAgent
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// ============================================
// ARTICLE MANAGEMENT (Including Drafts)
// ============================================

/**
 * Get all articles (including unpublished for admin)
 */
export async function getAllArticles({
  published = null,
  category = null,
  page = 1,
  limit = 20,
  search = null
} = {}) {
  try {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(published !== null && { published }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [articles, total] = await Promise.all([
      prisma.learningArticle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.learningArticle.count({ where })
    ]);

    // Map backend fields to frontend format
    const mappedArticles = articles.map(article => ({
      ...article,
      description: article.excerpt,
      imageUrl: article.thumbnailUrl,
      status: article.published ? 'published' : 'draft'
    }));

    return {
      articles: mappedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw new Error('Failed to fetch articles');
  }
}

/**
 * Get a single article by ID (for editing)
 */
export async function getArticleById(id) {
  try {
    const article = await prisma.learningArticle.findUnique({
      where: { id }
    });
    
    if (!article) return null;
    
    // Map backend fields to frontend format
    return {
      ...article,
      description: article.excerpt,
      imageUrl: article.thumbnailUrl,
      status: article.published ? 'published' : 'draft'
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    throw new Error('Failed to fetch article');
  }
}

/**
 * Create a new article
 */
export async function createArticle(data, adminInfo) {
  try {
    // Generate slug from title if not provided
    const slug = data.slug || data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Map frontend fields to backend schema
    const published = data.status === 'published' || data.published === true;
    const excerpt = data.description || data.excerpt || '';
    const thumbnailUrl = data.imageUrl || data.thumbnailUrl || null;
    const readTime = data.readTime ? parseInt(data.readTime) : 5;

    const article = await prisma.learningArticle.create({
      data: {
        title: data.title,
        slug,
        excerpt,
        content: data.content || '',
        youtubeUrl: data.youtubeUrl || null,
        thumbnailUrl,
        category: data.category || 'beginner',
        tags: data.tags || [],
        readTime,
        authorName: data.authorName || adminInfo.email,
        authorAvatar: data.authorAvatar || null,
        difficulty: data.difficulty || 'beginner',
        published,
        featured: data.featured || false,
        publishedAt: published ? new Date() : null
      }
    });

    // Log the action
    await logAdminAction({
      adminEmail: adminInfo.email,
      adminId: adminInfo.id,
      action: 'CREATE',
      targetType: 'ARTICLE',
      targetId: article.id,
      targetName: article.title,
      changes: { created: article },
      ipAddress: adminInfo.ipAddress,
      userAgent: adminInfo.userAgent
    });

    return article;
  } catch (error) {
    console.error('Error creating article:', error);
    if (error.code === 'P2002') {
      throw new Error('An article with this slug already exists');
    }
    throw new Error('Failed to create article');
  }
}

/**
 * Update an article
 */
export async function updateArticle(id, data, adminInfo) {
  try {
    // Get current data for audit log
    const currentArticle = await prisma.learningArticle.findUnique({
      where: { id }
    });

    if (!currentArticle) {
      throw new Error('Article not found');
    }

    // Map frontend fields to backend schema
    const updateData = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined || data.excerpt !== undefined) {
      updateData.excerpt = data.description || data.excerpt;
    }
    if (data.content !== undefined) updateData.content = data.content;
    if (data.imageUrl !== undefined || data.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = data.imageUrl || data.thumbnailUrl;
    }
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.readTime !== undefined) {
      updateData.readTime = typeof data.readTime === 'string' ? parseInt(data.readTime) : data.readTime;
    }
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.featured !== undefined) updateData.featured = data.featured;
    
    // Handle status/published field
    if (data.status !== undefined) {
      updateData.published = data.status === 'published';
      if (updateData.published && !currentArticle.published) {
        updateData.publishedAt = new Date();
      }
    } else if (data.published !== undefined) {
      updateData.published = data.published;
      if (updateData.published && !currentArticle.published) {
        updateData.publishedAt = new Date();
      }
    }

    const article = await prisma.learningArticle.update({
      where: { id },
      data: updateData
    });

    // Log the action
    await logAdminAction({
      adminEmail: adminInfo.email,
      adminId: adminInfo.id,
      action: 'UPDATE',
      targetType: 'ARTICLE',
      targetId: article.id,
      targetName: article.title,
      changes: data.changeMessage 
        ? { message: data.changeMessage }
        : {
            before: currentArticle,
            after: article
          },
      ipAddress: adminInfo.ipAddress,
      userAgent: adminInfo.userAgent
    });

    return article;
  } catch (error) {
    console.error('Error updating article:', error);
    if (error.code === 'P2002') {
      throw new Error('An article with this slug already exists');
    }
    throw error;
  }
}

/**
 * Delete an article
 */
export async function deleteArticle(id, adminInfo) {
  try {
    // Get current data for audit log
    const currentArticle = await prisma.learningArticle.findUnique({
      where: { id }
    });

    if (!currentArticle) {
      throw new Error('Article not found');
    }

    await prisma.learningArticle.delete({
      where: { id }
    });

    // Log the action
    await logAdminAction({
      adminEmail: adminInfo.email,
      adminId: adminInfo.id,
      action: 'DELETE',
      targetType: 'ARTICLE',
      targetId: id,
      targetName: currentArticle.title,
      changes: { deleted: currentArticle },
      ipAddress: adminInfo.ipAddress,
      userAgent: adminInfo.userAgent
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
}

// ============================================
// PATTERN MANAGEMENT
// ============================================

/**
 * Get all patterns (for admin)
 */
export async function getAllPatterns({
  patternType = null,
  page = 1,
  limit = 20,
  search = null
} = {}) {
  try {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(patternType && { patternType }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [patterns, total] = await Promise.all([
      prisma.chartPattern.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.chartPattern.count({ where })
    ]);

    // Map backend fields to frontend format
    const mappedPatterns = patterns.map(pattern => ({
      ...pattern,
      title: pattern.name,
      summary: pattern.excerpt,
      status: pattern.published ? 'published' : 'draft'
    }));

    return {
      patterns: mappedPatterns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching patterns:', error);
    throw new Error('Failed to fetch patterns');
  }
}

/**
 * Get a single pattern by ID (for editing)
 */
export async function getPatternById(id) {
  try {
    const pattern = await prisma.chartPattern.findUnique({
      where: { id }
    });
    
    if (!pattern) return null;
    
    // Map backend fields to frontend format
    return {
      ...pattern,
      title: pattern.name,
      summary: pattern.excerpt,
      status: pattern.published ? 'published' : 'draft'
    };
  } catch (error) {
    console.error('Error fetching pattern:', error);
    throw new Error('Failed to fetch pattern');
  }
}

/**
 * Create a new pattern
 */
export async function createPattern(data, adminInfo) {
  try {
    // Map frontend fields to backend schema
    const name = data.title || data.name;
    const excerpt = data.summary || data.excerpt || '';
    const published = data.status === 'published' || data.published === true;
    const category = data.category || data.patternType || 'bullish';
    
    // Generate slug from name if not provided
    const slug = data.slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const pattern = await prisma.chartPattern.create({
      data: {
        name,
        slug,
        imageUrl: data.imageUrl || null,
        description: data.description || '',
        excerpt,
        patternType: category,
        difficulty: data.difficulty || 'beginner',
        keyPoints: data.keyPoints || [],
        howToTrade: data.howToTrade || '',
        examples: data.examples || [],
        reliability: data.reliability || 'medium',
        published
      }
    });

    // Log the action
    await logAdminAction({
      adminEmail: adminInfo.email,
      adminId: adminInfo.id,
      action: 'CREATE',
      targetType: 'PATTERN',
      targetId: pattern.id,
      targetName: pattern.name,
      changes: { created: pattern },
      ipAddress: adminInfo.ipAddress,
      userAgent: adminInfo.userAgent
    });

    return pattern;
  } catch (error) {
    console.error('Error creating pattern:', error);
    if (error.code === 'P2002') {
      throw new Error('A pattern with this slug already exists');
    }
    throw new Error('Failed to create pattern');
  }
}

/**
 * Update a pattern
 */
export async function updatePattern(id, data, adminInfo) {
  try {
    // Get current data for audit log
    const currentPattern = await prisma.chartPattern.findUnique({
      where: { id }
    });

    if (!currentPattern) {
      throw new Error('Pattern not found');
    }

    // Map frontend fields to backend schema
    const updateData = {};
    
    if (data.title !== undefined || data.name !== undefined) {
      updateData.name = data.title || data.name;
    }
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.summary !== undefined || data.excerpt !== undefined) {
      updateData.excerpt = data.summary || data.excerpt;
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.category !== undefined || data.patternType !== undefined) {
      updateData.patternType = data.category || data.patternType;
    }
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.keyPoints !== undefined) updateData.keyPoints = data.keyPoints;
    if (data.howToTrade !== undefined) updateData.howToTrade = data.howToTrade;
    if (data.examples !== undefined) updateData.examples = data.examples;
    if (data.reliability !== undefined) updateData.reliability = data.reliability;
    
    // Handle status/published field
    if (data.status !== undefined) {
      updateData.published = data.status === 'published';
    } else if (data.published !== undefined) {
      updateData.published = data.published;
    }

    const pattern = await prisma.chartPattern.update({
      where: { id },
      data: updateData
    });

    // Log the action
    await logAdminAction({
      adminEmail: adminInfo.email,
      adminId: adminInfo.id,
      action: 'UPDATE',
      targetType: 'PATTERN',
      targetId: pattern.id,
      targetName: pattern.name,
      changes: data.changeMessage 
        ? { message: data.changeMessage }
        : {
            before: currentPattern,
            after: pattern
          },
      ipAddress: adminInfo.ipAddress,
      userAgent: adminInfo.userAgent
    });

    return pattern;
  } catch (error) {
    console.error('Error updating pattern:', error);
    if (error.code === 'P2002') {
      throw new Error('A pattern with this slug already exists');
    }
    throw error;
  }
}

/**
 * Delete a pattern
 */
export async function deletePattern(id, adminInfo) {
  try {
    // Get current data for audit log
    const currentPattern = await prisma.chartPattern.findUnique({
      where: { id }
    });

    if (!currentPattern) {
      throw new Error('Pattern not found');
    }

    await prisma.chartPattern.delete({
      where: { id }
    });

    // Log the action
    await logAdminAction({
      adminEmail: adminInfo.email,
      adminId: adminInfo.id,
      action: 'DELETE',
      targetType: 'PATTERN',
      targetId: id,
      targetName: currentPattern.name,
      changes: { deleted: currentPattern },
      ipAddress: adminInfo.ipAddress,
      userAgent: adminInfo.userAgent
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting pattern:', error);
    throw error;
  }
}

// ============================================
// DASHBOARD STATISTICS
// ============================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  try {
    const [
      totalUsers,
      totalArticles,
      publishedArticles,
      draftArticles,
      featuredArticles,
      totalPatterns,
      recentLogs,
      articlesByCategory,
      patternsByType
    ] = await Promise.all([
      prisma.user.count(),
      prisma.learningArticle.count(),
      prisma.learningArticle.count({ where: { published: true } }),
      prisma.learningArticle.count({ where: { published: false } }),
      prisma.learningArticle.count({ where: { featured: true } }),
      prisma.chartPattern.count(),
      prisma.adminAuditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.learningArticle.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      prisma.chartPattern.groupBy({
        by: ['patternType'],
        _count: { patternType: true }
      })
    ]);

    // Get popular content by views
    const [popularArticles, popularPatterns] = await Promise.all([
      prisma.learningArticle.findMany({
        take: 5,
        orderBy: { viewCount: 'desc' },
        where: { published: true },
        select: { id: true, title: true, slug: true, viewCount: true }
      }),
      prisma.chartPattern.findMany({
        take: 5,
        orderBy: { viewCount: 'desc' },
        select: { id: true, name: true, slug: true, viewCount: true }
      })
    ]);

    // Get recent content (articles and patterns combined)
    const [recentArticles, recentPatterns] = await Promise.all([
      prisma.learningArticle.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, published: true, createdAt: true, updatedAt: true }
      }),
      prisma.chartPattern.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, slug: true, published: true, createdAt: true, updatedAt: true }
      })
    ]);

    // Combine and sort recent content by date
    const recentContent = [
      ...recentArticles.map(a => ({ ...a, type: 'article' })),
      ...recentPatterns.map(p => ({ ...p, title: p.name, type: 'pattern' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    // Combine popular content with type info
    const popularContentCombined = [
      ...popularArticles.map(a => ({ ...a, type: 'article' })),
      ...popularPatterns.map(p => ({ ...p, title: p.name, type: 'pattern' }))
    ].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 10);

    return {
      articles: {
        total: totalArticles,
        published: publishedArticles,
        drafts: draftArticles,
        featured: featuredArticles,
        byCategory: articlesByCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {})
      },
      patterns: {
        total: totalPatterns,
        byType: patternsByType.reduce((acc, item) => {
          acc[item.patternType] = item._count.patternType;
          return acc;
        }, {})
      },
      users: {
        total: totalUsers
      },
      recentActivity: recentLogs,
      recentContent: recentContent,
      popularContent: popularContentCombined
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

export default {
  // Audit logging
  logAdminAction,
  getAuditLogs,
  // User management
  listMembers,
  getMember,
  updateMember,
  deleteMember,
  // Article management
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  // Pattern management
  getAllPatterns,
  getPatternById,
  createPattern,
  updatePattern,
  deletePattern,
  // Dashboard
  getDashboardStats
};
