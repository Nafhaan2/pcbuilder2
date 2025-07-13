// src/context/builderReducer.js
import { COMPONENTS } from '../constants';

export const initialState = {
  selected: {},
  catalog: {},
  loading: {},
  errors: {},
  activeComponent: null,
  filters: {},
};

export function builderReducer(state, action) {
  switch (action.type) {
    case 'SELECT_COMPONENT': {
      const { componentKey, product } = action.payload;
      const component = COMPONENTS.find(c => c.key === componentKey);
      
      if (component?.multi) {
        const currentSelection = Array.isArray(state.selected[componentKey]) 
          ? state.selected[componentKey] 
          : [];
        
        const exists = currentSelection.some(p => p.id === product.id);
        const newSelection = exists
          ? currentSelection.filter(p => p.id !== product.id)
          : [...currentSelection, product];
          
        return {
          ...state,
          selected: {
            ...state.selected,
            [componentKey]: newSelection
          }
        };
      }
      
      return {
        ...state,
        selected: {
          ...state.selected,
          [componentKey]: product
        }
      };
    }

    case 'LOAD_PRODUCTS_SUCCESS':
      return {
        ...state,
        catalog: {
          ...state.catalog,
          [action.payload.slug]: action.payload.products
        },
        loading: {
          ...state.loading,
          [action.payload.slug]: false
        },
        errors: {
          ...state.errors,
          [action.payload.slug]: null
        }
      };

    case 'LOAD_PRODUCTS_ERROR':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.slug]: false
        },
        errors: {
          ...state.errors,
          [action.payload.slug]: action.payload.error
        }
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.slug]: action.payload.loading
        }
      };

    case 'SET_ACTIVE_COMPONENT':
      return {
        ...state,
        activeComponent: action.payload
      };

    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.filterType]: action.payload.value
        }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        errors: {}
      };

    case 'RESET_BUILDER':
      return initialState;

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}