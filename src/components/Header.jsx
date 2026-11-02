import React from 'react';
import { Popcorn, ShoppingBag, MapPin } from 'lucide-react';

export default function Header({ 
  cinemaDetails, 
  onOpenSeatModal, 
  onOpenCart, 
  totalCartItems 
}) {
  const screenLabel = cinemaDetails?.screenName 
    ? cinemaDetails.screenName.split('(')[0].trim() 
    : 'Screen 2';
  const seatLabel = cinemaDetails?.seatNumber || 'F-14';

  return (
    <header className="cinema-header">
      <div className="cinema-header-top-ribbon"></div>
      <div className="cinema-header-content">
        {/* Brand / Logo */}
        <div className="brand-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="brand-icon-wrapper">
            <Popcorn size={22} />
          </div>
          <div className="brand-text-group">
            <h1 className="brand-name">
              Cine<span>Bite</span>
            </h1>
            <div className="brand-location-tag" onClick={onOpenSeatModal} title="In-Seat Delivery Details">
              <span className="seat-live-dot" />
              <span>{screenLabel} • Seat {seatLabel}</span>
            </div>
          </div>
        </div>

        {/* Primary Cart Action Button (Directly Accessible on Mobile & Desktop) */}
        <div className="header-actions">
          <button 
            type="button"
            className="header-cart-btn" 
            onClick={onOpenCart}
            aria-label="View shopping cart"
          >
            <div className="cart-icon-wrapper">
              <ShoppingBag size={18} />
              {totalCartItems > 0 && (
                <span className="cart-count-badge">{totalCartItems}</span>
              )}
            </div>
            <span className="header-cart-label">Cart</span>
          </button>
        </div>
      </div>
    </header>
  );
}
