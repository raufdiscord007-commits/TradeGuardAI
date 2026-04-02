const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    endpoints: {
      crypto: {
        list: 'GET /api/crypto/list?page=1&limit=100',
        details: 'GET /api/crypto/:symbol',
        logo: 'GET /api/crypto/logo/:symbol'
      },
      market: {
        summary: 'GET /api/market/summary',
        fearGreed: 'GET /api/market/fear-greed'
      }
    },
    futureEndpoints: {
      predictions: 'Coming soon - AI price predictions',
      portfolio: 'Coming soon - Portfolio management',
      resources: 'Coming soon - Educational resources'
    }
  });
});

/**
 * @route   GET /api/health/ping
 * @desc    Simple ping endpoint
 * @access  Public
 */
router.get('/ping', (req, res) => {
  res.json({ pong: Date.now() });
});

module.exports = router;
