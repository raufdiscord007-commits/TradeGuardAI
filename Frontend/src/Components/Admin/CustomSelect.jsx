import React, { useState, useRef, useEffect } from 'react';

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CustomSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select option...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current && selectRef.current) {
      const dropdown = dropdownRef.current;
      const trigger = selectRef.current;
      const dropdownRect = dropdown.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let styles = {};

      // Check if dropdown goes off the right edge
      if (dropdownRect.right > viewportWidth - 10) {
        styles.right = '0';
        styles.left = 'auto';
      }

      setDropdownStyle(styles);
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => 
    typeof opt === 'object' ? opt.value === value : opt === value
  );
  
  const displayValue = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`custom-select ${className}`} ref={selectRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'custom-select-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="custom-select-value">{displayValue}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" ref={dropdownRef} style={dropdownStyle}>
          <div className="custom-select-options">
            {options.map((option, index) => {
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              const isSelected = optionValue === value;

              return (
                <button
                  key={index}
                  type="button"
                  className={`custom-select-option ${isSelected ? 'custom-select-option--selected' : ''}`}
                  onClick={() => handleSelect(optionValue)}
                >
                  <span>{optionLabel}</span>
                  {isSelected && <CheckIcon />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .custom-select {
          position: relative;
          width: 100%;
        }

        .custom-select-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
          color: #323539;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .custom-select-trigger:hover {
          border-color: #1e65fa;
        }

        .custom-select-trigger--open {
          border-color: #1e65fa;
          box-shadow: 0 0 0 3px rgba(30, 101, 250, 0.1);
        }

        .custom-select-value {
          flex: 1;
          text-align: left;
          color: #323539;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .custom-select-trigger svg {
          flex-shrink: 0;
          color: #858c95;
          transition: transform 0.2s;
        }

        .custom-select-trigger--open svg {
          transform: rotate(180deg);
        }

        .custom-select-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          min-width: 100%;
          width: max-content;
          max-width: min(400px, 90vw);
          background: #ffffff;
          border: 1px solid #e5e5e7;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          opacity: 1;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .custom-select-options {
          max-height: 280px;
          overflow-y: auto;
          padding: 4px;
        }

        .custom-select-options::-webkit-scrollbar {
          width: 6px;
        }

        .custom-select-options::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-select-options::-webkit-scrollbar-thumb {
          background: #e5e5e7;
          border-radius: 3px;
        }

        .custom-select-options::-webkit-scrollbar-thumb:hover {
          background: #d0d0d2;
        }

        .custom-select-option {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #323539;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          white-space: nowrap;
        }

        .custom-select-option:hover {
          background: #f5f5f7;
        }

        .custom-select-option--selected {
          background: rgba(30, 101, 250, 0.08);
          color: #1e65fa;
          font-weight: 500;
        }

        .custom-select-option--selected:hover {
          background: rgba(30, 101, 250, 0.12);
        }

        .custom-select-option svg {
          color: #1e65fa;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default CustomSelect;
