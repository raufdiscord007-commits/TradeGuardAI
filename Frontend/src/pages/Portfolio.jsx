import React, { useState, useEffect } from 'react';

const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/portfolio')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setPortfolioData(data.data);
          setWalletBalance(data.walletBalance || 0); // Grabs your $350
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error connecting to backend:", error);
        setLoading(false);
      });
  }, []);

  // Calculate total value of crypto + USD wallet
  const totalCryptoValue = portfolioData.reduce((acc, item) => acc + (item.amount * item.currentPrice), 0);
  const grandTotal = totalCryptoValue + walletBalance;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', width: '100%' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>My Portfolio 📈</h2>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', color: '#6b7280', fontWeight: 'bold' }}>
            Wallet Balance: ${walletBalance.toFixed(2)} USD
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
            Total Assets: ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading your assets...</p>
      ) : portfolioData.length === 0 ? (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
          <p>Your portfolio is currently empty. Start trading!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e5e7', color: '#6b7280', backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '16px 12px' }}>Asset</th>
                <th style={{ padding: '16px 12px' }}>Holdings</th>
                <th style={{ padding: '16px 12px' }}>Profit / Loss</th>
                <th style={{ padding: '16px 12px' }}>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.map((item, index) => {
                const isProfit = item.pnl >= 0;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e5e7' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>
                      {item.name} <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: 'normal', marginLeft: '8px' }}>{item.symbol}</span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.amount} {item.symbol}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>${(item.amount * item.currentPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </td>
                    {/* The Green/Red Profit and Loss Logic */}
                    <td style={{ padding: '16px 12px', color: isProfit ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                      <div style={{ backgroundColor: isProfit ? '#d1fae5' : '#fee2e2', display: 'inline-block', padding: '4px 8px', borderRadius: '4px' }}>
                        {isProfit ? '▲' : '▼'} ${Math.abs(item.pnl).toFixed(2)}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#4b5563' }}>
                      {item.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Portfolio;