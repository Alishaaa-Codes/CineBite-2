import React from 'react';
import { Popcorn, ShoppingBag, MapPin, QrCode } from 'lucide-react';

export default function Header({ 
  cinemaDetails, 
  onOpenSeatModal, 
  onOpenCart, 
  totalCartItems,
  onOpenKitchen,
  onOpenQRModal
}) {
  const screenLabel = cinemaDetails?.screenName 
    ? cinemaDetails.screenName.split('(')[0].trim() 
    : 'Screen 2';
  const seatLabel = cinemaDetails?.seatNumber 
    ? `Seat ${cinemaDetails.seatNumber}` 
    : 'Select Seat';

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
            <div className="brand-location-tag" onClick={onOpenSeatModal} title={`${cinemaDetails?.theaterName || 'Cinema'} • In-Seat Delivery Details`}>
              <span className="seat-live-dot" />
              <span>{cinemaDetails?.theaterName ? `${cinemaDetails.theaterName.split(' ')[0]} • ` : ''}{screenLabel} • {seatLabel}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: QR Standee, Kitchen Portal & Shopping Cart */}
        <div className="header-actions">
          {onOpenQRModal && (
            <button 
              type="button"
              className="header-qr-btn"
              onClick={onOpenQRModal}
              title="Open Cinema QR Code Standee & Scanner"
              style={{
                background: 'rgba(229, 9, 20, 0.12)',
                border: '1px solid rgba(229, 9, 20, 0.45)',
                color: '#FF4D4D',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <QrCode size={14} />
              <span>QR Code</span>
            </button>
          )}

          {onOpenKitchen && (
            <button 
              type="button"
              className="header-kitchen-btn"
              onClick={onOpenKitchen}
              title="Open Live Kitchen Dashboard (Food Department)"
              style={{
                background: 'rgba(255, 159, 28, 0.12)',
                border: '1px solid rgba(255, 159, 28, 0.4)',
                color: 'var(--text-orange)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🍳</span>
              <span>Kitchen</span>
            </button>
          )}

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
