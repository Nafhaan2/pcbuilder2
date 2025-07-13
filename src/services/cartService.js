// src/services/cartService.js - Robust cart handling with fallbacks
import { apiRateLimiter } from '../utils/security';
import { useState, useCallback } from 'react';

/**
 * CartService handles adding items to WooCommerce cart with multiple fallback strategies
 */
class CartService {
  constructor() {
    this.endpoints = [
      '/wp-json/wc/store/v1/cart/add-items',    // Latest WooCommerce
      '/wp-json/wc/store/cart/add-items',       // Older WooCommerce
    ];
  }

  /**
   * Add multiple items to cart with fallback strategies
   * @param {Array} items - Array of {id, quantity} objects
   * @returns {Promise<Object>} - Success/error response
   */
  async addItemsToCart(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('No items to add to cart');
    }

    // Rate limiting check
    if (!apiRateLimiter.canMakeRequest('cart')) {
      throw new Error('Too many requests. Please wait a moment.');
    }

    // Validate items
    const validatedItems = this.validateCartItems(items);
    if (validatedItems.length === 0) {
      throw new Error('No valid items to add to cart');
    }

    try {
      // Strategy 1: Try batch endpoints
      const batchResult = await this.tryBatchAddition(validatedItems);
      if (batchResult.success) {
        return batchResult;
      }

      // Strategy 2: Add items individually
      const individualResult = await this.tryIndividualAddition(validatedItems);
      if (individualResult.success) {
        return individualResult;
      }

      // Strategy 3: Classic URL parameters fallback
      return this.fallbackToClassicCart(validatedItems);

    } catch (error) {
      console.error('Cart service error:', error);
      throw new Error(`Failed to add items to cart: ${error.message}`);
    }
  }

  /**
   * Validate and sanitize cart items
   * @param {Array} items - Raw items array
   * @returns {Array} - Validated items
   */
  validateCartItems(items) {
    return items
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        id: parseInt(item.id, 10),
        quantity: Math.max(1, parseInt(item.quantity || 1, 10))
      }))
      .filter(item => item.id > 0 && item.quantity > 0);
  }

  /**
   * Try batch API endpoints
   * @param {Array} items - Validated items
   * @returns {Promise<Object>} - Result object
   */
  async tryBatchAddition(items) {
    for (const endpoint of this.endpoints) {
      try {
        const response = await this.makeRequest(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WC-Store-API-Nonce': window.pcBuilderData.storeNonce,
          },
          credentials: 'include',
          body: JSON.stringify({ items }),
        });

        if (response.ok) {
          return {
            success: true,
            method: 'batch',
            endpoint,
            redirect: true
          };
        }

        // If not 404, log the error but continue trying
        if (response.status !== 404) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`Batch endpoint ${endpoint} failed:`, errorData);
        }

      } catch (error) {
        console.warn(`Batch endpoint ${endpoint} error:`, error.message);
      }
    }

    return { success: false };
  }

  /**
   * Try adding items individually
   * @param {Array} items - Validated items
   * @returns {Promise<Object>} - Result object
   */
  async tryIndividualAddition(items) {
    const endpoint = '/wp-json/wc/store/cart/add-item';
    const results = [];
    const failed = [];

    for (const item of items) {
      try {
        const response = await this.makeRequest(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WC-Store-API-Nonce': window.pcBuilderData.storeNonce,
          },
          credentials: 'include',
          body: JSON.stringify(item),
        });

        if (response.ok) {
          results.push(item);
        } else {
          failed.push({ item, status: response.status });
        }

      } catch (error) {
        failed.push({ item, error: error.message });
      }
    }

    if (results.length === items.length) {
      return {
        success: true,
        method: 'individual',
        endpoint,
        redirect: true
      };
    }

    if (results.length > 0) {
      return {
        success: true,
        method: 'individual-partial',
        endpoint,
        redirect: true,
        warning: `${failed.length} item(s) could not be added. This may be due to stock limits or product restrictions.`,
        failed
      };
    }

    return { success: false, failed };
  }

  /**
   * Fallback to classic cart URL with GET parameters
   * @param {Array} items - Validated items
   * @returns {Object} - Fallback result
   */
  fallbackToClassicCart(items) {
    const productIds = items.map(item => item.id);
    const params = new URLSearchParams();
    
    // Add first item as main parameter
    if (productIds.length > 0) {
      params.set('add-to-cart', productIds[0]);
    }
    
    // Add additional items
    productIds.slice(1).forEach((id, index) => {
      params.set(`add-to-cart-${index + 2}`, id);
    });

    const fallbackUrl = `${window.pcBuilderData.cartUrl}?${params.toString()}`;
    
    return {
      success: true,
      method: 'classic-fallback',
      redirect: true,
      url: fallbackUrl,
      warning: 'Using compatibility mode for cart addition.'
    };
  }

  /**
   * Make HTTP request with timeout and error handling
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} - Fetch response
   */
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      
      throw error;
    }
  }

  /**
   * Redirect to cart page
   * @param {string} url - Optional custom URL
   */
  redirectToCart(url = null) {
    window.location.href = url || window.pcBuilderData.cartUrl;
  }
}

export const cartService = new CartService();

/**
 * Hook for cart operations
 * @returns {Object} - Cart operations and state
 */
export function useCart() {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const addBuildToCart = useCallback(async (selectedComponents) => {
    setIsAdding(true);
    setError(null);

    try {
      // Convert selected components to cart items
      const items = [];
      Object.values(selectedComponents).forEach((value) => {
        if (!value) return;
        
        const products = Array.isArray(value) ? value : [value];
        products.forEach((product) => {
          items.push({ id: product.id, quantity: 1 });
        });
      });

      if (items.length === 0) {
        throw new Error('Please select at least one component');
      }

      const result = await cartService.addItemsToCart(items);
      
      // Show warning if partial success
      if (result.warning) {
        console.warn(result.warning);
        // You could show a toast notification here
      }

      // Redirect to cart
      if (result.redirect) {
        cartService.redirectToCart(result.url);
      }

      return result;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsAdding(false);
    }
  }, []);

  return {
    addBuildToCart,
    isAdding,
    error,
    clearError: () => setError(null)
  };
}