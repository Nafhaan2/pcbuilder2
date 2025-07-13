
// src/components/LoadingSpinner.jsx - Accessible loading component
import { memo } from 'react';
export function LoadingSpinner({ size = 'medium', message = 'Loading...' }) {
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 72
  };

  return (
    <div 
      className="loading-spinner"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: '3px solid #333',
          borderTop: '3px solid #ffe24c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 16,
        }}
      />
      <span style={{ color: '#999', fontSize: 14 }}>{message}</span>
    </div>
  );
}