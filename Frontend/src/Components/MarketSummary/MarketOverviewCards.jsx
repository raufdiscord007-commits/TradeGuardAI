import React, { useState, useEffect } from 'react';
import MiniChart from '../Chart/MiniChart';

const MarketOverviewCards = () => {
  const [data, setData] = useState({
    bitcoin: { price: null, change: null, sparkline: [] },
    ethereum: { price: null, change: null, sparkline: [] },
    solana: { price: null, change: null, sparkline: [] },
    marketCap: { value: null, change: null, sparkline: [] },
    fearGreed: { value: null, label: 'Neutral' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setError(null);
      
      // Fetch Bitcoin, Ethereum, and Solana data from backend
      const getApiBaseUrl = () => {
        const viteUrl = import.meta.env.VITE_API_URL;
        return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
      };
      const API_BASE = getApiBaseUrl();
      const cryptoPromises = [
        fetch(`${API_BASE}/api/crypto/bitcoin`).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch(`${API_BASE}/api/crypto/ethereum`).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch(`${API_BASE}/api/crypto/solana`).then(res => res.ok ? res.json() : null).catch(() => null)
      ];
      
      const [btcData, ethData, solData] = await Promise.all(cryptoPromises);
      
      // Calculate total market cap from the three coins
      const totalMarketCap = btcData?.marketCap && ethData?.marketCap && solData?.marketCap
        ? btcData.marketCap + ethData.marketCap + solData.marketCap
        : null;
      
      // Calculate market cap change (approximation using BTC as proxy)
      const marketCapChange = btcData?.priceChangePercent24h ?? null;
      
      // Fetch Fear & Greed Index (with fallback)
      let fgData = null;
      try {
        const fgRes = await fetch('https://api.alternative.me/fng/?limit=1');
        fgData = fgRes.ok ? await fgRes.json() : null;
      } catch (e) {
        console.warn('Failed to fetch Fear & Greed Index:', e);
      }
      
      // Get sparkline data from Binance (last 24h hourly) - using symbols
      const sparklinePromises = [
        fetch(`${API_BASE}/api/crypto/BTC/history?interval=1h&limit=24`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/api/crypto/ETH/history?interval=1h&limit=24`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/api/crypto/SOL/history?interval=1h&limit=24`).then(r => r.ok ? r.json() : null).catch(() => null)
      ];
      
      const [btcSparkline, ethSparkline, solSparkline] = await Promise.all(sparklinePromises);
      
      setData({
        bitcoin: {
          price: btcData?.currentPrice ?? null,
          change: btcData?.priceChangePercent24h ?? null,
          sparkline: btcSparkline?.klines?.map(k => k.close) || []
        },
        ethereum: {
          price: ethData?.currentPrice ?? null,
          change: ethData?.priceChangePercent24h ?? null,
          sparkline: ethSparkline?.klines?.map(k => k.close) || []
        },
        solana: {
          price: solData?.currentPrice ?? null,
          change: solData?.priceChangePercent24h ?? null,
          sparkline: solSparkline?.klines?.map(k => k.close) || []
        },
        marketCap: {
          value: totalMarketCap,
          change: marketCapChange,
          sparkline: btcSparkline?.klines?.map(k => k.close) || []
        },
        fearGreed: {
          value: fgData?.data?.[0]?.value ? parseInt(fgData.data[0].value) : null,
          label: fgData?.data?.[0]?.value_classification || 'Neutral'
        }
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching market overview data:', err);
      setError('Failed to load market data');
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (value) => {
    if (!value) return '—';
    const trillion = value / 1e12;
    return `$${trillion.toFixed(2)}T`;
  };

  const formatChange = (change) => {
    if (change === null || change === undefined) return '—';
    return `${change >= 0 ? '' : ''}${change.toFixed(1)}%`;
  };

  const MiniSparkline = ({ data: sparklineData, color }) => {
    return <MiniChart data={sparklineData} color={color} height={60} />;
  };

  const FearGreedGauge = ({ value, label }) => {
    if (value === null) return <div style={{ width: 120, height: 100 }} />;
    
    // Value is 0-100
    const radius = 40;
    const strokeWidth = 12;
    const centerX = 60;
    const centerY = 70;
    
    // Calculate angle for needle (0-100 maps to 180 degrees, starting from left)
    const angle = 180 - (value * 180 / 100);
    const angleRad = (angle * Math.PI) / 180;
    const needleLength = radius - 5;
    const needleX = centerX + needleLength * Math.cos(angleRad);
    const needleY = centerY - needleLength * Math.sin(angleRad);
    
    // Create gradient stops for the arc (red to yellow to green)
    const gradientId = 'fearGreedGradient';
    
    // Calculate the arc path
    const startAngle = 180;
    const endAngle = 0;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY - radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY - radius * Math.sin(endRad);
    
    return (
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <svg width="120" height="90" viewBox="0 0 120 90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          
          {/* Colored arc with gradient */}
          <path
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Center dot */}
          <circle cx={centerX} cy={centerY} r="3" fill="#1f2937" />
          
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="#1f2937"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          {/* Needle tip circle */}
          <circle cx={needleX} cy={needleY} r="3.5" fill="#1f2937" />
        </svg>
        
        <div style={{ marginTop: '-10px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' }}>
            {value}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
            {label}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !data.bitcoin.price) {
    return (
      <>
        <div className="market-overview-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card_main_wrapper is-small skeleton-card">
              <div className="card_main_content">
                <div className="card_main_flex" style={{ marginBottom: '1rem' }}>
                  <div className="card_main_text_wrapper is-centered">
                    <div className="skeleton skeleton-box" style={{ width: '80px', height: '16px', marginBottom: '8px' }} />
                    <div className="skeleton skeleton-box" style={{ width: '100px', height: '24px' }} />
                  </div>
                  <div className="skeleton skeleton-box" style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
                </div>
                <div className="skeleton skeleton-chart" style={{ height: '60px', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
        
        <style>{`
          .skeleton-card {
            pointer-events: none;
            min-height: 180px;
          }
          
          .skeleton {
            background: linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%);
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
            border-radius: 4px;
          }
          
          .skeleton-box {
            display: block;
          }
          
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
          
          @media (max-width: 768px) {
            .market-overview-cards {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </>
    );
  }

  if (error && !data.bitcoin.price) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div className="market-overview-cards" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
    }}>
      {/* Bitcoin Card */}
      <div className="card_main_wrapper is-small">
        <div className="card_main_content">
          <div className="card_main_flex">
            <div className="card_main_text_wrapper is-centered">
              <div className="text-size-medium text-weight-medium">Bitcoin</div>
              <div className="text-size-small text-color-secondary">BTC</div>
            </div>
            <div className="card_main_text_wrapper">
              <div className="text-size-regular text-weight-medium">{formatPrice(data.bitcoin.price)}</div>
              <div className={`text-size-small text-weight-medium ${data.bitcoin.change >= 0 ? 'text-color-green' : 'text-color-red'}`}>
                {formatChange(data.bitcoin.change)}
              </div>
            </div>
          </div>
        </div>
        <MiniSparkline 
          data={data.bitcoin.sparkline} 
          color={data.bitcoin.change >= 0 ? '#16a34a' : '#dc2626'} 
        />
      </div>

      {/* Ethereum Card */}
      <div className="card_main_wrapper is-small">
        <div className="card_main_content">
          <div className="card_main_flex">
            <div className="card_main_text_wrapper is-centered">
              <div className="text-size-medium text-weight-medium">Ethereum</div>
              <div className="text-size-small text-color-secondary">ETH</div>
            </div>
            <div className="card_main_text_wrapper">
              <div className="text-size-regular text-weight-medium">{formatPrice(data.ethereum.price)}</div>
              <div className={`text-size-small text-weight-medium ${data.ethereum.change >= 0 ? 'text-color-green' : 'text-color-red'}`}>
                {formatChange(data.ethereum.change)}
              </div>
            </div>
          </div>
        </div>
        <MiniSparkline 
          data={data.ethereum.sparkline} 
          color={data.ethereum.change >= 0 ? '#16a34a' : '#dc2626'} 
        />
      </div>

      {/* Solana Card - Hidden on screens < 1200px */}
      <div className="card_main_wrapper is-small solana-card">
        <div className="card_main_content">
          <div className="card_main_flex">
            <div className="card_main_text_wrapper is-centered">
              <div className="text-size-medium text-weight-medium">Solana</div>
              <div className="text-size-small text-color-secondary">SOL</div>
            </div>
            <div className="card_main_text_wrapper">
              <div className="text-size-regular text-weight-medium">{formatPrice(data.solana.price)}</div>
              <div className={`text-size-small text-weight-medium ${data.solana.change >= 0 ? 'text-color-green' : 'text-color-red'}`}>
                {formatChange(data.solana.change)}
              </div>
            </div>
          </div>
        </div>
        <MiniSparkline 
          data={data.solana.sparkline} 
          color={data.solana.change >= 0 ? '#16a34a' : '#dc2626'} 
        />
      </div>

      {/* Market Cap Card */}
      <div className="card_main_wrapper is-small">
        <div className="card_main_content">
          <div className="card_main_flex">
            <div className="card_main_text_wrapper is-centered">
              <div className="text-size-medium text-weight-medium">{formatMarketCap(data.marketCap.value)}</div>
              <div className="text-size-small text-color-secondary">Market Cap</div>
            </div>
            <div className="card_main_text_wrapper">
              <div className={`text-size-small text-weight-medium ${data.marketCap.change >= 0 ? 'text-color-green' : 'text-color-red'}`}>
                {formatChange(data.marketCap.change)}
              </div>
            </div>
          </div>
        </div>
        <MiniSparkline 
          data={data.marketCap.sparkline} 
          color={data.marketCap.change >= 0 ? '#16a34a' : '#dc2626'} 
        />
      </div>

      <style>{`
        @media (max-width: 1199px) {
          .solana-card {
            display: none;
          }
        }
        
        @media (max-width: 768px) {
          .market-overview-cards {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MarketOverviewCards;
