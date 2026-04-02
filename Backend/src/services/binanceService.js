const axios = require('axios');

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

/**
 * Binance API Service
 * Handles all interactions with Binance public API
 */

/**
 * Get current price for a symbol
 * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
 */
async function getSymbolPrice(symbol) {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/ticker/price`, {
      params: { symbol },
      timeout: 5000
    });
    
    return {
      symbol: response.data.symbol,
      price: parseFloat(response.data.price),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleBinanceError(error, 'getSymbolPrice');
  }
}

/**
 * Get 24hr ticker for a symbol
 * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
 */
async function getSymbolTicker(symbol) {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/ticker/24hr`, {
      params: { symbol },
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    handleBinanceError(error, 'getSymbolTicker');
  }
}

/**
 * Get klines (candlestick) data
 * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {string} interval - Kline interval (e.g., '1m', '1h', '1d')
 * @param {number} limit - Number of klines to fetch (max 1000)
 */
async function getKlines(symbol, interval = '1h', limit = 100) {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/klines`, {
      params: { symbol, interval, limit },
      timeout: 10000
    });
    
    // Transform kline data to more readable format
    const klines = response.data.map(k => ({
      openTime: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6],
      quoteVolume: parseFloat(k[7]),
      trades: k[8],
      takerBuyBaseVolume: parseFloat(k[9]),
      takerBuyQuoteVolume: parseFloat(k[10])
    }));
    
    return {
      symbol,
      interval,
      klines,
      count: klines.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleBinanceError(error, 'getKlines');
  }
}

/**
 * Get order book depth
 * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {number} limit - Depth limit (5, 10, 20, 50, 100, 500, 1000, 5000)
 */
async function getOrderBook(symbol, limit = 20) {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/depth`, {
      params: { symbol, limit },
      timeout: 5000
    });
    
    return {
      symbol,
      lastUpdateId: response.data.lastUpdateId,
      bids: response.data.bids.map(([price, qty]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty)
      })),
      asks: response.data.asks.map(([price, qty]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty)
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleBinanceError(error, 'getOrderBook');
  }
}

/**
 * Get recent trades
 * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {number} limit - Number of trades (max 1000)
 */
async function getRecentTrades(symbol, limit = 50) {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/trades`, {
      params: { symbol, limit },
      timeout: 5000
    });
    
    return {
      symbol,
      trades: response.data.map(t => ({
        id: t.id,
        price: parseFloat(t.price),
        qty: parseFloat(t.qty),
        time: t.time,
        isBuyerMaker: t.isBuyerMaker
      })),
      count: response.data.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleBinanceError(error, 'getRecentTrades');
  }
}

/**
 * Get exchange info
 */
async function getExchangeInfo() {
  try {
    const response = await axios.get(`${BINANCE_BASE_URL}/exchangeInfo`, {
      timeout: 10000
    });
    
    return {
      timezone: response.data.timezone,
      serverTime: response.data.serverTime,
      symbolCount: response.data.symbols.length,
      symbols: response.data.symbols
        .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
        .map(s => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          status: s.status
        }))
    };
  } catch (error) {
    handleBinanceError(error, 'getExchangeInfo');
  }
}

/**
 * Handle Binance API errors
 */
function handleBinanceError(error, functionName) {
  if (error.response) {
    const binanceError = new Error(
      `Binance API Error in ${functionName}: ${error.response.data?.msg || error.message}`
    );
    binanceError.status = error.response.status;
    binanceError.code = error.response.data?.code;
    throw binanceError;
  } else if (error.request) {
    const networkError = new Error(`Binance API network error in ${functionName}: No response received`);
    networkError.status = 503;
    throw networkError;
  } else {
    throw error;
  }
}

module.exports = {
  getSymbolPrice,
  getSymbolTicker,
  getKlines,
  getOrderBook,
  getRecentTrades,
  getExchangeInfo
};
