import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react'
import { isBinanceSymbolSupported } from '../../../utils/binanceSymbols';

/**
 * OrderBookCard - Real-time order book card component
 * Displays 11 buy orders and 11 sell orders from Binance
 * 
 * Props:
 * - symbol: string - Trading pair symbol (e.g., 'BTCUSDT')
 * - baseAsset: string - Base asset symbol for header (e.g., 'BTC', 'ETH')
 * - maxOrders: number - Number of buy/sell orders to display (default 11)
 */
function OrderBookCard({
  symbol = 'BTCUSDT',
  baseAsset = 'BTC',
  maxOrders = 11,
}) {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] })
  const [loading, setLoading] = useState(true)
  const [currentPrice, setCurrentPrice] = useState(null)
  const [priceDirection, setPriceDirection] = useState('neutral')
  const wsRef = useRef(null)
  const [wsError, setWsError] = useState(false)
  const [notOnBinance, setNotOnBinance] = useState(false);
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5
  const lastUpdateIdRef = useRef(0)
  const pendingUpdateRef = useRef(null)
  const lastUpdateTimeRef = useRef(0)
  const UPDATE_THROTTLE = 250 // Update UI at most every 250ms
  const previousPriceRef = useRef(null)

  useEffect(() => {
    if (!symbol) return;
    let isSubscribed = true;
    setNotOnBinance(false);
    setLoading(true);
    setOrderBook({ bids: [], asks: [] });
    setCurrentPrice(null);
    setPriceDirection('neutral');
    setWsError(false);

    // Check if symbol is supported on Binance before proceeding
    isBinanceSymbolSupported(symbol).then((supported) => {
      if (!supported) {
        setNotOnBinance(true);
        setLoading(false);
        return;
      }

      // ...existing code for fetching order book and connecting WebSocket...
      // (Paste the original effect body here, minus the Binance check)
      // Clear any pending updates from previous symbol
      pendingUpdateRef.current = null;
      lastUpdateTimeRef.current = 0;

      const fetchInitialOrderBook = async (retryCount = 0) => {
        try {
          // Use backend proxy to avoid CORS
          const response = await fetch(
            (() => {
              const viteUrl = import.meta.env.VITE_API_URL;
              const baseUrl = viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
              return `${baseUrl}/api/crypto/orderbook?symbol=${symbol}`;
            })()
          );
          
          if (!response.ok) {
            // Handle rate limiting with retry
            if (response.status === 429 && retryCount < 3) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
              await new Promise(resolve => setTimeout(resolve, delay));
              return fetchInitialOrderBook(retryCount + 1);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!isSubscribed) return;
          
          // Validate data structure
          if (!data || !Array.isArray(data.bids) || !Array.isArray(data.asks)) {
            throw new Error('Invalid order book data received');
          }
          
          const sortedBids = data.bids
            .slice(0, maxOrders)
            .map(({ price, quantity }) => ({ price, quantity }));
          const sortedAsks = data.asks
            .slice(0, maxOrders)
            .map(({ price, quantity }) => ({ price, quantity }));
          setOrderBook({ bids: sortedBids, asks: sortedAsks });
          lastUpdateIdRef.current = data.lastUpdateId;
          // Set initial current price from highest bid
          if (sortedBids.length > 0) {
            const initialPrice = sortedBids[0].price;
            setCurrentPrice(initialPrice);
            previousPriceRef.current = initialPrice;
          }
          setLoading(false);
        } catch (error) {
          if (isSubscribed) {
            // If all retries failed, still proceed with WebSocket (it might work)
            setLoading(false);
            // Don't set wsError here - let WebSocket try to connect
          }
        }
      };

      fetchInitialOrderBook();

      // Use @depth20 stream for complete snapshots instead of @depth20@100ms partial updates
      const streamName = `${symbol.toLowerCase()}@depth20`;
      const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
      let ws;
      let reconnectTimeout;
      setWsError(false);
      reconnectAttemptsRef.current = 0;

      function connectWS() {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => {
          reconnectAttemptsRef.current = 0;
          setWsError(false);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!isSubscribed) return;
            // @depth20 stream sends complete snapshots, not partial updates
            if (data.bids && data.asks) {
              const newBids = data.bids
                .map(([price, quantity]) => ({
                  price: parseFloat(price),
                  quantity: parseFloat(quantity),
                }))
                .filter(order => order.quantity > 0)
                .slice(0, maxOrders);
              const newAsks = data.asks
                .map(([price, quantity]) => ({
                  price: parseFloat(price),
                  quantity: parseFloat(quantity),
                }))
                .filter(order => order.quantity > 0)
                .slice(0, maxOrders);
              // Store the latest snapshot
              if (newBids.length > 0 && newAsks.length > 0) {
                pendingUpdateRef.current = {
                  bids: newBids,
                  asks: newAsks
                };
              }
            }
          } catch (error) {
            // WebSocket message parsing error - silently ignore
          }
        };
        ws.onerror = (error) => {
          setWsError(true);
        };
        ws.onclose = (event) => {
          if (!isSubscribed) return;
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            const delay = 1000 * reconnectAttemptsRef.current;
            reconnectTimeout = setTimeout(connectWS, delay);
          } else {
            setWsError(true);
          }
        };
      }
      connectWS();

      // Throttled update loop - applies updates at controlled intervals
      const updateInterval = setInterval(() => {
        if (!pendingUpdateRef.current || !isSubscribed) return;
        const now = Date.now();
        if (now - lastUpdateTimeRef.current < UPDATE_THROTTLE) return;
        const pendingData = pendingUpdateRef.current;
        pendingUpdateRef.current = null;
        lastUpdateTimeRef.current = now;
        setOrderBook(prev => {
          const bidsChanged = JSON.stringify(prev.bids) !== JSON.stringify(pendingData.bids);
          const asksChanged = JSON.stringify(prev.asks) !== JSON.stringify(pendingData.asks);
          if (bidsChanged || asksChanged) {
            // Update current price (use highest bid as current price)
            if (pendingData.bids.length > 0) {
              const newPrice = pendingData.bids[0].price;
              if (previousPriceRef.current !== null) {
                if (newPrice > previousPriceRef.current) {
                  setPriceDirection('up');
                } else if (newPrice < previousPriceRef.current) {
                  setPriceDirection('down');
                }
              }
              previousPriceRef.current = newPrice;
              setCurrentPrice(newPrice);
            }
            return pendingData;
          }
          return prev;
        });
      }, 100); // Check every 100ms but only apply if throttle time has passed

      // Cleanup
      return () => {
        isSubscribed = false;
        clearInterval(updateInterval);
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
      };
    });
  }, [symbol, maxOrders]);

  const formatPrice = useCallback((price) => {
    const num = parseFloat(price);
    if (isNaN(num)) return '0.00';
    
    // For very small values, use subscript notation for leading zeros
    if (num > 0 && num < 1) {
      const str = num.toString();
      const match = str.match(/^0\.(0+)([1-9]\d*)/);
      
      if (match && match[1].length >= 4) {
        // Use subscript notation: 0.0₍₅₎57874
        const leadingZeros = match[1].length;
        const subscriptZeros = leadingZeros.toString().split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
        const significantDigits = match[2].substring(0, 5);
        return `0.0₍${subscriptZeros}₎${significantDigits}`;
      }
      
      // For smaller numbers of leading zeros, show more decimals
      if (num < 0.01) {
        return num.toFixed(8).replace(/\.?0+$/, '');
      }
      return num.toFixed(6).replace(/\.?0+$/, '');
    }
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [])

  const formatQuantity = useCallback((qty) => {
    if (qty >= 1) {
      return qty.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })
    }
    return qty.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 8,
    })
  }, [])

  const formatTotal = useCallback((total) => {
    if (total >= 1000000) {
      return (total / 1000000).toFixed(2) + 'M'
    } else if (total >= 1000) {
      return (total / 1000).toFixed(2) + 'K'
    }
    return total.toFixed(2)
  }, [])

  const maxQty = useMemo(() => {
    const allQtys = [...orderBook.bids, ...orderBook.asks].map(o => o.quantity)
    return allQtys.length > 0 ? Math.max(...allQtys) : 1
  }, [orderBook])

  return (
    <div className="card_app_wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="card_app_header is-compact">
        <div className="text-size-medium text-weight-medium">Order Book</div>
      </div>

      {/* Not on Binance message */}
      {notOnBinance && (
        <div className="orderbook-error" style={{ color: 'orange', textAlign: 'center', padding: '1rem' }}>
          This coin is not available on Binance. Order book data is unavailable.
        </div>
      )}

      {/* WebSocket error message */}
      {wsError && !notOnBinance && (
        <div className="orderbook-error" style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>
          Live order book unavailable (WebSocket error). Retrying...
        </div>
      )}

      {/* Content */}
      {!notOnBinance && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Asks (Sell Orders) - Display in reverse (highest price at bottom) */}
          <div style={{ borderBottom: '1px solid var(--border-color--border-primary)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--background-header)', borderBottom: '1px solid var(--border-color--border-primary)' }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '33%' }}>Price (USDT)</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '33%' }}>Amount</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '34%' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {loading || orderBook.asks.length === 0 ? (
                  [...Array(maxOrders)].map((_, idx) => (
                    <tr key={`ask-skeleton-${idx}`} style={{ height: '26px' }}>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                        <div className="skeleton skeleton-text" style={{ width: '70px', height: '14px', marginLeft: 'auto' }} />
                      </td>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                        <div className="skeleton skeleton-text" style={{ width: '60px', height: '14px', marginLeft: 'auto' }} />
                      </td>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                        <div className="skeleton skeleton-text" style={{ width: '65px', height: '14px', marginLeft: 'auto' }} />
                      </td>
                    </tr>
                  ))
                ) : (
                  orderBook.asks.slice().reverse().map((order, idx) => {
                  const total = order.price * order.quantity;
                  return (
                    <tr key={`ask-${order.price}-${idx}`} style={{ height: '26px' }}>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-red)', position: 'relative', width: '33%' }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                          backgroundColor: 'rgba(239, 83, 80, 0.08)',
                          width: `${(order.quantity / maxQty) * 100}%`,
                          zIndex: 0,
                        }} />
                        <span style={{ position: 'relative', zIndex: 1 }}>{formatPrice(order.price)}</span>
                      </td>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-color--text-primary)', width: '33%' }}>
                        {formatQuantity(order.quantity)}
                      </td>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-color--text-primary)', width: '34%' }}>
                        {formatTotal(total)}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>

          {/* Current Price Display */}
          <div style={{ 
            padding: '0.75rem 1rem', 
            backgroundColor: 'var(--background-grey)',
            borderBottom: '1px solid var(--border-color--border-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600,
              color: priceDirection === 'up' ? 'var(--color-green)' : priceDirection === 'down' ? 'var(--color-red)' : 'var(--text-color--text-primary)',
              transition: 'color 0.3s ease'
            }}>
              {currentPrice ? formatPrice(currentPrice) : '---'}
            </span>
            {priceDirection === 'down' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 12L8 4M8 12L5 9M8 12L11 9" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {priceDirection === 'up' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 4L8 12M8 4L11 7M8 4L5 7" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <span style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-color--text-secondary)',
              marginLeft: 'auto'
            }}>
              {currentPrice ? formatPrice(currentPrice) : '---'}
            </span>
          </div>

          {/* Bids (Buy Orders) - Display normal (highest price at top) */}
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <tbody>
                {loading || orderBook.bids.length === 0 ? (
                  [...Array(maxOrders)].map((_, idx) => (
                    <tr key={`bid-skeleton-${idx}`} style={{ height: '26px' }}>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                        <div className="skeleton skeleton-text" style={{ width: '70px', height: '14px', marginLeft: 'auto' }} />
                      </td>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                        <div className="skeleton skeleton-text" style={{ width: '60px', height: '14px', marginLeft: 'auto' }} />
                      </td>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                        <div className="skeleton skeleton-text" style={{ width: '65px', height: '14px', marginLeft: 'auto' }} />
                      </td>
                    </tr>
                  ))
                ) : (
                  orderBook.bids.map((order, idx) => {
                  const total = order.price * order.quantity;
                  return (
                    <tr key={`bid-${order.price}-${idx}`} style={{ height: '26px' }}>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-green)', position: 'relative', width: '33%' }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                          backgroundColor: 'rgba(38, 166, 154, 0.08)',
                          width: `${(order.quantity / maxQty) * 100}%`,
                          zIndex: 0,
                        }} />
                        <span style={{ position: 'relative', zIndex: 1 }}>{formatPrice(order.price)}</span>
                      </td>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-color--text-primary)', width: '33%' }}>
                        {formatQuantity(order.quantity)}
                      </td>
                      <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-color--text-primary)', width: '34%' }}>
                        {formatTotal(total)}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
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
  );
}

export default memo(OrderBookCard);
