import React, { useState, useEffect, memo } from 'react';
import MarketChange from './MarketChange';
import coinOverrides from './coinOverrides';

const MarketSummary = ({ symbol = 'BTCUSDT', coinId = 'bitcoin', name = 'Bitcoin', priceChanges = {} }) => {
  const [marketData, setMarketData] = useState({
    marketCap: null,
    fullyDilutedValuation: null,
    volume24h: null,
    circulatingSupply: null,
    totalSupply: null,
    maxSupply: null,
    treasury: null,
    currentPrice: null,
    high24h: null,
    low24h: null,
    high7d: null,
    low7d: null,
    ath: null,
    athChangePercentage: null,
    athDate: '',
    atl: null,
    atlChangePercentage: null,
    atlDate: '',
    links: {
      homepage: [],
      whitepaper: '',
      twitter: '',
      facebook: '',
      reddit: '',
      telegram: '',
    }
  });

  const [converter, setConverter] = useState({
    btc: 1,
    usdt: 0
  });

  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(1000); // Start with 1 second delay

  useEffect(() => {
    // Always use base symbol for CoinGecko lookups (strip 'USDT', 'USD', etc.)
    const baseSymbol = symbol.replace(/(USDT|USD|BUSD|USDC)$/i, '');
    
    // Reset states when coin changes
    setIsLoading(true);
    setError(null);
    setDebugInfo({ symbol, coinId, baseSymbol, stage: 'starting' });
    
    // Reset market data to prevent stale data
    setMarketData({
      marketCap: null,
      fullyDilutedValuation: null,
      volume24h: null,
      circulatingSupply: null,
      totalSupply: null,
      maxSupply: null,
      treasury: null,
      currentPrice: null,
      high24h: null,
      low24h: null,
      high7d: null,
      low7d: null,
      ath: null,
      athChangePercentage: null,
      athDate: '',
      atl: null,
      atlChangePercentage: null,
      atlDate: '',
      links: {
        homepage: [],
        whitepaper: '',
        twitter: '',
        facebook: '',
        reddit: '',
        telegram: '',
      }
    });
    
    let cancelled = false;
    
    const fetchMarketData = async () => {
      try {
        // Check localStorage cache first (3 minute cache)
        const cacheKey = `market_${coinId}_${symbol}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const age = Date.now() - parsed.timestamp;
            if (age < 180000) { // 3 minutes = 180000ms
              setMarketData(parsed.data);
              setDebugInfo({ ...parsed.debugInfo, cached: true, age: Math.round(age/1000) + 's' });
              setError(null);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem(cacheKey);
          }
        }
        
        // Resolve CoinGecko ID - use coinId prop directly (it comes from CoinGecko list API)
        let resolvedCgId = coinId;
        
        // Fallback: try to resolve from symbol using overrides
        if (!resolvedCgId || resolvedCgId === '') {
          const maybeSym = String(baseSymbol || '').toLowerCase();
          if (coinOverrides[maybeSym]) {
            resolvedCgId = coinOverrides[maybeSym];
          }
        }
        
        // Final fallback: use lowercase baseSymbol as potential CoinGecko ID
        if (!resolvedCgId || resolvedCgId === '') {
          resolvedCgId = baseSymbol.toLowerCase();
        }
        
        setDebugInfo(prev => ({ ...prev, resolvedCgId, stage: 'fetching' }));
        
        if (!resolvedCgId) {
          throw new Error('Could not resolve CoinGecko ID from props');
        }
        
        const getApiBaseUrl = () => {
          const viteUrl = import.meta.env.VITE_API_URL;
          return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
        };
        const apiUrl = `${getApiBaseUrl()}/api/crypto/${resolvedCgId}`;
        setDebugInfo(prev => ({ ...prev, apiUrl }));
        
        const cgRes = await fetch(apiUrl);
        const responseText = await cgRes.text();
        
        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseErr) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }
        
        // Check for API error response
        if (!cgRes.ok) {
          const errorMsg = data.error || data.message || `HTTP ${cgRes.status}`;
          throw new Error(`API Error (${cgRes.status}): ${errorMsg}`);
        }
        
        // Check if data has required fields
        if (data.marketCap === undefined && data.currentPrice === undefined) {
          setDebugInfo(prev => ({ ...prev, warning: 'Incomplete data from API', rawData: data }));
        }
        
        if (!cancelled) {
          const marketDataObj = {
            marketCap: data.marketCap ?? null,
            fullyDilutedValuation: data.fullyDilutedValuation ?? null,
            volume24h: data.volume24h ?? null,
            circulatingSupply: data.circulatingSupply ?? null,
            totalSupply: data.totalSupply ?? null,
            maxSupply: data.maxSupply ?? null,
            treasury: data.treasury ?? null,
            currentPrice: data.currentPrice ?? null,
            high24h: data.high24h ?? null,
            low24h: data.low24h ?? null,
            high7d: data.high7d ?? null,
            low7d: data.low7d ?? null,
            ath: data.ath ?? null,
            athChangePercentage: data.athChangePercentage ?? null,
            athDate: data.athDate || '',
            atl: data.atl ?? null,
            atlChangePercentage: data.atlChangePercentage ?? null,
            atlDate: data.atlDate || '',
            links: data.links || {
              homepage: [],
              whitepaper: '',
              twitter: '',
              facebook: '',
              reddit: '',
              telegram: ''
            },
          };
          
          setMarketData(marketDataObj);
          
          // Cache in localStorage
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: marketDataObj,
              timestamp: Date.now(),
              debugInfo: { symbol, coinId, resolvedCgId }
            }));
          } catch (e) {
            // Cache write failed - non-critical
          }
          
          setDebugInfo(prev => ({ ...prev, stage: 'success', dataReceived: true }));
          setError(null);
          setIsLoading(false);
          setRetryDelay(1000); // Reset retry delay on success
        }
      } catch (err) {
        if (!cancelled) {
          let friendlyError = err.message;
          
          // Make rate limit errors more user-friendly
          if (err.message.includes('429') || err.message.includes('rate limit')) {
            friendlyError = 'CoinGecko rate limit reached. Using cached data if available. Data will auto-refresh in 60 seconds.';
            
            // Try to use stale cache if available
            const cacheKey = `market_${coinId}_${symbol}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
              try {
                const parsed = JSON.parse(cachedData);
                setMarketData(parsed.data);
                setDebugInfo({ ...parsed.debugInfo, stale: true, errorFallback: true });
                setError('Using cached data (may be outdated)');
                setIsLoading(false);
                
                // Auto-retry after 60 seconds
                setTimeout(() => {
                  setRetryCount(prev => prev + 1);
                }, 60000);
                return;
              } catch (e) {
                // Stale cache unusable
              }
            }
          }
          
          setError(friendlyError);
          setDebugInfo(prev => ({ ...prev, stage: 'error', errorMessage: err.message }));
          setIsLoading(false);
        }
      }
    };
    
    fetchMarketData();
    
    // Set up periodic refresh every 2 minutes while on the same coin
    const refreshInterval = setInterval(() => {
      fetchMarketData();
    }, 120000); // 2 minutes
    
    return () => { 
      cancelled = true;
      clearInterval(refreshInterval);
    };
  }, [symbol, coinId, retryCount]);

  // Update converter when price changes
  useEffect(() => {
    if (marketData.currentPrice) {
      setConverter(prev => ({
        ...prev,
        usdt: prev.btc * marketData.currentPrice
      }));
    }
  }, [marketData.currentPrice]);

  // Helper functions
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    // For very large numbers, use compact notation
    if (value >= 1e12) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value);
    }
    if (value >= 1e9) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    
    // For very small values, use subscript notation for leading zeros
    if (value > 0 && value < 1) {
      const str = value.toString();
      const match = str.match(/^0\.(0+)([1-9]\d*)/);
      
      if (match && match[1].length >= 4) {
        // Use subscript notation: $0.0₍₅₎57874
        const leadingZeros = match[1].length;
        const subscriptZeros = leadingZeros.toString().split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
        const significantDigits = match[2].substring(0, 5);
        return `$0.0₍${subscriptZeros}₎${significantDigits}`;
      }
      
      // For smaller numbers of leading zeros, show more decimals
      if (value < 0.01) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 6, maximumFractionDigits: 8 }).format(value);
      }
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(value);
    }
    
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const handleConverterChange = (type, value) => {
    const numValue = parseFloat(value) || 0;
    const price = marketData.currentPrice || 0;
    if (type === 'btc') {
      setConverter({ btc: numValue, usdt: numValue * price });
    } else {
      setConverter({ btc: price > 0 ? numValue / price : 0, usdt: numValue });
    }
  };

  const supplySymbol = symbol.replace(/(USDT|USD|BUSD|USDC)$/i, '');

  // Retry function with exponential backoff
  const handleRetry = () => {
    setError(null);
    // Exponential backoff: increase delay for subsequent retries
    const newDelay = Math.min(retryDelay * 2, 30000); // Max 30 seconds
    setRetryDelay(newDelay);
    
    setTimeout(() => {
      setRetryCount(prev => prev + 1); // This triggers the useEffect to run again
    }, newDelay);
  };

  // Ensure all JSX is inside the return statement
  return (
    <div className='market-summary_main_content'>
      {/* Loading State */}
      {isLoading && !marketData.marketCap && (
        <div style={{ padding: '1rem' }}>
          {/* Market Stats Skeleton */}
          <div className="market-summary_main_table" style={{ marginBottom: '2rem' }}>
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="market-summary_main_item">
                <div className="market-summary_main_left">
                  <div className="skeleton skeleton-text" style={{ width: '120px', height: '16px' }} />
                </div>
                <div className="market-summary_main_right">
                  <div className="skeleton skeleton-text" style={{ width: '160px', height: '18px' }} />
                </div>
              </div>
            ))}
          </div>
          
          {/* Price Change Skeleton */}
          <div className="skeleton skeleton-text" style={{ width: '180px', height: '20px', marginBottom: '1rem' }} />
          
          <style>{`
            .skeleton {
              background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
              background-size: 200% 100%;
              animation: shimmer 1.5s ease-in-out infinite;
              border-radius: 4px;
            }
            .skeleton-text { display: inline-block; }
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      )}
      
      {/* Error State */}
      {error && !isLoading && (
        <div className="market-summary_error" style={{ 
          padding: '16px', 
          background: error.includes('cached') ? 'rgba(255, 193, 7, 0.1)' : 'rgba(239, 83, 80, 0.1)', 
          border: error.includes('cached') ? '1px solid rgba(255, 193, 7, 0.3)' : '1px solid rgba(239, 83, 80, 0.3)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ color: error.includes('cached') ? '#ff9800' : '#ef5350', fontWeight: 500, marginBottom: '8px' }}>
            {error.includes('cached') ? '⚡ Using Cached Data' : '⚠️ Failed to load market data'}
          </div>
          <div style={{ color: error.includes('cached') ? '#ff9800' : '#ef5350', fontSize: '13px', marginBottom: '12px' }}>
            {error}
          </div>
          {!error.includes('cached') && (
            <>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>
                Debug: symbol={symbol}, coinId={coinId}, stage={debugInfo.stage}
                {retryCount > 0 && ` | Retry #${retryCount}`}
              </div>
              <button 
                onClick={handleRetry}
                style={{
                  padding: '8px 16px',
                  background: '#ef5350',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Retry {retryCount > 0 ? `(wait ${Math.round(retryDelay/1000)}s)` : ''}
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Price Changes */}
      <MarketChange priceChanges={priceChanges} />

      {/* Market Stats */}
      <div className="market-summary_main_table">
        {marketData.marketCap !== null && marketData.marketCap !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>Market Cap</div>
              <div id="marketInfo" className="market-summary_main_info_wrapper">
                <div>i</div>
              </div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatCurrency(marketData.marketCap)}</div>
            </div>
          </div>
        )}
        {marketData.fullyDilutedValuation !== null && marketData.fullyDilutedValuation !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>Fully Diluted Valuation</div>
              <div id="marketInfo" className="market-summary_main_info_wrapper">
                <div>i</div>
              </div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatCurrency(marketData.fullyDilutedValuation)}</div>
            </div>
          </div>
        )}
        {marketData.volume24h !== null && marketData.volume24h !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>24 Hour Trading Vol</div>
              <div id="marketInfo" className="market-summary_main_info_wrapper">
                <div>i</div>
              </div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatCurrency(marketData.volume24h)}</div>
            </div>
          </div>
        )}
        {marketData.circulatingSupply !== null && marketData.circulatingSupply !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>Circulating Supply</div>
              <div id="marketInfo" className="market-summary_main_info_wrapper">
                <div>i</div>
              </div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatNumber(marketData.circulatingSupply)} {supplySymbol}</div>
            </div>
          </div>
        )}
        {marketData.totalSupply !== null && marketData.totalSupply !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>Total Supply</div>
              <div id="marketInfo" className="market-summary_main_info_wrapper">
                <div>i</div>
              </div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatNumber(marketData.totalSupply)} {supplySymbol}</div>
            </div>
          </div>
        )}
        {marketData.maxSupply !== null && marketData.maxSupply !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>Max Supply</div>
              <div id="marketInfo" className="market-summary_main_info_wrapper">
                <div>i</div>
              </div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatNumber(marketData.maxSupply)} {supplySymbol}</div>
            </div>
          </div>
        )}
        {marketData.treasury !== null && marketData.treasury !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>Total Treasury Holding</div>
              <div id="marketInfo" className="market-summary_main_info_wrapper">
                <div>i</div>
              </div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatNumber(marketData.treasury)} {supplySymbol}</div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="text-size-medium text-weight-medium">Info</div>
      <div className="market-summary_main_table">
        <div className="market-summary_main_item">
          <div className="market-summary_main_left">
            <div>Website</div>
          </div>
          <div className="market-summary_main_right">
            {marketData.links?.whitepaper && (
              <a href={marketData.links.whitepaper} target="_blank" rel="noopener noreferrer" className="market-summary_main_link">
                Whitepaper
              </a>
            )}
            {Array.isArray(marketData.links?.homepage) && marketData.links.homepage[0] && (
              <a href={marketData.links.homepage[0]} target="_blank" rel="noopener noreferrer" className="market-summary_main_link">
                {marketData.links.homepage[0].replace(/^https?:\/\//i, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
        </div>
        <div className="market-summary_main_item">
          <div className="market-summary_main_left">
            <div>Community</div>
          </div>
          <div className="market-summary_main_right">
            {marketData.links?.twitter && (
              <a href={`https://twitter.com/${marketData.links.twitter}`} target="_blank" rel="noopener noreferrer" className="market-summary_main_link">
                Twitter
              </a>
            )}
            {marketData.links?.facebook && (
              <a href={`https://facebook.com/${marketData.links.facebook}`} target="_blank" rel="noopener noreferrer" className="market-summary_main_link">
                Facebook
              </a>
            )}

            {marketData.links.reddit && (
              <a href={marketData.links.reddit} target="_blank" rel="noopener noreferrer" className="market-summary_main_link">
                Reddit
              </a>
            )}
            {marketData.links.telegram && (
              <a href={`https://t.me/${marketData.links.telegram}`} target="_blank" rel="noopener noreferrer" className="market-summary_main_link">
                Telegram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Converter */}
      <div className="text-size-medium text-weight-medium">{name || supplySymbol} Converter</div>
      <div className="market-summary_main_converter">
        <div className="market-summary_main_converter_form w-form">
          <form className="market-summary_main_converter_wrapper" onSubmit={(e) => e.preventDefault()}>
            <input 
              className="market-summary_main_converter_input is-first w-input"
              name="Crypto"
              placeholder={supplySymbol}
              type="text"
              value={converter.btc}
              onChange={(e) => handleConverterChange('btc', e.target.value)}
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter, decimal point
                if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return;
                }
                // Ensure that it is a number or decimal and stop if not
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault();
                }
              }}
            />
            <input 
              className="market-summary_main_converter_input is-last w-input"
              name="Currency"
              placeholder="USDT"
              type="text"
              value={converter.usdt > 0 ? converter.usdt.toFixed(2) : '0.00'}
              onChange={(e) => handleConverterChange('usdt', e.target.value)}
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter, decimal point
                if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    (e.keyCode === 86 && e.ctrlKey === true) ||
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return;
                }
                // Ensure that it is a number or decimal and stop if not
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault();
                }
              }}
            />
          </form>
        </div>
      </div>

      {/* Historical Price */}
      <div className="text-size-medium text-weight-medium">{name || supplySymbol} Historical Price</div>
      <div className="market-summary_main_table">
        {marketData.low24h !== null && marketData.low24h !== undefined && marketData.high24h !== null && marketData.high24h !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>24h Range</div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatPrice(marketData.low24h)} – {formatPrice(marketData.high24h)}</div>
            </div>
          </div>
        )}
        {marketData.low7d !== null && marketData.low7d !== undefined && marketData.high7d !== null && marketData.high7d !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>7d Range</div>
            </div>
            <div className="market-summary_main_right">
              <div>{formatPrice(marketData.low7d)} – {formatPrice(marketData.high7d)}</div>
            </div>
          </div>
        )}
        {/* All-Time High */}
        {marketData.ath !== null && marketData.ath !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>All-Time High</div>
            </div>
            <div className="market-summary_main_right">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{formatPrice(marketData.ath)}</span>
                {marketData.athChangePercentage !== null && marketData.athChangePercentage !== undefined && !isNaN(marketData.athChangePercentage) && (
                  <span style={{ color: '#ef5350', fontWeight: 500 }}>&#x25BC; {Math.abs(marketData.athChangePercentage).toFixed(2)}%</span>
                )}
              </div>
              <div style={{ color: '#888', fontSize: '0.95em', marginTop: '0.25rem' }}>
                {marketData.athDate ? new Date(marketData.athDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : ''}
                {marketData.athDate ? ` (${getTimeAgo(marketData.athDate)})` : ''}
              </div>
            </div>
          </div>
        )}
        {/* All-Time Low */}
        {marketData.atl !== null && marketData.atl !== undefined && (
          <div className="market-summary_main_item">
            <div className="market-summary_main_left">
              <div>All-Time Low</div>
            </div>
            <div className="market-summary_main_right">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 500 }}>{formatPrice(marketData.atl)}</span>
                {marketData.atlChangePercentage !== null && marketData.atlChangePercentage !== undefined && !isNaN(marketData.atlChangePercentage) && (
                  <span style={{ color: '#26a69a', fontWeight: 500 }}>&#x25B2; {Math.abs(marketData.atlChangePercentage).toFixed(2)}%</span>
                )}
              </div>
              <div style={{ color: '#888', fontSize: '0.95em', marginTop: '0.25rem' }}>
                {marketData.atlDate ? new Date(marketData.atlDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : ''}
                {marketData.atlDate ? ` (${getTimeAgo(marketData.atlDate)})` : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MarketSummary);

// Helper function for time ago
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  if (years > 0) return `over ${years} year${years > 1 ? 's' : ''}`;
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  return 'recently';
}
