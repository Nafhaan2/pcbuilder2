// src/components/BuilderInterface.jsx - Main interface component
import { memo } from 'react';
import { usePCBuilder } from '../context/PCBuilderContext';
import { useCart } from '../services/cartService';
import BuilderTable from './BuilderTable';
import BuildSummary from './BuildSummary';
import ErrorBanner from './ErrorBanner';

function BuilderInterface() {
  const { state, selectors } = usePCBuilder();
  const { addBuildToCart, isAdding, error: cartError, clearError } = useCart();

  const totalPrice = selectors.getTotalPrice();
  const selectedItems = selectors.getCartItems();

  const handleAddToCart = async () => {
    try {
      await addBuildToCart(state.selected);
    } catch (error) {
      // Error is already set in the hook
      console.error('Failed to add build to cart:', error);
    }
  };

  return (
    <div className="builder-interface">
      <div className="builder-content">
        <div className="builder-main">
          {cartError && (
            <ErrorBanner 
              message={cartError} 
              onDismiss={clearError}
            />
          )}
          
          <BuilderTable />
        </div>
        
        <div className="builder-sidebar">
          <BuildSummary
            selectedComponents={state.selected}
            totalPrice={totalPrice}
            itemCount={selectedItems.length}
            onAddToCart={handleAddToCart}
            isAdding={isAdding}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(BuilderInterface);