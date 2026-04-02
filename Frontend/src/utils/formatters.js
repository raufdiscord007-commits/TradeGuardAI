/**
 * Shared formatting utilities
 * Centralized to avoid duplication across components
 */

/**
 * Format a value as currency with smart decimal handling
 * Handles very small values with subscript notation
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (typeof value !== 'number') return value;
  
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
      return `$${value.toFixed(8).replace(/\.?0+$/, '')}`;
    }
    return `$${value.toFixed(6).replace(/\.?0+$/, '')}`;
  }
  
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format a value as currency using Intl.NumberFormat
 * Better for displaying prices with proper locale handling
 */
export const formatPrice = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '$0.00';
  
  // For very small values, use subscript notation for leading zeros
  if (num > 0 && num < 1) {
    const str = num.toString();
    const match = str.match(/^0\.(0+)([1-9]\d*)/);
    
    if (match && match[1].length >= 4) {
      const leadingZeros = match[1].length;
      const subscriptZeros = leadingZeros.toString().split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
      const significantDigits = match[2].substring(0, 5);
      return `$0.0₍${subscriptZeros}₎${significantDigits}`;
    }
    
    if (num < 0.01) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 6,
        maximumFractionDigits: 8,
      }).format(num);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(num);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format large currency values with compact notation
 */
export const formatLargeCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  
  if (value >= 1e9) {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      notation: 'compact', 
      maximumFractionDigits: 2 
    }).format(value);
  }
  
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(value);
};

/**
 * Format a number without currency symbol
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
};

/**
 * Format percentage value
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.abs(Number(value)).toFixed(2)}%`;
};

/**
 * Get CSS class for price change (positive/negative)
 */
export const getChangeClass = (change) => {
  if (typeof change !== 'number') return 'text-color-primary';
  if (change > 0) return 'text-color-green';
  if (change < 0) return 'text-color-red';
  return 'text-color-primary';
};

/**
 * Get color for price change
 */
export const getChangeColor = (value) => {
  if (value === null || value === undefined) return 'inherit';
  const num = Number(value);
  if (num >= 0) return '#16a34a';
  return '#dc2626';
};
