import React, { useEffect, useRef, useState, memo } from 'react'
import { initBinanceCandleChart } from './CandleChart'
import { isBinanceSymbolSupported } from '../../../utils/binanceSymbols';
import { formatPrice, getChangeClass } from '../../../utils/formatters';

function getCryptoLogoUrl(symbol) {
  const sym = String(symbol || '').toLowerCase()
  // Use Logo.dev directly with public key (or fallback to UI Avatars)
  return `https://img.logo.dev/ticker/${sym}?token=pk_NPEGddObTf6Youc6KFKT6w&fallback=https://ui-avatars.com/api/?name=${sym.toUpperCase()}&background=1e65fa&color=fff`
}

/**
 * BinanceCandleChartCard - Unified component for displaying Binance candlestick charts
 * - Displays crypto card with header (name, symbol, icon, price, change percentage)
 * - Initializes real-time candlestick chart via Binance WebSocket + REST API
 * - Auto-resizes chart with container using ResizeObserver
 * - Handles historical data loading and live price updates
 *
 * Props:
 * - name: string - Cryptocurrency name (e.g., 'Bitcoin')
 * - symbol: string - Ticker symbol (e.g., 'BTC')
 * - price: number - Initial price (gets updated by WebSocket)
 * - change: number - Price change percentage
 * - chartSymbol: string - Binance trading pair (e.g., 'BTCUSDT')
 * - interval: string - Candle interval ('1m', '5m', '1h', etc.)
 * - height: number - Chart height in pixels
 */
function BinanceCandleChartCard({
  name = 'Bitcoin',
  symbol = 'BTC',
  price = 86716,
  change,
  // chart props
  chartSymbol,
  interval = '1m',
  height = 400,
  data = [],
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notOnBinance, setNotOnBinance] = useState(false);
  const displayPrice = typeof price === 'number' ? formatPrice(price) : (price || '$86,716')
  const changeNumber = typeof change === 'string' ? parseFloat(change) : change
  const changeClass = getChangeClass(changeNumber)
  const changeText = change == null ? null : (typeof change === 'number' ? `${change > 0 ? '+' : ''}${change}%` : String(change))
  const logoUrl = getCryptoLogoUrl(symbol)

  const SkeletonLoader = () => (
    <div className="card_app_wrapper">
      <div className="card_app_header">
        <div className="card_main_text_wrapper is-centered">
          <div className="skeleton skeleton-circle" style={{ width: '48px', height: '48px' }} />
          <div className="skeleton skeleton-text" style={{ width: '100px', height: '20px' }} />
          <div className="skeleton skeleton-text" style={{ width: '50px', height: '18px' }} />
        </div>
        <div className="card_main_text_wrapper is-centered">
          <div className="skeleton skeleton-text" style={{ width: '120px', height: '24px' }} />
        </div>
      </div>
      <div className="card_app_wrapper_candle_chart">
        <div className="skeleton skeleton-chart" style={{ width: '100%', height: height + 'px' }} />
      </div>
      <style>{`
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 4px;
        }
        .skeleton-circle { border-radius: 50%; }
        .skeleton-text { display: inline-block; }
        .skeleton-chart { border-radius: 8px; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );

  const containerRef = useRef(null)
  const priceRef = useRef(null)
  const instanceRef = useRef(null)

  // Force a re-render if containerRef is null on first mount
  const [containerReady, setContainerReady] = useState(false);
  useEffect(() => {
    setNotOnBinance(false);
    setError(null);
    
    // Cleanup any existing instance first
    if (instanceRef.current) {
      try { instanceRef.current.destroy(); } catch (e) { /* cleanup error */ }
      instanceRef.current = null;
    }
    
    // Clear the container to prevent duplicate charts
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    if (!containerRef.current) {
      setTimeout(() => setContainerReady(r => !r), 0);
      return;
    }
    
    let cancelled = false;
    
    // Check if symbol is supported on Binance before initializing chart
    isBinanceSymbolSupported(chartSymbol || `${symbol}USDT`).then((supported) => {
      if (cancelled) return;
      
      if (!supported) {
        setNotOnBinance(true);
        return;
      }
      try {
        const cfg = {
          symbol: chartSymbol || `${symbol}USDT`,
          interval,
          height,
          data,
        };
        const instance = initBinanceCandleChart(containerRef.current, priceRef.current, cfg);
        instanceRef.current = instance;
      } catch (err) {
        setError('Failed to load chart data. Please try again.');
      }
    });
    
    // Cleanup function
    return () => {
      cancelled = true;
      if (instanceRef.current) {
        try { instanceRef.current.destroy(); } catch (e) { /* cleanup error */ }
        instanceRef.current = null;
      }
    };
  }, [chartSymbol, symbol, interval, height, containerReady]);
  
  return (
    <div className="card_app_wrapper">
      <div className="card_app_header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="card_main_text_wrapper is-centered" style={{ flexWrap: 'wrap', gap: '0.5rem', minWidth: 0 }}>
          <img
            src={logoUrl}
            loading="lazy"
            alt={`${name} logo`}
            className="card_main_crypto_icon"
            style={{ flexShrink: 0 }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${symbol}&background=1e65fa&color=fff&size=48`;
            }}
          />
          <div className="text-size-large text-weight-medium" style={{ wordBreak: 'break-word' }}>{name}</div>
          <div className="text-size-large text-color-secondary">{symbol}</div>
        </div>
        <div className="card_main_text_wrapper is-centered" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div ref={priceRef} className="card_app_price" style={{ color: 'black' }}>{displayPrice}</div>
          {changeText ? (
            <div className={`text-size-regular ${changeClass}`}>{changeText}</div>
          ) : null}
        </div>
      </div>
      {notOnBinance ? (
        <div style={{ color: 'orange', textAlign: 'center', padding: 16 }}>
          This coin is not available on Binance. Candle chart is unavailable.
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height }} />
      )}
    </div>
  );
}

export default memo(BinanceCandleChartCard);
