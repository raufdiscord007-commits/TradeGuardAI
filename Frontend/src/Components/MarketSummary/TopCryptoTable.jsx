import React, { useEffect, useState, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import coinOverrides from './coinOverrides';
import { formatCurrency, formatPercent, getChangeColor } from '../../utils/formatters';

const PAGE_SIZE = 10;
const TOTAL_COINS = 50;

const renderChange = (v) => {
  if (v === null || v === undefined || Number.isNaN(v)) return <div className="text-size-regular">—</div>;
  const num = Number(v);
  const isUp = num >= 0;
  const color = getChangeColor(num);
  return (
    <div className="text-size-regular" style={{ color, display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {isUp ? (
          <svg width="12" height="12" viewBox="0 0 40 35" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36.1013 26H3.46944C1.74124 26 0.826577 23.956 1.97812 22.6673L18.4906 4.18913C19.2921 3.29213 20.6983 3.30054 21.4891 4.20701L37.6084 22.6853C38.7371 23.9791 37.8182 26 36.1013 26Z" fill={color}></path></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 40 35" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.89868 9H36.5306C38.2588 9 39.1734 11.044 38.0219 12.3327L21.5094 30.8109C20.7079 31.7079 19.3017 31.6995 18.5109 30.793L2.3916 12.3147C1.26289 11.0209 2.1818 9 3.89868 9Z" fill={color}></path></svg>
        )}
      </span>
      <span>{formatPercent(num)}</span>
    </div>
  );
};

const TopCryptoTable = ({ onCryptoSelect, initialPage = 1 }) => {
  const navigate = useNavigate();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(TOTAL_COINS);
  const [retryCount, setRetryCount] = useState(0);
  
  // Update URL when page changes
  useEffect(() => {
    if (page !== initialPage) {
      navigate(`/cryptocurrency?page=${page}`, { replace: true });
    }
  }, [page, navigate, initialPage]);

  useEffect(() => {
    let mounted = true;
    const fetchCoins = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check localStorage cache first (2 minute cache)
        const allCoinsCacheKey = 'top_crypto_all_coins';
        const cachedData = localStorage.getItem(allCoinsCacheKey);
        let processedCoins = [];
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const age = Date.now() - parsed.timestamp;
            if (age < 120000) { // 2 minutes
              processedCoins = parsed.coins;
              if (mounted) {
                const startIdx = (page - 1) * PAGE_SIZE;
                const endIdx = startIdx + PAGE_SIZE;
                const pagedCoins = processedCoins.slice(startIdx, endIdx);
                setCoins(pagedCoins);
                setTotal(processedCoins.length);
                setLoading(false);
              }
              return;
            }
          } catch (e) {
            localStorage.removeItem(allCoinsCacheKey);
          }
        }
        
        // Always fetch the top 50 coins (page 1) to match CoinGecko exactly
        const getApiBaseUrl = () => {
          const viteUrl = import.meta.env.VITE_API_URL;
          return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
        };
        const res = await fetch(`${getApiBaseUrl()}/api/crypto/list?page=1&limit=${TOTAL_COINS}`);
        
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error('Rate limit reached. Please wait a moment.');
          }
          throw new Error(`API Error: ${res.status}`);
        }
        const data = await res.json();
        processedCoins = (data.cryptos || []).map(cg => ({
          id: cg.id,
          symbol: cg.symbol?.toUpperCase() || '',
          name: cg.name || cg.symbol?.toUpperCase() || '',
          image: cg.image || null,
          lastPrice: typeof cg.currentPrice === 'number' ? cg.currentPrice : null,
          priceChangePercent: typeof cg.priceChangePercent24h === 'number' ? cg.priceChangePercent24h : null,
          priceChange1h: typeof cg.priceChangePercent1h === 'number' ? cg.priceChangePercent1h : null,
          priceChange24h: typeof cg.priceChangePercent24h === 'number' ? cg.priceChangePercent24h : null,
          priceChange7d: typeof cg.priceChangePercent7d === 'number' ? cg.priceChangePercent7d : null,
          marketCap: typeof cg.marketCap === 'number' ? cg.marketCap : null,
          quoteVolume: typeof cg.volume24h === 'number' ? cg.volume24h : null,
          raw: cg,
        }));
        
        if (!mounted) return;
        
        // Cache all coins for future use
        try {
          localStorage.setItem(allCoinsCacheKey, JSON.stringify({
            coins: processedCoins,
            timestamp: Date.now(),
            total: processedCoins.length
          }));
        } catch (e) {
          // Cache write failed - non-critical
        }
        
        // Paginate the coins for display
        const startIdx = (page - 1) * PAGE_SIZE;
        const endIdx = startIdx + PAGE_SIZE;
        const pagedCoins = processedCoins.slice(startIdx, endIdx);
        
        setCoins(pagedCoins);
        setTotal(processedCoins.length);
      } catch (err) {
        if (!mounted) return;
        
        // Try to use any cached data (even stale) on error
        const allCoinsCache = localStorage.getItem('top_crypto_all_coins');
        if (allCoinsCache) {
          try {
            const parsed = JSON.parse(allCoinsCache);
            const startIdx = (page - 1) * PAGE_SIZE;
            const endIdx = startIdx + PAGE_SIZE;
            const pagedCoins = parsed.coins.slice(startIdx, endIdx);
            
            if (pagedCoins.length > 0) {
              setCoins(pagedCoins);
              setTotal(parsed.total || parsed.coins.length);
              setError('Using cached data (network error: ' + err.message + ')');
              setLoading(false);
              return;
            }
          } catch (e) {
            // Cached data unusable - continue to error state
          }
        }
        
        setError('Failed to load data: ' + err.message);
        setCoins([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchCoins();
    // Refresh every 2 minutes instead of 30 seconds to avoid rate limits
    const interval = setInterval(fetchCoins, 120000);
    return () => { mounted = false; clearInterval(interval); };
  }, [page, retryCount]);
  
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  
  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="card_app_wrapper">
      <div className="card_app_header">
        <div className="card_main_text_wrapper is-centered">
          <div className="text-size-large">Top Cryptocurrencies</div>
        </div>
      </div>
      <div className="card_app_crypto_wrapper">
        <div className="card_app_top_wrapper">
          <div className="card_app_top_row is-main">
            <div className="card_app_top_text_wrapper is-header">
              <div className="text-size-small text-weight-semibold">#</div>
            </div>
            <div className="card_app_top_text_wrapper is-header">
              <div className="text-size-small text-weight-semibold">Name</div>
            </div>
            <div className="card_app_top_text_wrapper align-left is-header">
              <div className="text-size-small text-weight-semibold">Price</div>
            </div>
            <div className="card_app_top_text_wrapper align-left is-header">
              <div className="text-size-small text-weight-semibold">1h</div>
            </div>
            <div className="card_app_top_text_wrapper align-left is-header">
              <div className="text-size-small text-weight-semibold">24h</div>
            </div>
            <div className="card_app_top_text_wrapper align-left is-header">
              <div className="text-size-small text-weight-semibold">7d</div>
            </div>
            <div className="card_app_top_text_wrapper align-left is-header">
              <div className="text-size-small text-weight-semibold">Market Cap</div>
            </div>
          </div>
          {loading && coins.length === 0 ? (
            <>
              {[...Array(PAGE_SIZE)].map((_, idx) => (
                <div key={idx} className="card_app_top_row skeleton-row">
                  <div className="card_app_top_text_wrapper">
                    <div className="skeleton" style={{ width: '24px', height: '16px' }} />
                  </div>
                  <div className="card_app_top_text_wrapper">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div className="skeleton" style={{ width: '100px', height: '16px' }} />
                    </div>
                  </div>
                  <div className="card_app_top_text_wrapper align-left">
                    <div className="skeleton" style={{ width: '80px', height: '16px' }} />
                  </div>
                  <div className="card_app_top_text_wrapper align-left">
                    <div className="skeleton" style={{ width: '50px', height: '16px' }} />
                  </div>
                  <div className="card_app_top_text_wrapper align-left">
                    <div className="skeleton" style={{ width: '50px', height: '16px' }} />
                  </div>
                  <div className="card_app_top_text_wrapper align-left">
                    <div className="skeleton" style={{ width: '50px', height: '16px' }} />
                  </div>
                  <div className="card_app_top_text_wrapper align-left">
                    <div className="skeleton" style={{ width: '90px', height: '16px' }} />
                  </div>
                </div>
              ))}
              <style>{`
                .skeleton-row {
                  pointer-events: none;
                }
                
                .skeleton {
                  background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
                  background-size: 200% 100%;
                  animation: shimmer 1.5s ease-in-out infinite;
                  border-radius: 4px;
                  display: inline-block;
                }
                
                @keyframes shimmer {
                  0% {
                    background-position: 200% 0;
                  }
                  100% {
                    background-position: -200% 0;
                  }
                }
              `}</style>
            </>
          ) : error && coins.length === 0 ? (
            <div style={{ 
              padding: 24, 
              textAlign: 'center', 
              width: '100%',
              background: 'rgba(239, 83, 80, 0.1)',
              borderRadius: '8px',
              margin: '16px'
            }}>
              <div style={{ color: '#ef5350', marginBottom: '12px', fontWeight: 500 }}>⚠️ {error}</div>
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
                Retry
              </button>
            </div>
          ) : error && coins.length > 0 ? (
            <>
              <div style={{ 
                padding: '12px 16px', 
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '4px',
                margin: '0 16px 8px',
                color: '#ff9800',
                fontSize: '13px'
              }}>
                ⚡ {error}
              </div>
              {coins.map((coin, idx) => (
              <div
                className="card_app_top_row is-main"
                key={`${coin.id}-${coin.symbol}-${idx}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onCryptoSelect && onCryptoSelect(coin, page)}
              >
                <div className="card_app_top_text_wrapper">
                  <div className="text-size-regular">{String((page - 1) * PAGE_SIZE + idx + 1).padStart(2, '0')}</div>
                </div>
                <div className="card_app_top_text_wrapper">
                  {coin.image && (
                    <img
                      src={coin.image}
                      alt={coin.name}
                      loading="lazy"
                      className="card_app_top_icon"
                      style={{ width: 32, height: 32, marginRight: 8, objectFit: 'contain', borderRadius: '50%' }}
                    />
                  )}
                  <div className="text-size-regular">{coin.name}</div>
                </div>
                <div className="card_app_top_text_wrapper align-left">
                  <div className="text-size-regular">{formatCurrency(coin.lastPrice)}</div>
                </div>
                {/* 1h change (not available) */}
                <div className="card_app_top_text_wrapper align-left">
                  {coin.priceChange1h !== null && coin.priceChange1h !== undefined ? renderChange(coin.priceChange1h) : <span className="text-size-regular">—</span>}
                </div>
                {/* 24h change */}
                <div className="card_app_top_text_wrapper align-left">
                  {coin.priceChange24h !== null && coin.priceChange24h !== undefined ? renderChange(coin.priceChange24h) : <span className="text-size-regular">—</span>}
                </div>
                {/* 7d change (not available) */}
                <div className="card_app_top_text_wrapper align-left">
                  {coin.priceChange7d !== null && coin.priceChange7d !== undefined ? renderChange(coin.priceChange7d) : <span className="text-size-regular">—</span>}
                </div>
                <div className="card_app_top_text_wrapper align-left">
                  <div className="text-size-regular">{coin.marketCap !== null && coin.marketCap !== undefined ? formatCurrency(coin.marketCap) : '—'}</div>
                </div>
              </div>
            ))}
            </>
          ) : (
            coins.map((coin, idx) => (
              <div
                className="card_app_top_row is-main"
                key={`${coin.id}-${coin.symbol}-${idx}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onCryptoSelect && onCryptoSelect(coin, page)}
              >
                <div className="card_app_top_text_wrapper">
                  <div className="text-size-regular">{String((page - 1) * PAGE_SIZE + idx + 1).padStart(2, '0')}</div>
                </div>
                <div className="card_app_top_text_wrapper">
                  {coin.image && (
                    <img
                      src={coin.image}
                      alt={coin.name}
                      loading="lazy"
                      className="card_app_top_icon"
                      style={{ width: 32, height: 32, marginRight: 8, objectFit: 'contain', borderRadius: '50%' }}
                    />
                  )}
                  <div className="text-size-regular">{coin.name}</div>
                </div>
                <div className="card_app_top_text_wrapper align-left">
                  <div className="text-size-regular">{formatCurrency(coin.lastPrice)}</div>
                </div>
                {/* 1h change (not available) */}
                <div className="card_app_top_text_wrapper align-left">
                  {coin.priceChange1h !== null && coin.priceChange1h !== undefined ? renderChange(coin.priceChange1h) : <span className="text-size-regular">—</span>}
                </div>
                {/* 24h change */}
                <div className="card_app_top_text_wrapper align-left">
                  {coin.priceChange24h !== null && coin.priceChange24h !== undefined ? renderChange(coin.priceChange24h) : <span className="text-size-regular">—</span>}
                </div>
                {/* 7d change (not available) */}
                <div className="card_app_top_text_wrapper align-left">
                  {coin.priceChange7d !== null && coin.priceChange7d !== undefined ? renderChange(coin.priceChange7d) : <span className="text-size-regular">—</span>}
                </div>
                <div className="card_app_top_text_wrapper align-left">
                  <div className="text-size-regular">{coin.marketCap !== null && coin.marketCap !== undefined ? formatCurrency(coin.marketCap) : '—'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="card_app_footer">
        <div className="card_app_pagination_wrapper">
            <div className="card_app_pagination_text">
              <div className="text-size-small text-color-secondary">Showing</div>
              <div className="text-size-small text-color-secondary">{total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</div>
              <div className="text-size-small text-color-secondary">to</div>
              <div className="text-size-small text-color-secondary">{Math.min(page * PAGE_SIZE, total)}</div>
              <div className="text-size-small text-color-secondary">of</div>
              <div className="text-size-small text-color-secondary">{total}</div>
            </div>
          <div className="card_app_pagination">
            <button
              className="card_app_pagination_link w-inline-block"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'none', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              <svg width="7" height="12" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.40482 10.75L0.994071 6.33926C0.668635 6.01382 0.668635 5.48618 0.994071 5.16074L5.40482 0.75" stroke="currentcolor" strokeWidth="1.5" strokeLinecap="round"></path></svg>
            </button>
            <div className="card_app_pagination_link_flex">
              {(() => {
                const pages = [];
                
                if (totalPages <= 5) {
                  // Show all pages if 5 or fewer
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else if (page <= 3) {
                  // Near start: show 1, 2, 3, ..., last
                  pages.push(1, 2, 3, '...', totalPages);
                } else if (page >= totalPages - 2) {
                  // Near end: show 1, ..., last-2, last-1, last
                  pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                } else {
                  // Middle: show 1, ..., current, ..., last
                  pages.push(1, '...', page, '...', totalPages);
                }
                
                return pages.map((pageNum, i) => {
                  if (pageNum === '...') {
                    return <span key={`dots-${i}`} className="card_app_pagination_link w-inline-block" style={{ cursor: 'default' }}>...</span>;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`card_app_pagination_link w-inline-block${pageNum === page ? ' is-active' : ''}`}
                      onClick={() => setPage(pageNum)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <div>{pageNum}</div>
                    </button>
                  );
                });
              })()}
            </div>
            <button
              className="card_app_pagination_link w-inline-block"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: 'none', border: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <svg width="7" height="12" viewBox="0 0 7 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.75 0.75L5.16074 5.16074C5.48618 5.48618 5.48618 6.01382 5.16074 6.33926L0.75 10.75" stroke="currentcolor" strokeWidth="1.5" strokeLinecap="round"></path></svg>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .card_app_top_row.is-main:hover {
          background-color: #ecf4fc;
          transition: background-color 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default memo(TopCryptoTable);
