// src/context/PCBuilderContext.jsx
import { createContext, useContext, useReducer, useMemo } from 'react';
import { builderReducer, initialState } from './builderReducer';
import { validateAPIResponse, sanitizeHTML } from '../utils/security';
import { debounce } from '../utils/performance';

const PCBuilderContext = createContext();

export function PCBuilderProvider({ children }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);

  // Memoized selectors to prevent unnecessary re-renders
  const selectors = useMemo(() => ({
    getSelectedComponent: (componentKey) => state.selected[componentKey],
    getComponentProducts: (slug) => state.catalog[slug] || [],
    getTotalPrice: () => {
      return Object.values(state.selected).reduce((sum, item) => {
        if (Array.isArray(item)) {
          return sum + item.reduce((s, p) => s + Number(p.price || 0), 0);
        }
        return sum + Number(item?.price || 0);
      }, 0);
    },
    getCartItems: () => {
      const items = [];
      Object.values(state.selected).forEach((val) => {
        if (!val) return;
        (Array.isArray(val) ? val : [val]).forEach((p) =>
          items.push({ id: p.id, quantity: 1 })
        );
      });
      return items;
    }
  }), [state.selected, state.catalog]);

  // Debounced actions to improve performance
  const debouncedActions = useMemo(() => ({
    setFilter: debounce((filterType, value) => {
      dispatch({ type: 'SET_FILTER', payload: { filterType, value } });
    }, 300),
  }), []);

  // Secure API actions
  const actions = useMemo(() => ({
    selectComponent: (componentKey, product) => {
      // Sanitize product data before storing
      const sanitizedProduct = {
        ...product,
        name: sanitizeHTML(product.name),
        price_html: sanitizeHTML(product.price_html),
      };
      dispatch({ 
        type: 'SELECT_COMPONENT', 
        payload: { componentKey, product: sanitizedProduct } 
      });
    },

    loadProducts: async (slug) => {
      if (state.catalog[slug] && !state.loading[slug]) return;
      
      dispatch({ type: 'SET_LOADING', payload: { slug, loading: true } });
      
      try {
        const response = await fetch(
          `${window.pcBuilderData.root}pcbuilder/v1/products?category=${slug}&per_page=50`, // Reduced page size
          { 
            headers: { 'X-WP-Nonce': window.pcBuilderData.nonce },
            signal: AbortSignal.timeout(10000) // 10s timeout
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const validatedProducts = validateAPIResponse(data.body || []);
        
        dispatch({ 
          type: 'LOAD_PRODUCTS_SUCCESS', 
          payload: { slug, products: validatedProducts } 
        });
      } catch (error) {
        console.error(`Failed to load products for ${slug}:`, error);
        dispatch({ 
          type: 'LOAD_PRODUCTS_ERROR', 
          payload: { slug, error: error.message } 
        });
      }
    },

    setActiveComponent: (componentKey) => {
      dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: componentKey });
    },

    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    },

    ...debouncedActions,
  }), [state.catalog, state.loading, debouncedActions]);

  const contextValue = useMemo(() => ({
    state,
    actions,
    selectors,
  }), [state, actions, selectors]);

  return (
    <PCBuilderContext.Provider value={contextValue}>
      {children}
    </PCBuilderContext.Provider>
  );
}

export function usePCBuilder() {
  const context = useContext(PCBuilderContext);
  if (!context) {
    throw new Error('usePCBuilder must be used within PCBuilderProvider');
  }
  return context;
}