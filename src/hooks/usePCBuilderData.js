// src/hooks/usePCBuilderData.js - Custom hook for initial data loading
import { useState, useEffect } from 'react';

export function usePCBuilderData() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Validate required WordPress data
    if (!window.pcBuilderData) {
      setError(new Error('PC Builder data not found. Please ensure the shortcode is properly loaded.'));
      setIsLoading(false);
      return;
    }

    const required = ['root', 'nonce', 'storeNonce', 'cartUrl'];
    const missing = required.filter(key => !window.pcBuilderData[key]);
    
    if (missing.length > 0) {
      setError(new Error(`Missing required data: ${missing.join(', ')}`));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, []);

  return { isLoading, error };
}