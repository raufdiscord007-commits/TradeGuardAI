// Utility to fetch and cache the list of Binance USDT trading pairs
let binanceSymbolsCache = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getBinanceSymbols() {
  const now = Date.now();
  if (binanceSymbolsCache && (now - lastFetch < CACHE_TTL)) {
    return binanceSymbolsCache;
  }
  try {
    // Use backend proxy to avoid CORS
    const getApiBaseUrl = () => {
      const viteUrl = import.meta.env.VITE_API_URL;
      return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
    };
    const res = await fetch(`${getApiBaseUrl()}/api/crypto/binance-symbols`);
    if (!res.ok) throw new Error('Failed to fetch Binance symbols');
    const data = await res.json();
    // Expecting { symbols: [ { symbol, baseAsset, quoteAsset, ... } ] }
    binanceSymbolsCache = data.symbols || [];
    lastFetch = now;
    return binanceSymbolsCache;
  } catch (e) {
    // fallback: empty array
    return [];
  }
}

// Helper: check if a symbol (e.g. 'PYUSDUSDT') is supported on Binance
export async function isBinanceSymbolSupported(symbol) {
  const symbols = await getBinanceSymbols();
  return symbols.some(s => s.symbol === symbol.toUpperCase());
}