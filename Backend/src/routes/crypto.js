
const express = require('express');
const router = express.Router();
const binanceService = require('../services/binanceService');
const coingeckoService = require('../services/coingeckoService');
const cache = require('../utils/cache');

/**
 * @route   GET /api/crypto/binance-symbols
 * @desc    Get list of Binance USDT trading pairs (for frontend symbol support check)
 * @access  Public
 */
router.get('/binance-symbols', async (req, res, next) => {
  try {
    const cacheKey = 'binance_symbols';
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ symbols: cached, cached: true });
    }
    const info = await binanceService.getExchangeInfo();
    const symbols = info.symbols || [];
    cache.set(cacheKey, symbols, 300); // cache for 5 min
    res.json({ symbols, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/crypto/list
 * @desc    Get list of top cryptocurrencies
 * @access  Public
 * @query   page (default: 1), limit (default: 100)
 */
router.get('/list', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 100, 250);
    
    const cacheKey = `crypto_list_${page}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    const data = await coingeckoService.getTopCryptos(page, limit);
    
    cache.set(cacheKey, data, process.env.CACHE_TTL_CRYPTO_LIST || 120);
    
    res.json({ ...data, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/crypto/trending
 * @desc    Get trending cryptocurrencies
 * @access  Public
 */
router.get('/trending', async (req, res, next) => {
  try {
    const cacheKey = 'crypto_trending';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    const data = await coingeckoService.getTrending();
    
    cache.set(cacheKey, data, 300); // Cache for 5 minutes
    
    res.json({ ...data, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/crypto/logo/:symbol
 * @desc    Proxy for cryptocurrency logos (hides API key)
 * @access  Public
 */
router.get('/logo/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    const cacheKey = `logo_${upperSymbol}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.redirect(cached);
    }
    
    const logoUrl = await coingeckoService.getCryptoLogo(upperSymbol);
    
    if (logoUrl) {
      cache.set(cacheKey, logoUrl, 86400); // Cache for 24 hours
      return res.redirect(logoUrl);
    }
    
    // Fallback to placeholder
    res.redirect(`https://ui-avatars.com/api/?name=${upperSymbol}&background=random&size=64`);
  } catch (error) {
    // Return placeholder on error
    res.redirect(`https://ui-avatars.com/api/?name=${req.params.symbol}&background=random&size=64`);
  }
});

/**
 * @route   GET /api/crypto/orderbook
 * @desc    Get order book for a trading pair
 * @access  Public
 * @query   symbol (required), limit (default: 20)
 */
router.get('/orderbook', async (req, res, next) => {
  try {
    const { symbol } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 5000);
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    const upperSymbol = symbol.toUpperCase();
    const cacheKey = `orderbook_${upperSymbol}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    const data = await binanceService.getOrderBook(upperSymbol, limit);
    
    // Cache orderbook for 2 seconds (very short-lived data)
    cache.set(cacheKey, data, 2);
    
    res.json({ ...data, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/crypto/trades
 * @desc    Get recent trades for a trading pair
 * @access  Public
 * @query   symbol (required), limit (default: 50)
 */
router.get('/trades', async (req, res, next) => {
  try {
    const { symbol } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    const upperSymbol = symbol.toUpperCase();
    const cacheKey = `trades_${upperSymbol}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    const data = await binanceService.getRecentTrades(upperSymbol, limit);
    
    // Cache trades for 2 seconds (very short-lived data)
    cache.set(cacheKey, data, 2);
    
    res.json({ ...data, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/crypto/:coinId
 * @desc    Get details for a specific cryptocurrency by CoinGecko ID
 * @access  Public
 */
router.get('/:coinId', async (req, res, next) => {
  try {
    const { coinId } = req.params;
    // Keep original casing for CoinGecko IDs (they are lowercase like 'bitcoin', 'ethereum')
    const lowerCoinId = coinId.toLowerCase();
    
    const cacheKey = `crypto_${lowerCoinId}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    // Get data directly from CoinGecko using the coin ID
    let geckoData;
    try {
      geckoData = await coingeckoService.getCryptoDetailsById(lowerCoinId);
    } catch (error) {
      // If rate limited and we have no cache, try to return stale cache with longer TTL
      if (error.status === 429) {
        // Check for any stale cache (even expired)
        const staleCache = cache.get(cacheKey, true);
        if (staleCache) {
          console.log(`[Rate Limited] Serving stale cache for ${lowerCoinId}`);
          // Extend cache for another 10 minutes
          cache.set(cacheKey, staleCache, 600);
          return res.json({ ...staleCache, cached: true, stale: true });
        }
      }
      throw error;
    }
    
    // Flatten CoinGecko details for frontend compatibility
    let market = geckoData.marketData || {};
    let links = geckoData.links || {};
    // Calculate 7d range if possible
    let high7d = null, low7d = null;
    if (Array.isArray(market.high7d) && market.high7d.length) high7d = Math.max(...market.high7d);
    if (Array.isArray(market.low7d) && market.low7d.length) low7d = Math.min(...market.low7d);
    // fallback: use high24h/low24h if 7d not available
    high7d = high7d || market.high24h;
    low7d = low7d || market.low24h;
    // Use new maxSupply and fullyDilutedValuation fields from CoinGecko marketData
    const data = {
      symbol: geckoData.symbol,
      name: geckoData.name,
      image: geckoData.image,
      description: geckoData.description,
      marketCap: market.marketCap,
      fullyDilutedValuation: market.fullyDilutedValuation,
      volume24h: market.volume24h,
      circulatingSupply: market.circulatingSupply,
      totalSupply: market.totalSupply,
      maxSupply: market.maxSupply,
      treasury: market.treasury,
      currentPrice: market.currentPrice,
      high24h: market.high24h,
      low24h: market.low24h,
      high7d,
      low7d,
      ath: market.ath,
      athDate: market.athDate,
      athChangePercentage: market.athChangePercentage,
      atl: market.atl,
      atlDate: market.atlDate,
      atlChangePercentage: market.atlChangePercentage,
      priceChangePercent1h: market.priceChangePercent1h,
      priceChangePercent24h: market.priceChangePercent24h,
      priceChangePercent7d: market.priceChangePercent7d,
      priceChangePercent14d: market.priceChangePercent14d,
      priceChangePercent30d: market.priceChangePercent30d,
      priceChangePercent1y: market.priceChangePercent1y,
      marketCapRank: market.marketCapRank,
      links: {
        homepage: links.homepage ? [links.homepage] : [],
        whitepaper: links.whitepaper || '',
        twitter: links.twitter || '',
        facebook: links.facebook || '',
        reddit: links.reddit || '',
        telegram: links.telegram || ''
      },
      timestamp: new Date().toISOString()
    };
    // Increase cache to 5 minutes (300s) to reduce rate limit issues
    cache.set(cacheKey, data, process.env.CACHE_TTL_CRYPTO_DETAILS || 300);
    res.json({ ...data, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/crypto/:symbol/history
 * @desc    Get price history for a cryptocurrency
 * @access  Public
 * @query   interval (default: 1h), limit (default: 100)
 */
router.get('/:symbol/history', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const interval = req.query.interval || '1h';
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    
    const upperSymbol = symbol.toUpperCase();
    const cacheKey = `history_${upperSymbol}_${interval}_${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    const data = await binanceService.getKlines(`${upperSymbol}USDT`, interval, limit);
    
    // Cache based on interval (shorter intervals = shorter cache)
    const cacheTTL = interval.includes('m') ? 30 : 120;
    cache.set(cacheKey, data, cacheTTL);
    
    res.json({ ...data, cached: false });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
