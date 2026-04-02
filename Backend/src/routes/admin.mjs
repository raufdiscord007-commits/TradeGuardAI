/**
 * Admin Routes
 * Protected API endpoints for admin operations
 */

import express from 'express';
import { requireAdmin } from '../middleware/adminMiddleware.mjs';
import * as adminService from '../services/adminService.mjs';

const router = express.Router();

// Async handler wrapper for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper to get admin info from request
const getAdminInfo = (req) => ({
  email: req.admin?.email || req.user?.email || req.headers['x-admin-email'],
  id: req.admin?.id || req.user?.userId || req.headers['x-admin-id'] || 'unknown',
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.headers['user-agent']
});

// ============================================
// DASHBOARD
// ============================================

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', requireAdmin, asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: stats });
}));

// ============================================
// AUDIT LOGS
// ============================================

/**
 * GET /api/admin/logs
 * Get audit logs with filtering
 */
router.get('/logs', requireAdmin, asyncHandler(async (req, res) => {
  const { 
    adminEmail, 
    action, 
    targetType, 
    startDate, 
    endDate, 
    page = 1, 
    limit = 50 
  } = req.query;

  const result = await adminService.getAuditLogs({
    adminEmail,
    action,
    targetType,
    startDate,
    endDate,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({ success: true, data: result.logs, pagination: result.pagination });
}));

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/members
 * List all members with pagination
 */
router.get('/members', requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, plan } = req.query;

  const result = await adminService.listMembers({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    plan
  });

  res.json({ 
    success: true, 
    data: result.members, 
    pagination: result.pagination,
    ...(result.warning && { warning: result.warning })
  });
}));

/**
 * GET /api/admin/members/:id
 * Get a single member by ID
 */
router.get('/members/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await adminService.getMember(id);

  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found' });
  }

  res.json({ success: true, data: member });
}));

/**
 * PUT /api/admin/members/:id
 * Update a member
 */
router.put('/members/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const adminInfo = getAdminInfo(req);

  const member = await adminService.updateMember(id, updates, adminInfo);
  res.json({ success: true, data: member });
}));

/**
 * DELETE /api/admin/members/:id
 * Delete a member
 */
router.delete('/members/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminInfo = getAdminInfo(req);

  await adminService.deleteMember(id, adminInfo);
  res.json({ success: true, message: 'Member deleted successfully' });
}));

// ============================================
// ARTICLE MANAGEMENT
// ============================================

/**
 * GET /api/admin/articles
 * List all articles (including drafts)
 */
router.get('/articles', requireAdmin, asyncHandler(async (req, res) => {
  const { published, category, page = 1, limit = 20, search } = req.query;

  const result = await adminService.getAllArticles({
    published: published === 'true' ? true : published === 'false' ? false : null,
    category,
    page: parseInt(page),
    limit: parseInt(limit),
    search
  });

  res.json({ success: true, data: result.articles, pagination: result.pagination });
}));

/**
 * GET /api/admin/articles/:id
 * Get a single article by ID
 */
router.get('/articles/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const article = await adminService.getArticleById(id);

  if (!article) {
    return res.status(404).json({ success: false, error: 'Article not found' });
  }

  res.json({ success: true, data: article });
}));

/**
 * POST /api/admin/articles
 * Create a new article
 */
router.post('/articles', requireAdmin, asyncHandler(async (req, res) => {
  const data = req.body;
  const adminInfo = getAdminInfo(req);

  // Validate required fields
  if (!data.title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  const article = await adminService.createArticle(data, adminInfo);
  res.status(201).json({ success: true, data: article });
}));

/**
 * PUT /api/admin/articles/:id
 * Update an article
 */
router.put('/articles/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const adminInfo = getAdminInfo(req);

  const article = await adminService.updateArticle(id, data, adminInfo);
  res.json({ success: true, data: article });
}));

/**
 * DELETE /api/admin/articles/:id
 * Delete an article
 */
router.delete('/articles/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminInfo = getAdminInfo(req);

  await adminService.deleteArticle(id, adminInfo);
  res.json({ success: true, message: 'Article deleted successfully' });
}));

// ============================================
// PATTERN MANAGEMENT
// ============================================

/**
 * GET /api/admin/patterns
 * List all patterns
 */
router.get('/patterns', requireAdmin, asyncHandler(async (req, res) => {
  const { patternType, page = 1, limit = 20, search } = req.query;

  const result = await adminService.getAllPatterns({
    patternType,
    page: parseInt(page),
    limit: parseInt(limit),
    search
  });

  res.json({ success: true, data: result.patterns, pagination: result.pagination });
}));

/**
 * GET /api/admin/patterns/:id
 * Get a single pattern by ID
 */
router.get('/patterns/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pattern = await adminService.getPatternById(id);

  if (!pattern) {
    return res.status(404).json({ success: false, error: 'Pattern not found' });
  }

  res.json({ success: true, data: pattern });
}));

/**
 * POST /api/admin/patterns
 * Create a new pattern
 */
router.post('/patterns', requireAdmin, asyncHandler(async (req, res) => {
  const data = req.body;
  const adminInfo = getAdminInfo(req);

  // Validate required fields
  if (!data.name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }

  const pattern = await adminService.createPattern(data, adminInfo);
  res.status(201).json({ success: true, data: pattern });
}));

/**
 * PUT /api/admin/patterns/:id
 * Update a pattern
 */
router.put('/patterns/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const adminInfo = getAdminInfo(req);

  const pattern = await adminService.updatePattern(id, data, adminInfo);
  res.json({ success: true, data: pattern });
}));

/**
 * DELETE /api/admin/patterns/:id
 * Delete a pattern
 */
router.delete('/patterns/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminInfo = getAdminInfo(req);

  await adminService.deletePattern(id, adminInfo);
  res.json({ success: true, message: 'Pattern deleted successfully' });
}));

// ============================================
// ERROR HANDLER
// ============================================

router.use((err, req, res, next) => {
  console.error('Admin route error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An error occurred in admin service',
    code: err.code || 'ADMIN_ERROR'
  });
});

export default router;
