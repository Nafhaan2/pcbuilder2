// src/components/ErrorBanner.jsx - Dismissible error display
function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="error-banner" role="alert">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <span className="error-message">{message}</span>
        <button 
          className="error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  );
}