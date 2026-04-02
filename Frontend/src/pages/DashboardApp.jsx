import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../Components/Dashboard Pages/Navbar';
import Sidebar from '../Components/Dashboard Pages/Sidebar';
import BinanceCandleChartCard from '../Components/Chart/CandleChart/BinanceCandleChartCard.jsx';
import OrderBookCard from '../Components/Chart/OrderBook/OrderBookCard.jsx';
import MarketTradesCard from '../Components/Chart/MarketTrades/MarketTradesCard.jsx';
import MarketSummary from '../Components/MarketSummary/MarketSummary.jsx';
import TopCryptoTable from '../Components/MarketSummary/TopCryptoTable';
import MarketOverviewCards from '../Components/MarketSummary/MarketOverviewCards';

export default function DashboardApp() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null); // null = show table, otherwise show details
  const [currentPage, setCurrentPage] = useState(1);
  const [tradingConfig, setTradingConfig] = useState({
    name: "Bitcoin",
    symbol: "BTC",
    chartSymbol: "BTCUSDT",
    interval: "1h",
    height: 400,
    maxOrders: 8,
    maxTrades: 10
  });
  const [priceChanges, setPriceChanges] = useState({});

  const userName = member?.customFields?.['first-name'] || member?.auth?.email?.split('@')[0] || 'User';

  // Initialize state from URL on mount or URL change
  useEffect(() => {
    const coinName = params.coinName;
    const page = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(page);
    
    if (coinName) {
      // Load coin details from URL
      const storedCoins = localStorage.getItem('top_crypto_all_coins');
      if (storedCoins) {
        try {
          const parsed = JSON.parse(storedCoins);
          const coin = parsed.coins.find(c => 
            c.name.toLowerCase().replace(/\s+/g, '-') === coinName.toLowerCase()
          );
          if (coin) {
            setSelectedCrypto(coin);
            setTradingConfig({
              name: coin.name,
              symbol: coin.symbol.toUpperCase(),
              chartSymbol: (coin.symbol + 'USDT').toUpperCase(),
              interval: '1h',
              height: 400,
              maxOrders: 8,
              maxTrades: 10
            });
          }
        } catch (e) {
          console.error('Failed to load coin from cache:', e);
        }
      }
    } else {
      // On /cryptocurrency page (list view)
      setSelectedCrypto(null);
    }
  }, [params.coinName, searchParams, location.pathname]);

  // When a crypto is selected from the table, update tradingConfig and selectedCrypto
  const handleCryptoSelect = (coin, page) => {
    const coinSlug = coin.name.toLowerCase().replace(/\s+/g, '-');
    // Store current page in sessionStorage to restore later
    sessionStorage.setItem('crypto_list_page', page || currentPage);
    // Navigate using React Router
    navigate(`/cryptocurrency/${coinSlug}?from=list&page=${page || currentPage}`);
  };

  // Handle navigation from sidebar
  const handleSidebarNavigate = (path, linkId) => {
    if (linkId === 'cryptocurrency') {
      const savedPage = sessionStorage.getItem('crypto_list_page') || 1;
      navigate(`/cryptocurrency?page=${savedPage}`);
    } else if (path === '/cryptocurrency') {
      const savedPage = sessionStorage.getItem('crypto_list_page') || 1;
      navigate(`/cryptocurrency?page=${savedPage}`);
    } else {
      navigate(path);
    }
  };
  
  // Handle back to list from coin detail
  const handleBackToList = () => {
    const savedPage = sessionStorage.getItem('crypto_list_page') || 1;
    navigate(`/cryptocurrency?page=${savedPage}`);
  };

  // Fetch price changes for selected crypto
  useEffect(() => {
    if (!selectedCrypto) return;
    const fetchPriceChanges = async () => {
      try {
        const coinId = selectedCrypto.id || selectedCrypto.symbol.toLowerCase();
        const getApiBaseUrl = () => {
          const viteUrl = import.meta.env.VITE_API_URL;
          return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
        };
        const response = await fetch(`${getApiBaseUrl()}/api/crypto/${coinId}`);
        
        if (!response.ok) {
          // If rate limited or error, keep existing values (don't reset to 0)
          console.warn(`API request failed (${response.status}), keeping cached values`);
          return;
        }
        
        const data = await response.json();
        
        // Only update if we have valid data
        const hasValidData = data && (
          data.priceChangePercent1h !== undefined ||
          data.priceChangePercent24h !== undefined ||
          data.priceChangePercent7d !== undefined
        );
        
        if (hasValidData) {
          setPriceChanges({
            '1h': data.priceChangePercent1h ?? 0,
            '24h': data.priceChangePercent24h ?? 0,
            '7d': data.priceChangePercent7d ?? 0,
            '14d': data.priceChangePercent14d ?? 0,
            '30d': data.priceChangePercent30d ?? 0,
            '1y': data.priceChangePercent1y ?? 0,
          });
        }
      } catch (error) {
        // On error, keep existing values instead of resetting to 0
      }
    };
    fetchPriceChanges();
    // Poll every 60 seconds instead of 30 to reduce API calls
    const interval = setInterval(fetchPriceChanges, 60000);
    return () => clearInterval(interval);
  }, [selectedCrypto]);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className='page-wrapper'>
      <div className='main-wrapper is-dashboard'>
        <Sidebar isOpen={isSidebarOpen} onNavigate={handleSidebarNavigate} />
        <div className='dashboard_main_wrapper'>
          <Navbar onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
          <div className='dashboard_main_app'>
            {!selectedCrypto ? (
              <>
                <MarketOverviewCards />
                <TopCryptoTable 
                  onCryptoSelect={handleCryptoSelect} 
                  initialPage={currentPage}
                />
              </>
            ) : (
              <>
                <div>
                  <button
                    onClick={handleBackToList}
                    className="button is-small is-icon"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Cryptocurrencies
                  </button>
                </div>
                <div className='dashboard_main_content'>
                  <div className='dashboard_main_flex'>
                  <BinanceCandleChartCard
                    name={tradingConfig.name}
                    symbol={tradingConfig.symbol}
                    chartSymbol={tradingConfig.chartSymbol}
                    interval={tradingConfig.interval}
                    height={tradingConfig.height}
                  />
                  <div className='market-summary_main_wrapper'>
                    <MarketSummary 
                      symbol={tradingConfig.chartSymbol}
                      coinId={selectedCrypto?.id || 'bitcoin'}
                      name={tradingConfig.name}
                      priceChanges={priceChanges}
                    />
                  </div>
                </div>
                <div className='content_main_flex'>
                  <OrderBookCard 
                    symbol={tradingConfig.chartSymbol}
                    baseAsset={tradingConfig.symbol}
                    maxOrders={tradingConfig.maxOrders}
                  />
                  <MarketTradesCard 
                    symbol={tradingConfig.chartSymbol}
                    baseAsset={tradingConfig.symbol}
                    maxTrades={tradingConfig.maxTrades}
                  />
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
