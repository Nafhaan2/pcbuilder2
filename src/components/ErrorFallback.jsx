import { memo } from 'react';
export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div
      className="error-fallback"
      style={{
        padding: 40,
        textAlign: 'center',
        background: '#2a0a0a',
        border: '1px solid #5c0000',
        borderRadius: 8,
        margin: 20,
      }}
      role="alert"
    >
      <h2 style={{ color: '#ff6b6b', marginBottom: 16 }}>
        Something went wrong
      </h2>
      <details style={{ marginBottom: 20, textAlign: 'left' }}>
        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
          Error details
        </summary>
        <pre style={{ 
          background: '#1a1a1a', 
          padding: 12, 
          borderRadius: 4,
          fontSize: 12,
          overflow: 'auto'
        }}>
          {error.message}
        </pre>
      </details>
      
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          style={{
            padding: '8px 16px',
            background: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
