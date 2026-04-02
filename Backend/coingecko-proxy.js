// Improved CoinGecko proxy with caching and rate limiting
const express = require('express');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 4001;

// In-memory cache (10 min TTL)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false });

// Allow CORS for local frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Rate limiting (per IP)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { error: 'Too many requests to CoinGecko proxy. Please try again later.' }
});
app.use('/api/coingecko/', limiter);

// Proxy endpoint for CoinGecko with caching
app.get('/api/coingecko/*', async function (req, res) {
  const url = 'https://api.coingecko.com/api/v3/' + req.params[0] + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached);
  }
  try {
    const cgRes = await fetch(url);
    const data = await cgRes.json();
    if (cgRes.status === 200) {
      cache.set(cacheKey, data);
      res.setHeader('X-Cache', 'MISS');
      return res.status(200).json(data);
    } else if (cgRes.status === 429 && cached) {
      // Serve stale data if rate limited
      res.setHeader('X-Cache', 'STALE429');
      return res.status(200).json(cached);
    } else {
      return res.status(cgRes.status).json(data);
    }
  } catch (err) {
    if (cached) {
      res.setHeader('X-Cache', 'STALEERR');
      return res.status(200).json(cached);
    }
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`CoinGecko proxy running on http://localhost:${PORT}`);
});
