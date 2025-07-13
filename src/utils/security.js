// src/utils/security.js

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - Raw HTML string
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';
  
  // Create a temporary DOM element
  const temp = document.createElement('div');
  temp.textContent = html;
  
  // For price_html, we need to allow some basic formatting
  // but strip dangerous attributes and scripts
  const allowedTags = ['span', 'strong', 'em', 'del', 'ins'];
  const cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ''); // Remove iframes
    
  return cleaned;
}

/**
 * Validate API response structure
 * @param {Array} products - Product array from API
 * @returns {Array} - Validated products
 */
export function validateAPIResponse(products) {
  if (!Array.isArray(products)) {
    console.warn('API response is not an array:', products);
    return [];
  }
  
  return products.filter(product => {
    // Required fields validation
    if (!product || typeof product !== 'object') return false;
    if (!product.id || !product.name) return false;
    
    // Sanitize and validate fields
    const sanitized = {
      ...product,
      id: parseInt(product.id, 10),
      name: sanitizeHTML(product.name),
      price: parseFloat(product.price) || 0,
      price_html: sanitizeHTML(product.price_html || ''),
      stock_status: ['instock', 'outofstock', 'onbackorder'].includes(product.stock_status) 
        ? product.stock_status 
        : 'outofstock',
      images: Array.isArray(product.images) ? product.images.map(img => ({
        src: validateImageURL(img.src),
        alt: sanitizeHTML(img.alt || '')
      })) : [],
      attributes: Array.isArray(product.attributes) ? product.attributes.map(attr => ({
        slug: sanitizeHTML(attr.slug || ''),
        options: Array.isArray(attr.options) ? attr.options.map(sanitizeHTML) : []
      })) : [],
      categories: Array.isArray(product.categories) ? product.categories.map(cat => ({
        slug: sanitizeHTML(cat.slug || ''),
        name: sanitizeHTML(cat.name || '')
      })) : []
    };
    
    return sanitized.id > 0; // Only return products with valid IDs
  });
}

/**
 * Validate image URL to prevent malicious content
 * @param {string} url - Image URL
 * @returns {string} - Validated URL or empty string
 */
function validateImageURL(url) {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) return '';
    // Basic check for image extensions
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    );
    
    return hasValidExtension ? url : '';
  } catch {
    return ''; // Invalid URL
  }
}

/**
 * Escape user input for use in API calls
 * @param {string} input - User input
 * @returns {string} - Escaped input
 */
export function escapeUserInput(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 100); // Limit length
}

/**
 * Rate limiting helper
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  canMakeRequest(key) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

export const apiRateLimiter = new RateLimiter(20, 60000); // 20 requests per minute