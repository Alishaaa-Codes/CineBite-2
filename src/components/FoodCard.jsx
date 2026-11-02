import React, { useState } from 'react';
import { Plus, Minus, Scale } from 'lucide-react';

export default function FoodCard({ 
  item, 
  cartQuantity, 
  onAddToCart, 
  onUpdateQuantity,
  onOpenSizeModal 
}) {
  const [imgError, setImgError] = useState(false);

  // Fallback image gradient placeholder
  const fallbackImg = `https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=700&q=80`;

  const hasWeightSpec = Boolean(item.hasWeightOptions || item.categoryId === 'popcorn');
  
  const minPrice = hasWeightSpec && item.weightOptions?.length 
    ? Math.min(...item.weightOptions.map((o) => o.price)) 
    : item.price;

  const handleAddClick = () => {
    if (hasWeightSpec && onOpenSizeModal) {
      onOpenSizeModal(item);
    } else {
      onAddToCart(item);
    }
  };

  const isOutOfStock = Boolean(item.isOutOfStock);

  return (
    <article className={`food-card fade-in ${isOutOfStock ? 'is-out-of-stock' : ''}`}>
      <div className="food-card-image-box">
        <img
          src={imgError ? fallbackImg : item.imageUrl}
          alt={item.name}
          className={`food-card-img ${isOutOfStock ? 'out-of-stock-img' : ''}`}
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="food-card-overlay" />

        {/* Out of Stock Overlay Banner */}
        {isOutOfStock && (
          <div className="food-card-sold-out-overlay">
            <span className="food-card-sold-out-pill">OUT OF STOCK</span>
          </div>
        )}

        {/* Top Badges: Veg/Non-veg & Tag */}
        <div className="food-card-badges">
          <div className={`diet-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
            <span className="diet-dot" />
          </div>
          {item.tag && !isOutOfStock && <span className="item-tag-badge">{item.tag}</span>}
        </div>

        {/* Portion / Weight Options badge */}
        {!isOutOfStock && (
          hasWeightSpec ? (
            <span className="item-portion-badge weight-pill">
              <Scale size={11} style={{ marginRight: '3px' }} />
              S • M • L (Weights)
            </span>
          ) : item.portion ? (
            <span className="item-portion-badge">{item.portion}</span>
          ) : null
        )}
      </div>

      <div className="food-card-body">
        <h3 className="food-card-name">{item.name}</h3>
        <p className="food-card-desc">{item.description}</p>

        <div className="food-card-footer">
          <div className="food-price-box">
            <span className="food-price-currency">
              {hasWeightSpec ? 'Starts at' : 'Price'}
            </span>
            <span className="food-price-amount">₹{minPrice}</span>
          </div>

          {/* If out of stock, show disabled Sold Out button */}
          {isOutOfStock ? (
            <button 
              className="add-btn out-of-stock-disabled-btn" 
              disabled 
              aria-disabled="true"
              title="This item is currently sold out in the cinema kitchen"
            >
              <span className="add-btn-text">SOLD OUT</span>
            </button>
          ) : hasWeightSpec || cartQuantity === 0 ? (
            <button
              className="add-btn yellow-pop"
              onClick={handleAddClick}
              aria-label={`Add ${item.name} to cart`}
              title={hasWeightSpec ? 'Choose Small, Medium, or Large portion' : 'Add to cart'}
            >
              <span className="add-btn-text">+ADD</span>
              {hasWeightSpec && cartQuantity > 0 && (
                <span className="add-btn-cart-badge">{cartQuantity}</span>
              )}
            </button>
          ) : (
            <div className="card-qty-controller">
              <button
                className="card-qty-btn"
                onClick={() => onUpdateQuantity(item.id, cartQuantity - 1)}
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="card-qty-value">{cartQuantity}</span>
              <button
                className="card-qty-btn"
                onClick={() => onUpdateQuantity(item.id, cartQuantity + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
