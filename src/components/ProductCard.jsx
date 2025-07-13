// src/components/ProductCard.jsx - Optimized product card with lazy loading
import { memo } from 'react';
import { useLazyImage } from '../utils/performance';

const ProductCard = memo(function ProductCard({ product, isSelected, onSelect }) {
  const { imageSrc, isLoaded, isError } = useLazyImage(
    product.images?.[0]?.src,
    '/placeholder-image.jpg' // Add a placeholder image to your public folder
  );
  
  const isOutOfStock = product.stock_status === 'outofstock';

  const handleClick = () => {
    if (isOutOfStock) return;
    onSelect(product);
  };

  return (
    <button
      className={`pcb-card ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'oos' : ''}`}
      disabled={isOutOfStock}
      onClick={handleClick}
      aria-label={`Select ${product.name}`}
    >
      <div className="card-image-container">
        <img
          src={imageSrc}
          alt={product.name}
          style={{
            opacity: isLoaded ? 1 : 0.7,
            transition: 'opacity 0.3s ease',
          }}
          loading="lazy"
        />
        {!isLoaded && !isError && (
          <div className="image-loading">Loading...</div>
        )}
        {isError && (
          <div className="image-error">Image unavailable</div>
        )}
      </div>
      
      <span className="name">{product.name}</span>
      
      <span
        className="price"
        dangerouslySetInnerHTML={{ __html: product.price_html }}
      />
    </button>
  );
});

export default ProductCard;