import React from 'react';
import { Popcorn, ShoppingBag, Edit3 } from 'lucide-react';

export default function Header({ 
  cinemaDetails, 
  onOpenSeatModal, 
  onOpenCart, 
  totalCartItems 
}) {
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
            <span className="brand-tagline">In-Seat Cinema Dining</span>
          </div>
        </div>

        {/* Seat / Screen Pill */}
        <button 
          className="header-seat-pill" 
          onClick={onOpenSeatModal}
          title="Click to change your seat or screen"
        >
          <span className="seat-live-dot" />
          <div className="seat-info-text">
            <span className="seat-label">Delivering to</span>
            <span className="seat-value">
              {cinemaDetails.screenName ? cinemaDetails.screenName.split('(')[0].trim() : 'Screen'} • Seat {cinemaDetails.seatNumber || 'Not Set'}
            </span>
          </div>
          <div className="edit-seat-btn">
            <Edit3 size={13} />
          </div>
        </button>

        {/* Header Right Actions */}
        <div className="header-actions">
          <button className="desktop-cart-btn" onClick={onOpenCart}>
            <ShoppingBag size={18} />
            <span>Cart</span>
            {totalCartItems > 0 && (
              <span className="cart-count-badge">{totalCartItems}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
