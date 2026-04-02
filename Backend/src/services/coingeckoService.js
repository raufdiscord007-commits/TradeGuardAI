const axios = require('axios');

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Symbol to CoinGecko ID mapping (most common ones)
const SYMBOL_TO_ID = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'FIL': 'filecoin',
  'HBAR': 'hedera-hashgraph',
  'VET': 'vechain',
  'ALGO': 'algorand',
  'FTM': 'fantom',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AAVE': 'aave',
  'MKR': 'maker',
  'CRV': 'curve-dao-token'
};

/**
 * CoinGecko API Service
 * Handles all interactions with CoinGecko API
 */

/**
 * Get headers for CoinGecko API
 */
function getHeaders() {
  const headers = {
    'Accept': 'application/json'
  };
  
  // Add API key if available (for Pro tier)
  if (process.env.COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  }
  
  return headers;
}

/**
 * Get top cryptocurrencies by market cap
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
async function getTopCryptos(page = 1, limit = 100) {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: page,
        sparkline: false,
        price_change_percentage: '1h,24h,7d'
      },
      headers: getHeaders(),
      timeout: 10000
    });
    
    const cryptos = response.data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      volume24h: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      priceChange24h: coin.price_change_24h,
      priceChangePercent1h: coin.price_change_percentage_1h_in_currency,
      priceChangePercent24h: coin.price_change_percentage_24h_in_currency,
      priceChangePercent7d: coin.price_change_percentage_7d_in_currency,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      ath: coin.ath,
      athChangePercent: coin.ath_change_percentage,
      athDate: coin.ath_date
    }));
    
    return {
      cryptos,
      page,
      limit,
      count: cryptos.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleCoinGeckoError(error, 'getTopCryptos');
  }
}

/**
 * Get trending cryptocurrencies
 */
async function getTrending() {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/search/trending`, {
      headers: getHeaders(),
      timeout: 10000
    });
    
    const coins = response.data.coins.map(item => ({
      id: item.item.id,
      symbol: item.item.symbol.toUpperCase(),
      name: item.item.name,
      marketCapRank: item.item.market_cap_rank,
      image: item.item.small,
      score: item.item.score
    }));
    
    return {
      coins,
      count: coins.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleCoinGeckoError(error, 'getTrending');
  }
}

/**
 * Get cryptocurrency details by symbol
 * @param {string} symbol - Cryptocurrency symbol (e.g., 'BTC')
 */
async function getCryptoDetails(symbol) {
  try {
    let coinId = SYMBOL_TO_ID[symbol.toUpperCase()];
    if (!coinId) {
      // Try to find by searching symbol (case-insensitive)
      const searchResult = await searchCrypto(symbol);
      if (searchResult.coins.length > 0) {
        // Prefer exact symbol match in search results
        const exact = searchResult.coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
        coinId = exact ? exact.id : searchResult.coins[0].id;
      } else {
        // Try searching by name as a fallback
        const nameResult = await searchCrypto(symbol.charAt(0).toUpperCase() + symbol.slice(1).toLowerCase());
        if (nameResult.coins.length > 0) {
          // Prefer exact symbol match in name search results
          const exact = nameResult.coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
          coinId = exact ? exact.id : nameResult.coins[0].id;
        }
      }
    }
    if (!coinId) {
      const err = new Error(`Cryptocurrency '${symbol}' not found on CoinGecko.`);
      err.status = 404;
      throw err;
    }
    return getCryptoDetailsById(coinId);
  } catch (error) {
    handleCoinGeckoError(error, 'getCryptoDetails');
  }
}

/**
 * Get cryptocurrency details by CoinGecko ID
 * @param {string} coinId - CoinGecko coin ID
 */
async function getCryptoDetailsById(coinId) {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false
      },
      headers: getHeaders(),
      timeout: 10000
    });
    
    const coin = response.data;
    
    return {
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image?.large,
      description: coin.description?.en?.substring(0, 500),
      marketData: {
        currentPrice: coin.market_data?.current_price?.usd,
        marketCap: coin.market_data?.market_cap?.usd,
        marketCapRank: coin.market_cap_rank,
        volume24h: coin.market_data?.total_volume?.usd,
        high24h: coin.market_data?.high_24h?.usd,
        low24h: coin.market_data?.low_24h?.usd,
        priceChangePercent1h: coin.market_data?.price_change_percentage_1h,
        priceChangePercent24h: coin.market_data?.price_change_percentage_24h,
        priceChangePercent7d: coin.market_data?.price_change_percentage_7d,
        priceChangePercent14d: coin.market_data?.price_change_percentage_14d,
        priceChangePercent30d: coin.market_data?.price_change_percentage_30d,
        priceChangePercent1y: coin.market_data?.price_change_percentage_1y,
        circulatingSupply: coin.market_data?.circulating_supply,
        totalSupply: coin.market_data?.total_supply,
        maxSupply: coin.market_data?.max_supply,
        fullyDilutedValuation: coin.market_data?.fully_diluted_valuation?.usd,
        treasury: null, // CoinGecko doesn't provide treasury data
        ath: coin.market_data?.ath?.usd,
        athDate: coin.market_data?.ath_date?.usd,
        athChangePercentage: coin.market_data?.ath_change_percentage?.usd,
        atl: coin.market_data?.atl?.usd,
        atlDate: coin.market_data?.atl_date?.usd,
        atlChangePercentage: coin.market_data?.atl_change_percentage?.usd
      },
      links: {
        homepage: coin.links?.homepage?.[0],
        blockchain: coin.links?.blockchain_site?.filter(Boolean),
        twitter: coin.links?.twitter_screen_name,
        reddit: coin.links?.subreddit_url
      },
      categories: coin.categories,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleCoinGeckoError(error, 'getCryptoDetailsById');
  }
}

/**
 * Get crypto logo URL
 * @param {string} symbol - Cryptocurrency symbol
 */
async function getCryptoLogo(symbol) {
  try {
    const coinId = SYMBOL_TO_ID[symbol.toUpperCase()];
    
    if (!coinId) {
      // Try searching
      const searchResult = await searchCrypto(symbol);
      if (searchResult.coins.length > 0) {
        return searchResult.coins[0].image;
      }
      return null;
    }
    
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: false,
        community_data: false,
        developer_data: false,
        sparkline: false
      },
      headers: getHeaders(),
      timeout: 5000
    });
    
    return response.data.image?.large || response.data.image?.small;
  } catch (error) {
    console.error('Error fetching crypto logo:', error.message);
    return null;
  }
}

/**
 * Search for cryptocurrencies
 * @param {string} query - Search query
 */
async function searchCrypto(query) {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/search`, {
      params: { query },
      headers: getHeaders(),
      timeout: 5000
    });
    
    return {
      coins: response.data.coins.slice(0, 10).map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.large,
        marketCapRank: coin.market_cap_rank
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleCoinGeckoError(error, 'searchCrypto');
  }
}

