import React from 'react';

const MiniChart = ({ data, color = '#dc2626', height = 60 }) => {
  // Check if data is valid
  const validData = Array.isArray(data) && data.length >= 2 && 
    data.every(val => typeof val === 'number' && !isNaN(val));

  if (!validData) {
    return (
      <div style={{ 
        width: '100%', 
        height: height,
        background: 'linear-gradient(90deg, #f5f5f5 0%, #e5e5e5 100%)',
        borderRadius: '4px'
      }} />
    );
  }

  const width = 200;
  const padding = 0;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Create points for the polyline
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Create smooth path using SVG path commands
  const pathPoints = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y };
  });

  // Create smooth curve path
  let pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
  for (let i = 1; i < pathPoints.length; i++) {
    const prev = pathPoints[i - 1];
    const curr = pathPoints[i];
    const cpX = (prev.x + curr.x) / 2;
    pathD += ` Q ${prev.x} ${prev.y}, ${cpX} ${(prev.y + curr.y) / 2}`;
  }
  // Add final segment
  const last = pathPoints[pathPoints.length - 1];
  pathD += ` L ${last.x} ${last.y}`;

  return (
    <svg 
      width="100%" 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ 
        display: 'block',
        borderRadius: '4px'
      }}
    >
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default MiniChart;
