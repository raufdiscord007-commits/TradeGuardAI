require('dotenv').config();
const portfolioRoutes = require('./routes/portfolioRoutes');
const cors = require('cors');

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('passport');

// Import Passport configuration
const { configurePassport } = require('./config/passport');

// Import routes
const cryptoRoutes = require('./routes/crypto');
const marketRoutes = require('./routes/market');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const predictionsRoutes = require('./routes/predictions');

// Import resources routes (ES Module)
let resourcesRoutes;
import('./routes/resources.mjs').then(module => {
  resourcesRoutes = module.default;
}).catch(err => {
  console.error('Failed to load resources routes:', err);
});

// Import admin routes (ES Module)
let adminRoutes;
import('./routes/admin.mjs').then(module => {
  adminRoutes = module.default;
}).catch(err => {
  console.error('Failed to load admin routes:', err);
});

// CoinGecko Proxy Integration
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Configure Passport.js strategies
configurePassport();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Email', 'X-Admin-Id']
}));

// Cookie parser
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Rate limiting - general
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60
  }
});
app.use('/api/', limiter);
// 🚨 THE BACKEND RADAR 🚨
app.use('/api/portfolio', (req, res, next) => {
  console.log(`\n=========================================`);
  console.log(`📡 DEVICE DETECTED! Ping from IP: ${req.ip}`);
  console.log(`✅ Backend is successfully sending the new data!`);
  console.log(`=========================================\n`);
  next();
}, portfolioRoutes);
// Rate limiting - auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
// NOTE: Stripe webhook needs raw body, so we handle it before JSON parsing
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/predictions', predictionsRoutes);

// Logo proxy route - fetches crypto logos from Logo.dev
app.get('/api/logo/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toLowerCase();
    const logoDevUrl = `https://img.logo.dev/ticker/${symbol}?token=${process.env.LOGO_DEV_API_KEY || 'pk_NPEGddObTf6Youc6KFKT6w'}`;
    
    const response = await fetch(logoDevUrl);
    if (!response.ok) {
      // Return a placeholder if logo not found
      return res.redirect(`https://ui-avatars.com/api/?name=${symbol.toUpperCase()}&background=1e65fa&color=fff&size=128`);
    }
    
    // Forward the image
    res.set('Content-Type', response.headers.get('Content-Type'));
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    response.body.pipe(res);
  } catch (error) {
    console.error('Logo proxy error:', error);
    res.redirect(`https://ui-avatars.com/api/?name=${req.params.symbol.toUpperCase()}&background=1e65fa&color=fff&size=128`);
  }
});

// Resources routes (loaded dynamically as ES Module)
app.use('/api/resources', (req, res, next) => {
  if (resourcesRoutes) {
    return resourcesRoutes(req, res, next);
  }
  res.status(503).json({ error: 'Resources service is loading, please try again' });
});

// Admin routes (loaded dynamically as ES Module)
app.use('/api/admin', (req, res, next) => {
  if (adminRoutes) {
    return adminRoutes(req, res, next);
  }
  res.status(503).json({ error: 'Admin service is loading, please try again' });
});

// Proxy /api/coingecko/* to CoinGecko API
app.use(
  '/api/coingecko',
  createProxyMiddleware({
    target: 'https://api.coingecko.com/api/v3',
    changeOrigin: true,
    pathRewrite: { '^/api/coingecko': '' },
    onProxyReq: (proxyReq, req, res) => {
      // Optionally add headers, API keys, etc.
    },
  })
);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TradeGuardAI API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/crypto/list',
      'GET /api/crypto/:symbol',
      'GET /api/crypto/logo/:symbol',
      'GET /api/market/summary',
      'GET /api/market/fear-greed',
      'GET /api/resources/articles',
      'GET /api/resources/articles/:slug',
      'GET /api/resources/patterns',
      'GET /api/resources/patterns/:slug',
      'GET /api/resources/search?q=query',
      'GET /api/resources/bookmarks/:userId',
      'POST /api/resources/bookmarks',
      'DELETE /api/resources/bookmarks',
      'POST /api/auth/register/init',
      'POST /api/auth/register/verify',
      'POST /api/auth/login',
      'GET /api/auth/google',
      'GET /api/auth/me',
      'GET /api/subscription/plans',
      'GET /api/subscription/status',
      'POST /api/subscription/create-checkout-session',
      'POST /api/subscription/create-portal-session',
      'POST /api/subscription/cancel'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 TradeGuardAI Backend Server`);
  console.log(`http://0.0.0.0:${PORT} (Listening on Wi-Fi!)`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
