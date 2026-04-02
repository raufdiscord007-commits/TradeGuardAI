const express = require('express');
const router = express.Router();
const binanceService = require('../services/binanceService');
const coingeckoService = require('../services/coingeckoService');
const cache = require('../utils/cache');

/**
 * @route   GET /api/market/summary
 * @desc    Get market summary (BTC, ETH prices, market cap, etc.)
 * @access  Public
 */
router.get('/summary', async (req, res, next) => {
  try {
    const cacheKey = 'market_summary';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    // Fetch data in parallel
    const [btcData, ethData, globalData] = await Promise.allSettled([
      binanceService.getSymbolTicker('BTCUSDT'),
      binanceService.getSymbolTicker('ETHUSDT'),
      coingeckoService.getGlobalData()
    ]);
    
    const summary = {
      bitcoin: btcData.status === 'fulfilled' ? {
        symbol: 'BTC',
        price: parseFloat(btcData.value.lastPrice),
        change24h: parseFloat(btcData.value.priceChangePercent),
        volume24h: parseFloat(btcData.value.volume),
        high24h: parseFloat(btcData.value.highPrice),
        low24h: parseFloat(btcData.value.lowPrice)
      } : null,
      ethereum: ethData.status === 'fulfilled' ? {
        symbol: 'ETH',
        price: parseFloat(ethData.value.lastPrice),
        change24h: parseFloat(ethData.value.priceChangePercent),
        volume24h: parseFloat(ethData.value.volume),
        high24h: parseFloat(ethData.value.highPrice),
        low24h: parseFloat(ethData.value.lowPrice)
      } : null,
      global: globalData.status === 'fulfilled' ? globalData.value : null,
      timestamp: new Date().toISOString()
    };
    
    cache.set(cacheKey, summary, process.env.CACHE_TTL_MARKET_SUMMARY || 30);
    
    res.json({ ...summary, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/market/fear-greed
 * @desc    Get Fear & Greed Index
 * @access  Public
 */
router.get('/fear-greed', async (req, res, next) => {
  try {
    const cacheKey = 'fear_greed';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    const data = await coingeckoService.getFearGreedIndex();
    
    cache.set(cacheKey, data, 600); // Cache for 10 minutes
    
    res.json({ ...data, cached: false });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/market/tickers
 * @desc    Get multiple symbol tickers at once
 * @access  Public
 * @query   symbols (comma-separated, e.g., BTC,ETH,SOL)
 */
router.get('/tickers', async (req, res, next) => {
  try {
    const symbolsParam = req.query.symbols || 'BTC,ETH,SOL';
    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    
    const cacheKey = `tickers_${symbols.join('_')}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    const tickerPromises = symbols.map(symbol => 
      binanceService.getSymbolTicker(`${symbol}USDT`)
        .then(data => ({ symbol, ...data, error: null }))
        .catch(error => ({ symbol, error: error.message }))
    );
    
    const results = await Promise.all(tickerPromises);
    
    const data = {
      tickers: results,
      count: results.length,
      timestamp: new Date().toISOString()
    };
    
    cache.set(cacheKey, data, 15); // Cache for 15 seconds
    
    res.json({ ...data, cached: false });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
