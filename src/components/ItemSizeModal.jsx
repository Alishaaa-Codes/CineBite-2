import React, { useState } from 'react';
import { X, Plus, Minus, Scale, Check, Popcorn } from 'lucide-react';
import '../styles/item-size-modal.css';

export default function ItemSizeModal({
  isOpen,
  item,
  onClose,
  onConfirm
}) {
  if (!isOpen || !item) return null;

  const options = item.weightOptions || [
    { id: 'small', name: 'Small', weight: '90g', price: Math.round(item.price * 0.65), description: 'Single serve (90g)' },
    { id: 'medium', name: 'Medium', weight: '150g', price: Math.round(item.price * 0.85), description: 'Regular cinema tub (150g)' },
    { id: 'large', name: 'Large', weight: '250g', price: item.price, description: 'Jumbo sharing tub (250g)' }
  ];

  const [selectedSizeId, setSelectedSizeId] = useState(options[1]?.id || options[0]?.id);
  const [quantity, setQuantity] = useState(1);

  const selectedOption = options.find((o) => o.id === selectedSizeId) || options[0];
  const totalPrice = (selectedOption?.price || item.price) * quantity;

  const handleConfirm = () => {
    onConfirm(item, selectedOption, quantity);
    onClose();
  };

  return (
    <div className="item-size-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="item-size-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="item-size-header">
          <div className="item-size-header-meta">
            <div className="item-size-category-pill">
              <Scale size={13} />
              <span>Weight & Portion Selection</span>
            </div>
            <h2 className="item-size-title">{item.name}</h2>
            <p className="item-size-desc">
              Select your preferred tub size and weight prepared fresh for your seat.
            </p>
          </div>

          <button 
            type="button"
            className="item-size-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thumbnail Preview Banner */}
        <div className="item-size-item-preview">
          <img src={item.imageUrl} alt={item.name} className="item-size-thumb" />
          <div className="item-size-thumb-info">
            <span className="item-size-badge-veg">
              <span className={`diet-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                <span className="diet-dot" />
              </span>
              <span>{item.isVeg ? 'Vegetarian' : 'Non-Veg'}</span>
            </span>
            <span className="item-size-subtext">{item.description}</span>
          </div>
        </div>

        {/* Options List: Small, Medium, Large */}
        <div className="item-size-options-group">
          <label className="item-size-section-label">
            Choose Size & Weight (Grams):
          </label>

          <div className="item-size-cards-grid">
            {options.map((opt) => {
              const isSelected = opt.id === selectedSizeId;
              return (
                <div
                  key={opt.id}
                  className={`item-size-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSizeId(opt.id)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedSizeId(opt.id);
                    }
                  }}
                >
                  <div className="item-size-option-radio">
                    {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                  </div>

                  <div className="item-size-option-main">
                    <div className="item-size-name-row">
                      <span className="item-size-option-name">{opt.name}</span>
                      <span className="item-size-weight-badge">{opt.weight}</span>
                    </div>
                    <span className="item-size-option-desc">{opt.description}</span>
                  </div>

                  <div className="item-size-option-price">
                    ₹{opt.price}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quantity Controller & Add Button */}
        <div className="item-size-footer">
          <div className="item-size-qty-wrapper">
            <span className="item-size-qty-label">Quantity:</span>
            <div className="item-size-qty-controls">
              <button
                type="button"
                className="item-size-qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span className="item-size-qty-val">{quantity}</span>
              <button
                type="button"
                className="item-size-qty-btn"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                disabled={quantity >= 10}
                aria-label="Increase quantity"
                title={quantity >= 10 ? 'Maximum 10 items allowed' : 'Increase quantity'}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="item-size-submit-btn"
            onClick={handleConfirm}
          >
            <span>Add to Cart</span>
            <span className="item-size-submit-dot">•</span>
            <span className="item-size-submit-price">₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
