import React, { useEffect } from 'react'

export default function Navlinks({ onFilterChange, activeFilter }) {
  const filters = [
    { id: 'trending', label: 'Trending Coins' },
    { id: 'new', label: 'New Coins' },
    { id: 'viewed', label: 'Most Viewed' },
    { id: 'volume', label: 'Highest Volume' },
    { id: 'gainers', label: 'Top Gainers' },
    { id: 'losers', label: 'Top Losers' },
  ]

  useEffect(() => {
    // Sync local state with parent
  }, [activeFilter])

  const handleFilterClick = (filterId) => {
    // Toggle: if clicking the same filter, deselect it
    if (activeFilter === filterId) {
      onFilterChange?.(null)
    } else {
      onFilterChange?.(filterId)
    }
  }

  return (
    <div className="navbar_app_component">
      <div className="main_app_nav_container">
        <div className="main_app_nav_content">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className={`main_app_nav_link ${activeFilter === filter.id ? 'is-active' : ''}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}