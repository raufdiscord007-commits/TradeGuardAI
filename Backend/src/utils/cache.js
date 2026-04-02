const NodeCache = require('node-cache');

/**
 * In-memory cache utility
 * Uses node-cache for simple key-value caching
 * 
 * For production, consider using Redis instead
 */

// Create cache instance with default TTL of 60 seconds
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false, // Better performance, but be careful with object mutations
  deleteOnExpire: true
});

// Create a longer-lived stale cache for rate limit fallback
const staleCache = new NodeCache({
  stdTTL: 3600, // Keep stale data for 1 hour
  checkperiod: 600,
  useClones: false
});

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @param {boolean} allowStale - Allow returning expired values from stale cache
 * @returns {any} Cached value or undefined
 */
function get(key, allowStale = false) {
  const value = cache.get(key);
  
  // If value exists in main cache, return it
  if (value !== undefined) {
    return value;
  }
  
  // If allowStale is true, try stale cache
  if (allowStale) {
    const staleValue = staleCache.get(key);
    if (staleValue !== undefined) {
      console.log(`[Cache] Returning stale data for key: ${key}`);
      return staleValue;
    }
  }
  
  return undefined;
}

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {boolean} Success status
 */
function set(key, value, ttl = undefined) {
  // Store in both main cache and stale cache
  staleCache.set(key, value, 3600); // Keep in stale cache for 1 hour
  return cache.set(key, value, ttl);
}

/**
 * Delete a value from cache
 * @param {string} key - Cache key
 * @returns {number} Number of deleted entries
 */
function del(key) {
  return cache.del(key);
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {boolean}
 */
function has(key) {
  return cache.has(key);
}

/**
 * Get all keys in cache
 * @returns {string[]} Array of cache keys
 */
function keys() {
  return cache.keys();
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
function stats() {
  return cache.getStats();
}

/**
 * Flush all cache entries
 */
function flush() {
  cache.flushAll();
}

/**
 * Get or set pattern - fetch from cache or execute function
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds
 * @returns {any} Cached or fetched value
 */
async function getOrSet(key, fetchFn, ttl = 60) {
  const cached = get(key);
  
  if (cached !== undefined) {
    return { data: cached, cached: true };
  }
  
  const data = await fetchFn();
  set(key, data, ttl);
  
  return { data, cached: false };
}

// Log cache stats periodically in development
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const s = stats();
    if (s.keys > 0) {
      console.log(`[Cache] Keys: ${s.keys}, Hits: ${s.hits}, Misses: ${s.misses}`);
    }
  }, 60000); // Log every minute
}

module.exports = {
  get,
  set,
  del,
  has,
  keys,
  stats,
  flush,
  getOrSet
};
