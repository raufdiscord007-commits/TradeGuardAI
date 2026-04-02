import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../Components/Dashboard Pages/Navbar';
import Sidebar from '../Components/Dashboard Pages/Sidebar';

// Get API base URL
const getApiBaseUrl = () => {
  const viteUrl = import.meta.env.VITE_API_URL;
  return viteUrl === 'RUNTIME_ORIGIN' ? '' : viteUrl || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Coin prediction data
const predictionCoins = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    available: true,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    available: false,
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    available: false,
  },
];

// Helper function to determine recommendation type from recommendation text
const getRecommendationType = (recommendation) => {
  const lowerRec = recommendation?.toLowerCase() || '';
  if (lowerRec.includes('buy') || lowerRec.includes('long')) return 'long';
  if (lowerRec.includes('sell') || lowerRec.includes('short')) return 'short';
  return 'neutral';
};

// Helper function to get confidence color based on value
const getConfidenceColor = (confidence, apiColor) => {
  if (apiColor) return apiColor;
  if (confidence >= 70) return 'var(--color-green)';
  if (confidence >= 50) return '#f0ad4e';
  return 'var(--color-red)';
};

export default function PredictionsPage() {
  const { member } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch prediction data from API
  const fetchPrediction = useCallback(async () => {
    if (!selectedCoin) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/predictions/${selectedCoin.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch prediction data');
      }
      const data = await response.json();
      setPrediction({
        currentPrice: data.current_price,
        aiConfidence: data.confidence,
        confidenceColor: data.confidence_color,
        recommendation: data.recommendation,
        recommendationColor: data.rec_color,
        recommendationType: getRecommendationType(data.recommendation),
        entryPrice: data.entry_price,
        takeProfit: data.take_profit,
        stopLoss: data.stop_loss,
        reason: data.reason,
        nextScanAt: data.next_scan,
        lastUpdated: data.last_updated,
      });
    } catch (err) {
      console.error('Error fetching prediction:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCoin]);

  // Initialize selected coin from URL parameter
  useEffect(() => {
    const coinId = params.coinId;
    if (coinId) {
      const coin = predictionCoins.find(c => c.id === coinId);
      if (coin && coin.available) {
        setSelectedCoin(coin);
      } else {
        // If coin not found or not available, redirect to predictions home
        navigate('/predictions', { replace: true });
      }
    } else {
      setSelectedCoin(null);
      setPrediction(null);
    }
  }, [params.coinId, navigate]);

  // Fetch prediction when a coin is selected
  useEffect(() => {
    if (selectedCoin && selectedCoin.id === 'bitcoin') {
      fetchPrediction();
    }
  }, [selectedCoin, fetchPrediction]);

  // Auto-refresh prediction every 60 seconds when viewing Bitcoin
  useEffect(() => {
    if (selectedCoin && selectedCoin.id === 'bitcoin') {
      const interval = setInterval(fetchPrediction, 60000);
      return () => clearInterval(interval);
    }
  }, [selectedCoin, fetchPrediction]);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCoinSelect = (coin) => {
    if (coin.available) {
      navigate(`/predictions/${coin.id}`);
    }
  };

  const handleBackToSelection = () => {
    navigate('/predictions');
  };

  const handleSidebarNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="page-wrapper">
      <div className="main-wrapper is-dashboard">
        <Sidebar isOpen={isSidebarOpen} onNavigate={handleSidebarNavigate} activePage="predictions" />
        <div className="dashboard_main_wrapper">
          <Navbar onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
          <div className="dashboard_main_app">
            {/* Page Header */}
            <div>
              <h1 className="text-size-xlarge text-weight-semibold" style={{ marginBottom: '0.5rem' }}>
                AI Predictions
              </h1>
              <p className="text-size-regular text-color-secondary">
                AI-powered price predictions and trading recommendations
              </p>
            </div>

            {!selectedCoin ? (
              /* Coin Selection View */
              <>
                {/* Coin Selection Cards */}
                <div className="predictions-grid">
                  {predictionCoins.map((coin) => (
                    <div
                      key={coin.id}
                      onClick={() => handleCoinSelect(coin)}
                      className={`card_app_wrapper prediction-card ${coin.available ? 'prediction-card--active' : 'prediction-card--disabled'}`}
                    >
                      {/* Coming Soon Badge */}
                      {!coin.available && (
                        <div className="prediction-badge">
                          Coming Soon
                        </div>
                      )}

                      {/* Coin Icon & Name */}
                      <div className="prediction-card-header">
                        <img
                          src={coin.icon}
                          alt={coin.name}
                          className="prediction-card-icon"
                        />
                        <div>
                          <div className="text-size-large text-weight-semibold">
                            {coin.name}
                          </div>
                          <div className="text-size-small text-color-secondary">
                            {coin.symbol}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="prediction-card-status">
                        <div
                          className={`prediction-status-dot ${coin.available ? 'prediction-status-dot--active' : ''}`}
                        />
                        <span className="text-size-small text-color-secondary">
                          {coin.available ? 'AI Model Active' : 'Model Training'}
                        </span>
                      </div>

                      {/* Click to View */}
                      {coin.available && (
                        <div className="prediction-card-footer">
                          <span 
                            className="text-size-small text-weight-medium"
                            style={{ color: 'var(--base-color-brand--color-primary)' }}
                          >
                            Click to view prediction →
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Info Card */}
                <div className="card_app_wrapper predictions-info-card">
                  <div className="predictions-info-content">
                    <div className="predictions-info-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-size-medium text-weight-semibold" style={{ marginBottom: '0.5rem' }}>
                        How AI Predictions Work
                      </div>
                      <p className="text-size-regular text-color-secondary" style={{ lineHeight: '1.6' }}>
                        Our AI model analyzes real-time market data, technical indicators, and historical patterns 
                        to generate trading recommendations. Predictions are updated every hour and include 
                        confidence levels, entry points, and risk management parameters.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Prediction Detail View */
              <>
                {/* Back Button */}
                <div>
                  <button
                    onClick={handleBackToSelection}
                    className="button is-small is-icon"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back to Predictions
                  </button>
                </div>

                {/* Loading State */}
                {isLoading && !prediction && (
                  <div className="card_app_wrapper" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="prediction-loading-spinner" style={{ marginBottom: '1rem' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinning">
                        <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="var(--base-color-brand--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="text-size-medium text-color-secondary">Loading prediction data...</div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="card_app_wrapper" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--color-red)' }}>
                    <div className="text-size-medium" style={{ color: 'var(--color-red)', marginBottom: '1rem' }}>
                      ⚠️ {error}
                    </div>
                    <button onClick={fetchPrediction} className="button is-secondary is-small">
                      Try Again
                    </button>
                  </div>
                )}

                {/* Main Content Grid */}
                {prediction && (
                  <div className="prediction-detail-grid">
                    {/* Left Column - Price & Confidence */}
                    <div className="card_app_wrapper">
                      {/* Header */}
                      <div className="card_app_header prediction-detail-header">
                        <div className="prediction-coin-info">
                          <img
                            src={selectedCoin.icon}
                            alt={selectedCoin.name}
                            className="prediction-coin-icon-sm"
                          />
                          <div>
                            <div className="text-size-medium text-weight-semibold">
                              {selectedCoin.name} Prediction
                            </div>
                            <div className="text-size-small text-color-secondary">
                              {selectedCoin.symbol}/USDT
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="prediction-detail-body">
                        {/* Current Price */}
                        <div className="prediction-price-section">
                          <div className="text-size-small text-color-secondary" style={{ marginBottom: '0.25rem' }}>
                            Current Price
                          </div>
                          <div className="prediction-price-value text-weight-bold">
                            {prediction.currentPrice}
                          </div>
                        </div>

                        {/* AI Confidence */}
                        <div>
                          <div className="text-size-small text-color-secondary" style={{ marginBottom: '0.5rem' }}>
                            AI Confidence
                          </div>
                          <div className="prediction-confidence-row">
                            {/* Progress Bar */}
                            <div className="prediction-progress-bar">
                              <div
                                className="prediction-progress-fill"
                                style={{ 
                                  width: `${prediction.aiConfidence}%`,
                                  backgroundColor: getConfidenceColor(prediction.aiConfidence, prediction.confidenceColor)
                                }}
                              />
                            </div>
                            {/* Percentage */}
                            <span 
                              className="text-size-large text-weight-semibold"
                              style={{ color: getConfidenceColor(prediction.aiConfidence, prediction.confidenceColor) }}
                            >
                              {prediction.aiConfidence}%
                            </span>
                          </div>
                        </div>

                        {/* Last Updated */}
                        <div className="prediction-last-updated">
                          <div className="text-size-tiny text-color-secondary">
                            Last updated: {prediction.lastUpdated}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Recommendation */}
                    <div className="card_app_wrapper">
                      {/* Header */}
                      <div 
                        className="card_app_header prediction-recommendation-header"
                        style={{
                          backgroundColor: prediction.recommendationType === 'long' 
                            ? 'rgba(38, 166, 154, 0.08)' 
                            : prediction.recommendationType === 'short'
                            ? 'rgba(239, 83, 80, 0.08)'
                            : 'rgba(139, 148, 158, 0.08)',
                        }}
                      >
                        <div className="text-size-small text-color-secondary" style={{ marginBottom: '0.25rem' }}>
                          Recommendation
                        </div>
                        <div 
                          className="text-size-xlarge text-weight-bold"
                          style={{ 
                            color: prediction.recommendationColor || (
                              prediction.recommendationType === 'long' 
                                ? 'var(--color-green)' 
                                : prediction.recommendationType === 'short'
                                ? 'var(--color-red)'
                                : 'var(--text-color--text-primary)'
                            ),
                          }}
                        >
                          {prediction.recommendation}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="prediction-detail-body">
                        {/* Trading Parameters */}
                        <div className="prediction-steps-section">
                          <div className="prediction-steps-title text-size-small text-weight-semibold">
                            Trading Parameters
                          </div>

                          {/* Parameter Items */}
                          <div className="prediction-steps-list">
                            {/* Entry Price */}
                            <div className="prediction-step-item">
                              <span className="text-size-regular text-color-secondary">Entry Price:</span>
                              <span 
                                className="text-size-regular text-weight-medium"
                                style={{ color: prediction.entryPrice !== '-' ? 'var(--color-green)' : 'var(--text-color--text-secondary)' }}
                              >
                                {prediction.entryPrice}
                              </span>
                            </div>

                            {/* Take Profit */}
                            <div className="prediction-step-item">
                              <span className="text-size-regular text-color-secondary">Take Profit:</span>
                              <span 
                                className="text-size-regular text-weight-medium"
                                style={{ color: prediction.takeProfit !== '-' ? 'var(--color-green)' : 'var(--text-color--text-secondary)' }}
                              >
                                {prediction.takeProfit}
                              </span>
                            </div>

                            {/* Stop Loss */}
                            <div className="prediction-step-item">
                              <span className="text-size-regular text-color-secondary">Stop Loss:</span>
                              <span 
                                className="text-size-regular text-weight-medium"
                                style={{ color: prediction.stopLoss !== '-' ? 'var(--color-red)' : 'var(--text-color--text-secondary)' }}
                              >
                                {prediction.stopLoss}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="prediction-reason">
                          <div className="text-size-small text-weight-semibold" style={{ marginBottom: '0.5rem' }}>
                            Analysis
                          </div>
                          <p className="text-size-regular text-color-secondary" style={{ lineHeight: 1.5 }}>
                            {prediction.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Scan Card */}
                {prediction && (
                  <div className="card_app_wrapper prediction-scan-card">
                    <div className="prediction-scan-info">
                      <div className="prediction-scan-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="var(--base-color-brand--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-size-small text-color-secondary">
                          Next AI Scan
                        </div>
                        <div className="text-size-medium text-weight-semibold">
                          {prediction.nextScanAt}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={fetchPrediction} 
                      disabled={isLoading}
                      className="button is-secondary is-small prediction-refresh-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={isLoading ? 'spinning' : ''}>
                        <path d="M1 4V10H7M23 20V14H17M20.49 9C19.9828 7.56678 19.1209 6.28535 17.9845 5.27557C16.8482 4.26579 15.4745 3.56141 13.9917 3.22617C12.509 2.89093 10.9652 2.93574 9.50481 3.35651C8.04437 3.77728 6.71475 4.56074 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4393 15.9556 20.2227 14.4952 20.6435C13.0348 21.0643 11.491 21.1091 10.0083 20.7738C8.52547 20.4386 7.1518 19.7342 6.01547 18.7244C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {isLoading ? 'Refreshing...' : 'Refresh Prediction'}
                    </button>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="prediction-disclaimer">
                  <p className="text-size-small text-color-secondary" style={{ lineHeight: 1.5 }}>
                    <strong>⚠️ Disclaimer:</strong> AI predictions are for informational purposes only and 
                    do not constitute financial advice. Always conduct your own research and consider your 
                    risk tolerance before making trading decisions. Past performance does not guarantee future results.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