/**
 * Get global cryptocurrency data
 */
async function getGlobalData() {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/global`, {
      headers: getHeaders(),
      timeout: 5000
    });
    
    const data = response.data.data;
    
    return {
      activeCryptocurrencies: data.active_cryptocurrencies,
      markets: data.markets,
      totalMarketCap: data.total_market_cap?.usd,
      totalVolume24h: data.total_volume?.usd,
      marketCapPercentage: {
        btc: data.market_cap_percentage?.btc,
        eth: data.market_cap_percentage?.eth
      },
      marketCapChangePercent24h: data.market_cap_change_percentage_24h_usd,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    handleCoinGeckoError(error, 'getGlobalData');
  }
}

/**
 * Get Fear & Greed Index (using alternative.me API)
 */
async function getFearGreedIndex() {
  try {
    // Using alternative.me API for Fear & Greed Index
    const response = await axios.get('https://api.alternative.me/fng/', {
      params: { limit: 1 },
      timeout: 5000
    });
    
    const data = response.data.data[0];
    
    return {
      value: parseInt(data.value),
      classification: data.value_classification,
      timestamp: new Date(data.timestamp * 1000).toISOString(),
      nextUpdate: new Date((parseInt(data.time_until_update) + Date.now() / 1000) * 1000).toISOString()
    };
  } catch (error) {
    // Return a fallback if Fear & Greed API fails
    console.error('Fear & Greed API error:', error.message);
    return {
      value: null,
      classification: 'Unknown',
      error: 'Failed to fetch Fear & Greed Index',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Handle CoinGecko API errors
 */
function handleCoinGeckoError(error, functionName) {
  if (error.response) {
    const cgError = new Error(
      `CoinGecko API Error in ${functionName}: ${error.response.data?.error || error.message}`
    );
    cgError.status = error.response.status;
    
    // Handle rate limiting
    if (error.response.status === 429) {
      cgError.message = 'CoinGecko API rate limit exceeded. Please try again later.';
    }
    
    throw cgError;
  } else if (error.request) {
    const networkError = new Error(`CoinGecko API network error in ${functionName}: No response received`);
    networkError.status = 503;
    throw networkError;
  } else {
    throw error;
  }
}

module.exports = {
  getTopCryptos,
  getTrending,
  getCryptoDetails,
  getCryptoDetailsById,
  getCryptoLogo,
  searchCrypto,
  getGlobalData,
  getFearGreedIndex
};
