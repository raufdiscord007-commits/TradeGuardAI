import React, { useState, useEffect, useRef, memo } from 'react';
import { isBinanceSymbolSupported } from '../../../utils/binanceSymbols';
import { formatPrice as sharedFormatPrice } from '../../../utils/formatters';

const MarketTradesCard = ({ symbol = 'ETHUSDT', baseAsset = 'ETH', maxTrades = 13 }) => {
  const [trades, setTrades] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [notOnBinance, setNotOnBinance] = useState(false);
  const wsRef = useRef(null);
  const pendingTradesRef = useRef([]);
  const lastUpdateTimeRef = useRef(0);
  const UPDATE_THROTTLE = 250; // Update UI at most every 250ms

  useEffect(() => {
    setNotOnBinance(false);
    setTrades([]);
    setIsConnected(false);
    // Check if symbol is supported on Binance before proceeding
    isBinanceSymbolSupported(symbol).then((supported) => {
      if (!supported) {
        setNotOnBinance(true);
        return;
      }
      // Fetch initial trades from backend proxy
      const fetchInitialTrades = async (retryCount = 0) => {
        try {
          const getApiBaseUrl = () => {
            const viteUrl = import.meta.env.VITE_API_URL;
            return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
          };
          const response = await fetch(`${getApiBaseUrl()}/api/crypto/trades?symbol=${symbol}&limit=${maxTrades}`);
          
          if (!response.ok) {
            // Handle rate limiting with retry
            if (response.status === 429 && retryCount < 3) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
              await new Promise(resolve => setTimeout(resolve, delay));
              return fetchInitialTrades(retryCount + 1);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          const formattedTrades = (data.trades || []).map(trade => ({
            price: parseFloat(trade.price),
            amount: parseFloat(trade.qty),
            time: new Date(trade.time),
            isBuyerMaker: trade.isBuyerMaker
          }));
          setTrades(formattedTrades);
        } catch (error) {
          // Don't fail completely - WebSocket will provide data once connected
        }
      };
      fetchInitialTrades();
    });
  }, [symbol, maxTrades]);

  useEffect(() => {
    setIsConnected(false);
    // Only connect WebSocket if supported on Binance
    isBinanceSymbolSupported(symbol).then((supported) => {
      if (!supported) return;
      // Connect to Binance WebSocket for real-time trades
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`;
      // Clear pending trades from previous symbol
      pendingTradesRef.current = [];
      lastUpdateTimeRef.current = 0;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      let isSubscribed = true;
      ws.onopen = () => {
        setIsConnected(true);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Create new trade object
          const newTrade = {
            price: parseFloat(data.p),
            amount: parseFloat(data.q),
            time: new Date(data.T),
            isBuyerMaker: data.m // true = sell (maker is buyer), false = buy (maker is seller)
          };
          // Add to pending trades buffer instead of immediate state update
          // Limit buffer size to prevent memory leak (max 2x maxTrades)
          pendingTradesRef.current = [newTrade, ...pendingTradesRef.current].slice(0, maxTrades * 2);
        } catch (error) {
          // Trade processing error - silently ignore
        }
      };
      // Throttled update loop - applies trades at controlled intervals
      const updateInterval = setInterval(() => {
        if (pendingTradesRef.current.length === 0 || !isSubscribed) return;
        const now = Date.now();
        if (now - lastUpdateTimeRef.current < UPDATE_THROTTLE) return;
        lastUpdateTimeRef.current = now;
        setTrades(prevTrades => {
          // Merge pending trades with existing trades
          const merged = [...pendingTradesRef.current, ...prevTrades];
          pendingTradesRef.current = []; // Clear pending buffer
          return merged.slice(0, maxTrades);
        });
      }, 100); // Check every 100ms but only apply if throttle time has passed
      ws.onerror = (error) => {
        setIsConnected(false);
      };
      ws.onclose = () => {
        setIsConnected(false);
      };
      return () => {
        isSubscribed = false;
        clearInterval(updateInterval);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    });
  }, [symbol, maxTrades]);

  const formatPrice = (price) => {
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
      maximumFractionDigits: 2
    });
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="card_app_wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="card_app_header is-compact">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="text-size-medium text-weight-medium">Market Trades</div>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isConnected ? 'var(--color-green)' : 'var(--text-color--text-tertiary)',
            transition: 'background-color 0.3s'
          }} />
        </div>
      </div>

      {/* Not on Binance message */}
      {notOnBinance && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'orange',
          fontSize: '0.875rem'
        }}>
          This coin is not available on Binance. Market trades are unavailable.
        </div>
      )}

      {/* Content */}
      {!notOnBinance && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Trades Table */}
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--background-header)', borderBottom: '1px solid var(--border-color--border-primary)' }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '33%' }}>Price (USDT)</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '33%' }}>Amount ({baseAsset})</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '34%' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, index) => (
                  <tr 
                    key={`${trade.time.getTime()}-${index}`}
                    style={{ height: '26px' }}
                  >
                    <td style={{ 
                      padding: '0.25rem 0.75rem', 
                      textAlign: 'right',
                      fontSize: '0.875rem',
                      color: trade.isBuyerMaker ? 'var(--color-red)' : 'var(--color-green)',
                      fontWeight: 500,
                      transition: 'color 0.15s ease',
                      width: '33%'
                    }}>
                      {formatPrice(trade.price)}
                    </td>
                    <td style={{ 
                      padding: '0.25rem 0.75rem', 
                      textAlign: 'right',
                      fontSize: '0.875rem',
                      color: 'var(--text-color--text-primary)',
                      transition: 'color 0.15s ease',
                      width: '33%'
                    }}>
                      {formatAmount(trade.amount)}
                    </td>
                    <td style={{ 
                      padding: '0.25rem 0.75rem', 
                      textAlign: 'right',
                      fontSize: '0.875rem',
                      color: 'var(--text-color--text-secondary)',
                      transition: 'color 0.15s ease',
                      width: '34%'
                    }}>
                      {formatTime(trade.time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!notOnBinance && trades.length === 0 && (
        <div style={{ padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--background-header)', borderBottom: '1px solid var(--border-color--border-primary)' }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '33%' }}>Price (USDT)</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '33%' }}>Amount ({baseAsset})</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-color--text-secondary)', width: '34%' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(maxTrades)].map((_, idx) => (
                <tr key={idx} style={{ height: '26px' }}>
                  <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                    <div className="skeleton skeleton-text" style={{ width: '70px', height: '14px', marginLeft: 'auto' }} />
                  </td>
                  <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                    <div className="skeleton skeleton-text" style={{ width: '60px', height: '14px', marginLeft: 'auto' }} />
                  </td>
                  <td style={{ padding: '0.25rem 0.75rem', textAlign: 'right' }}>
                    <div className="skeleton skeleton-text" style={{ width: '50px', height: '14px', marginLeft: 'auto' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
};

export default memo(MarketTradesCard);
