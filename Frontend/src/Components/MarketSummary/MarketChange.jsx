import React from 'react';

const MarketChange = ({ priceChanges = {} }) => {
  // Check if we have any valid data
  const hasAnyData = Object.values(priceChanges).some(val => val !== 0 && val !== null && val !== undefined);
  
  const periods = [
    { key: '1h', label: '1h' },
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' },
    { key: '14d', label: '14d' },
    { key: '30d', label: '30d' },
    { key: '1y', label: '1y' }
  ];

  const getChangeData = (periodKey) => {
    const value = priceChanges[periodKey] || 0;
    const isPositive = value >= 0;
    const colorClass = isPositive ? 'text-color-green' : 'text-color-red';
    const formattedValue = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;
    
    return { value, isPositive, colorClass, formattedValue };
  };

  const UpChevron = () => (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 7 L10 7 L5 0 Z" fill="currentcolor"></path>
    </svg>
  );

  const DownChevron = () => (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0 L10 0 L5 7 Z" fill="currentcolor"></path>
    </svg>
  );

  return (
    <>
      <div className="market-summary_main_price_change">
        {/* Headers */}
        {periods.map((period) => (
          <div key={`header-${period.key}`} className="market-summary_main_price_item is-header">
            <div>{period.label}</div>
          </div>
        ))}

        {/* Values */}
        {periods.map((period) => {
          const { isPositive, colorClass, formattedValue } = getChangeData(period.key);
          return (
            <div key={`value-${period.key}`} className="market-summary_main_price_item">
              <div className={colorClass}>{formattedValue}</div>
              <div className={`market-summary_main_price_chevron ${colorClass} w-embed`}>
                {isPositive ? <UpChevron /> : <DownChevron />}
              </div>
            </div>
          );
        })}

        <div className="is-none w-embed">
          <style>{`
            .market-summary_main_price_change:nth-child(6),
            .market-summary_main_price_change:nth-child(12) {
              border-right: 0px !important;
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default MarketChange;
