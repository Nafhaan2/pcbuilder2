import { memo } from 'react';
import { useCart } from '../services/cartService';
import ErrorBanner from './ErrorBanner';

function BuildSummary({ 
  selectedComponents, 
  totalPrice, 
  itemCount
}) {
  const { addBuildToCart, isAdding, error: cartError, clearError } = useCart();
  const hasItems = itemCount > 0;
  
  const formatPrice = (price) => {
    return price.toLocaleString(undefined, { 
      style: 'currency', 
      currency: 'USD' 
    });
  };

  const handleAddToCart = async () => {
    try {
      await addBuildToCart(selectedComponents);
    } catch (error) {
      console.error('Failed to add build to cart:', error);
    }
  };

  return (
    <div className="build-summary">
      {cartError && (
        <ErrorBanner 
          message={cartError} 
          onDismiss={clearError}
        />
      )}
      
      <div className="summary-header">
        <h3>Build Summary</h3>
        <span className="item-count">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="summary-content">
        {!hasItems ? (
          <p className="empty-state">
            Select components to see your build summary
          </p>
        ) : (
          <div className="selected-items">
            {Object.entries(selectedComponents).map(([key, value]) => {
              if (!value) return null;
              
              const items = Array.isArray(value) ? value : [value];
              return items.map((item, index) => (
                <div key={`${key}-${item.id}-${index}`} className="summary-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-category">{key}</span>
                  </div>
                  <span 
                    className="item-price"
                    dangerouslySetInnerHTML={{ __html: item.price_html }}
                  />
                </div>
              ));
            })}
          </div>
        )}
      </div>

      <div className="summary-footer">
        <div className="total-price">
          <span className="label">Total:</span>
          <span className="amount">{formatPrice(totalPrice)}</span>
        </div>
        
        <button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={!hasItems || isAdding}
          aria-label={`Add ${itemCount} items to cart`}
        >
          {isAdding ? (
            <>
              <span className="spinner" />
              Adding to Cart...
            </>
          ) : (
            `Add Build to Cart`
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(BuildSummary);