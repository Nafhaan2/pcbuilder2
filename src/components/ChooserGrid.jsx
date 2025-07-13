// src/components/ChooserGrid.jsx - Performance optimized
import { memo, useState, useMemo, useCallback,useEffect } from 'react';
import { COMPONENTS } from '../constants';
import { usePCBuilder } from '../context/PCBuilderContext';
import { useVirtualScroll, useLazyImage } from '../utils/performance';
import { escapeUserInput } from '../utils/security';
import ProductCard from './ProductCard';
import FilterPills from './FilterPills';
import LoadingSpinner from './LoadingSpinner';

// Memoized product card component
const MemoizedProductCard = memo(ProductCard);

function ChooserGrid({ compKey, onClose }) {
  const { state, actions, selectors } = usePCBuilder();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSlugIdx, setActiveSlugIdx] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [capFilter, setCapFilter] = useState('');

  // Component configuration
  const comp = COMPONENTS.find((c) => c.key === compKey);
  const { label, slug, tabNames = [], multi = false, attrType, attrCap } = comp;
  const slugList = Array.isArray(slug) ? slug : [slug];
  const hasSlugTabs = slugList.length > 1;
  const currentSlug = slugList[activeSlugIdx];

  // Load products for current slug
  const products = selectors.getComponentProducts(currentSlug);
  const isLoading = state.loading[currentSlug];
  const error = state.errors[currentSlug];

  // Load products on mount or slug change
  useEffect(() => {
    actions.loadProducts(currentSlug);
  }, [currentSlug, actions]);

  // Memoized filter options
  const { typeTerms, capTerms } = useMemo(() => {
    const t = new Set(), c = new Set();
    products.forEach((p) => {
      p.attributes?.forEach((a) => {
        if (attrType && (a.slug === attrType || a.slug === `pa_${attrType}`)) {
          a.options?.forEach((o) => t.add(o));
        }
        if (attrCap && (a.slug === attrCap || a.slug === `pa_${attrCap}`)) {
          a.options?.forEach((o) => c.add(o));
        }
      });
    });
    return { typeTerms: [...t], capTerms: [...c] };
  }, [products, attrType, attrCap]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    const sanitizedSearch = escapeUserInput(searchTerm).toLowerCase();
    
    return products.filter((p) => {
      // Search filter
      if (sanitizedSearch && !p.name.toLowerCase().includes(sanitizedSearch)) {
        return false;
      }

      // Slug filter for tabs
      if (hasSlugTabs && !p.categories?.some((c) => c.slug === currentSlug)) {
        return false;
      }

      // Attribute filters
      if (typeFilter) {
        const hasType = p.attributes?.some(
          (a) =>
            (a.slug === attrType || a.slug === `pa_${attrType}`) &&
            a.options?.includes(typeFilter)
        );
        if (!hasType) return false;
      }

      if (capFilter) {
        const hasCap = p.attributes?.some(
          (a) =>
            (a.slug === attrCap || a.slug === `pa_${attrCap}`) &&
            a.options?.includes(capFilter)
        );
        if (!hasCap) return false;
      }

      return true;
    });
  }, [products, searchTerm, hasSlugTabs, currentSlug, typeFilter, capFilter, attrType, attrCap]);

  // Virtual scrolling for large lists
  const containerHeight = 600; // Fixed height container
  const itemHeight = 380; // Approximate card height including gap
  const { visibleItems, offsetY, totalHeight, setScrollTop } = useVirtualScroll(
    filteredProducts,
    itemHeight,
    containerHeight
  );

  // Callbacks
  const handleProductSelect = useCallback((product) => {
    actions.selectComponent(compKey, product);
    if (!multi) onClose();
  }, [actions, compKey, multi, onClose]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, [setScrollTop]);

  // Helper functions
  const prettify = useCallback((s) =>
    s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  , []);

  const isSelected = useCallback((product) => {
    const selected = selectors.getSelectedComponent(compKey);
    return multi
      ? Array.isArray(selected) && selected.some((d) => d.id === product.id)
      : selected?.id === product.id;
  }, [selectors, compKey, multi]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="chooser-grid" style={{ padding: 20 }}>
      <div className="chooser-header">
        <h3 style={{ marginBottom: 12 }}>Select {label}</h3>
        
        {/* Search input */}
        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #777',
              background: '#2a2a2a',
              color: '#fff',
            }}
          />
        </div>

        {/* Slug tabs */}
        {hasSlugTabs && (
          <div style={{ marginBottom: 14 }}>
            {slugList.map((raw, i) => (
              <button
                key={raw}
                onClick={() => setActiveSlugIdx(i)}
                style={{
                  padding: '6px 18px',
                  marginRight: 12,
                  borderRadius: 20,
                  border: '1px solid #777',
                  background: i === activeSlugIdx ? '#ffe24c' : 'transparent',
                  color: i === activeSlugIdx ? '#000' : '#fff',
                }}
              >
                {tabNames[i] || prettify(raw)}
              </button>
            ))}
          </div>
        )}

        {/* Filter pills */}
        <FilterPills
          typeTerms={typeTerms}
          capTerms={capTerms}
          typeFilter={typeFilter}
          capFilter={capFilter}
          setTypeFilter={setTypeFilter}
          setCapFilter={setCapFilter}
          prettify={prettify}
          attrType={attrType}
          attrCap={attrCap}
        />
      </div>

      {/* Results count */}
      <div style={{ marginBottom: 10, color: '#999', fontSize: 14 }}>
        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
      </div>

      {/* Virtual scrolled product grid */}
      {filteredProducts.length === 0 ? (
        <p>No products match your criteria.</p>
      ) : (
        <div
          className="products-container"
          style={{
            height: containerHeight,
            overflow: 'auto',
            position: 'relative',
          }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
              }}
            >
              {visibleItems.map((product) => (
                <MemoizedProductCard
                  key={product.id}
                  product={product}
                  isSelected={isSelected(product)}
                  onSelect={handleProductSelect}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          marginTop: 18,
          padding: '8px 16px',
          cursor: 'pointer',
          borderRadius: 6,
          border: '1px solid #777',
          background: '#333',
          color: '#fff',
        }}
      >
        Close
      </button>
    </div>
  );
}

export default memo(ChooserGrid);