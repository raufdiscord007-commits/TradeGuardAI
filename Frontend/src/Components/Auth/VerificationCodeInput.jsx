import React, { useState, useRef, useEffect } from 'react';

/**
 * 6-Digit Verification Code Input Component
 * Features auto-focus, paste support, and keyboard navigation
 */
const VerificationCodeInput = ({ 
  length = 6, 
  onComplete, 
  disabled = false,
  error = null,
  autoFocus = true,
}) => {
  const [code, setCode] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Clear inputs when error changes
  useEffect(() => {
    if (error) {
      setCode(new Array(length).fill(''));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }
  }, [error, length]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Move to next input if value entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Check if complete
    const fullCode = newCode.join('');
    if (fullCode.length === length && onComplete) {
      onComplete(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1].focus();
      }
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
    }

    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    // Handle right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only accept digits
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (digits) {
      const newCode = [...code];
      digits.split('').forEach((digit, i) => {
        if (i < length) {
          newCode[i] = digit;
        }
      });
      setCode(newCode);

      // Focus the next empty input or last input
      const nextEmptyIndex = newCode.findIndex(v => !v);
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      // Check if complete
      const fullCode = newCode.join('');
      if (fullCode.length === length && onComplete) {
        onComplete(fullCode);
      }
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            style={{
              width: '3rem',
              height: '3.5rem',
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: '700',
              border: error ? '2px solid var(--color-red, #ef5350)' : '2px solid var(--border-color--border-primary, #e5e5e7)',
              borderRadius: '0.5rem',
              backgroundColor: error ? 'rgba(239, 83, 80, 0.05)' : 'var(--base-color-neutral--white, #fff)',
              color: 'var(--text-color--text-primary, #323539)',
              outline: 'none',
              transition: 'all 0.2s ease',
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'text',
            }}
            onMouseEnter={(e) => {
              if (!disabled && !error) {
                e.target.style.borderColor = 'var(--base-color-brand--color-primary, #1e65fa)';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !error && document.activeElement !== e.target) {
                e.target.style.borderColor = 'var(--border-color--border-primary, #e5e5e7)';
              }
            }}
            onFocus={(e) => {
              e.target.select();
              if (!error) {
                e.target.style.borderColor = 'var(--base-color-brand--color-primary, #1e65fa)';
                e.target.style.boxShadow = '0 0 0 3px rgba(30, 101, 250, 0.1)';
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.target.style.borderColor = 'var(--border-color--border-primary, #e5e5e7)';
                e.target.style.boxShadow = 'none';
              }
            }}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </div>
      
      {error && (
        <p className="text-size-small text-color-red" style={{ textAlign: 'center', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default VerificationCodeInput;
