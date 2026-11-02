import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Film, 
  Armchair, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  cinemaDetails,
  onOpenSeatModal,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder
}) {
  if (!isOpen) return null;

  // Drawer flow step: 'cart' -> 'summary'
  const [step, setStep] = useState('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Validation & in-flight submission state
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const gst = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + gst;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Validate all required order fields
  const validateOrder = () => {
    // 1. Cart contains at least 1 item
    if (!cart || cart.length === 0) {
      return {
        field: 'cart',
        title: 'Empty Cart',
        desc: 'Your cart contains 0 items. Please add at least one cinema snack to place an order.'
      };
    }

    // 2. Valid Theatre name
    if (!cinemaDetails.theaterName || !cinemaDetails.theaterName.trim()) {
      return {
        field: 'theater',
        title: 'Missing Cinema Theatre',
        desc: 'Theatre information is missing. Please confirm your cinema location.'
      };
    }

    // 3. Valid Screen name
    if (!cinemaDetails.screenName || !cinemaDetails.screenName.trim()) {
      return {
        field: 'screen',
        title: 'Missing Screen Details',
        desc: 'Please select a valid Screen / Auditorium so staff knows which hall you are in.'
      };
    }

    // 4. Valid Seat details
    const seat = cinemaDetails.seatNumber ? cinemaDetails.seatNumber.trim() : '';
    if (!seat || seat.length < 2) {
      return {
        field: 'seat',
        title: 'Valid Seat Required',
        desc: 'Please enter a valid seat number (e.g. F-14 or E-12) so cinema runners can deliver to your seat.'
      };
    }

    return null; // Valid
  };

  // Step 1 -> Step 2: Proceed to Order Summary
  const handleProceedToSummary = () => {
    const error = validateOrder();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setStep('summary');
  };

  // Step 2 -> Final Submission: Prevent duplicate submissions and submit
  const handleConfirmOrder = async (e) => {
    if (e) e.preventDefault();

    // Prevent duplicate submissions if already in-flight
    if (isSubmitting) return;

    // Validate once more before submission
    const error = validateOrder();
    if (error) {
      setValidationError(error);
      setStep('cart');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      // Simulate realistic async network processing time (1s) to prevent double clicks
      await new Promise((resolve) => setTimeout(resolve, 950));

      await onPlaceOrder({
        cart,
        subtotal,
        gst,
        grandTotal,
        customerName: customerName.trim() || 'Moviegoer',
        customerPhone: customerPhone.trim(),
        specialNotes: specialNotes.trim(),
        cinemaDetails
      });

      // Reset step for next time
      setStep('cart');
    } catch (err) {
      setValidationError({
        field: 'submission',
        title: 'Order Processing Failed',
        desc: err.message || 'An unexpected error occurred while placing your order.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="cart-backdrop" 
        onClick={() => {
          if (!isSubmitting) onClose();
        }} 
      />

      {/* Slide-over Drawer / Bottom Sheet */}
      <div className="cart-drawer" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-title-box">
            {step === 'summary' ? (
              <button 
                type="button"
                className="cart-seat-change-btn" 
                onClick={() => setStep('cart')}
                disabled={isSubmitting}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <ShoppingBag size={20} color="var(--red-primary)" />
            )}
            
            <h2 className="cart-header-title">
              {step === 'summary' ? 'Order Summary' : 'Cinema In-Seat Cart'}
            </h2>

            {totalItemsCount > 0 && step === 'cart' && (
              <span className="cart-count-badge">{totalItemsCount}</span>
            )}
          </div>

          <button 
            className="cart-header-close-btn" 
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close Cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Validation Error Alert Banner */}
        {validationError && (
          <div className="validation-error-box" role="alert">
            <AlertCircle size={18} className="validation-error-icon" />
            <div className="validation-error-content">
              <span className="validation-error-title">{validationError.title}</span>
              <span className="validation-error-desc">{validationError.desc}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setValidationError(null)}
              style={{ color: '#FFAEB3', padding: '2px' }}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {cart.length === 0 ? (
          /* Empty State */
          <div className="cart-empty-view">
            <div className="cart-empty-icon-circle">
              <ShoppingBag size={32} />
            </div>
            <h3 className="cart-empty-title">Your Cart is Empty</h3>
            <p className="cart-empty-desc">
              Enhance your movie experience! Add gourmet popcorn, nachos, or chilled drinks.
            </p>
            <button className="explore-menu-btn" onClick={onClose}>
              Browse Menu
            </button>
          </div>
        ) : step === 'cart' ? (
          /* STEP 1: CART ITEMS & EDITING */
          <>
            {/* Seat Target Confirmation Banner */}
            <div className="cart-seat-target-card">
              <div className="cart-seat-target-info">
                <span className="cart-seat-target-label">
                  <Armchair size={12} />
                  Delivery Destination
                </span>
                <span className="cart-seat-target-val">
                  {cinemaDetails.screenName.split('(')[0].trim()} • Seat {cinemaDetails.seatNumber || '(Not Set)'}
                </span>
              </div>
              <button 
                type="button" 
                className="cart-seat-change-btn"
                onClick={onOpenSeatModal}
              >
                Change Seat
              </button>
            </div>

            {/* Scrollable Cart Items List */}
            <div className="cart-body">
              {cart.map((cartItem) => (
                <div key={cartItem.id} className="cart-item-row">
                  <div className="cart-item-details">
                    <img 
                      src={cartItem.imageUrl} 
                      alt={cartItem.name} 
                      className="cart-item-img" 
                    />
                    <div className="cart-item-info">
                      <span className="cart-item-name">{cartItem.name}</span>
                      <span className="cart-item-unit-price">
                        ₹{cartItem.price} each {cartItem.portion ? `• ${cartItem.portion}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="cart-row-qty-box">
                      <button
                        className="cart-row-qty-btn"
                        onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="cart-row-qty-val">{cartItem.quantity}</span>
                      <button
                        className="cart-row-qty-btn"
                        onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="cart-item-total">
                      ₹{cartItem.price * cartItem.quantity}
                    </div>

                    <button
                      className="cart-item-remove-btn"
                      onClick={() => onRemoveItem(cartItem.id)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Special Cooking & Delivery Instructions */}
              <div className="special-notes-box">
                <label className="special-notes-label">
                  Special Instructions (Optional)
                </label>
                <textarea
                  className="special-notes-input"
                  placeholder="e.g. Extra napkins, no ice in Coke, extra melted butter..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  maxLength={140}
                />
              </div>

              {/* Optional Contact Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  className="seat-form-input"
                  style={{ fontSize: '0.8rem', padding: '0.6rem 0.8rem' }}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Phone (for status)"
                  className="seat-form-input"
                  style={{ fontSize: '0.8rem', padding: '0.6rem 0.8rem' }}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              {/* Itemized Bill Breakdown */}
              <div className="bill-breakdown-card">
                <div className="bill-line">
                  <span>Items Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="bill-line">
                  <span>Restaurant GST & Taxes (5%)</span>
                  <span>₹{gst}</span>
                </div>
                <div className="bill-line free-badge">
                  <span>In-Seat Delivery Service</span>
                  <span>FREE</span>
                </div>
                <div className="bill-divider" />
                <div className="bill-line total-line">
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Cart Footer / Proceed to Summary Action */}
            <div className="cart-footer">
              <button 
                type="button" 
                className="place-order-cta-btn"
                onClick={handleProceedToSummary}
              >
                <span>Review Order Summary</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>₹{grandTotal}</span>
                  <ArrowRight size={18} />
                </span>
              </button>
              <div className="place-order-subtext">
                <Sparkles size={12} color="var(--accent-orange)" />
                <span>Next: Review destination seat & snacks before placing</span>
              </div>
            </div>
          </>
        ) : (
          /* STEP 2: ORDER SUMMARY BEFORE SUBMISSION */
          <>
            <div className="cart-body">
              {/* Cinema In-Seat Dining Assurance */}
              <div className="local-demo-banner" style={{ background: 'rgba(255, 183, 3, 0.08)', borderColor: 'rgba(255, 183, 3, 0.3)' }}>
                <CheckCircle2 size={18} color="#FFB703" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ color: '#E2E8F0' }}>
                  <strong style={{ color: '#FFB703' }}>In-Seat Cinema Dining:</strong> Your order is transmitted directly to the cinema kitchen and will be delivered hot and fresh to your seat during showtime.
                </p>
              </div>

              {/* Delivery Destination Review */}
              <div className="summary-destination-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--red-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1. Delivery Destination
                  </span>
                  <button 
                    type="button" 
                    className="cart-seat-change-btn" 
                    onClick={onOpenSeatModal}
                    disabled={isSubmitting}
                  >
                    Edit Seat
                  </button>
                </div>

                <div className="summary-destination-row">
                  <span className="label">Cinema</span>
                  <span className="value">{cinemaDetails.theaterName}</span>
                </div>
                <div className="summary-destination-row">
                  <span className="label">Screen / Audi</span>
                  <span className="value">{cinemaDetails.screenName}</span>
                </div>
                <div className="summary-destination-row">
                  <span className="label">Seat Number</span>
                  <span className="value highlight">Seat {cinemaDetails.seatNumber}</span>
                </div>
              </div>

              {/* Order Items Breakdown */}
              <div className="summary-items-box">
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  2. Items Summary ({totalItemsCount})
                </span>
                {cart.map((item) => (
                  <div key={item.id} className="summary-item-line">
                    <span className="item-name">
                      {item.quantity}x {item.name}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                {specialNotes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-orange)', fontStyle: 'italic', marginTop: '4px' }}>
                    Note: "{specialNotes}"
                  </div>
                )}
              </div>

              {/* Bill Details Summary */}
              <div className="bill-breakdown-card">
                <div className="bill-line">
                  <span>Items Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="bill-line">
                  <span>Restaurant GST (5%)</span>
                  <span>₹{gst}</span>
                </div>
                <div className="bill-line free-badge">
                  <span>In-Seat Delivery Service</span>
                  <span>FREE</span>
                </div>
                <div className="bill-divider" />
                <div className="bill-line total-line">
                  <span>Total Amount Due</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Final Submission Action with Duplicate Submission Prevention */}
            <div className="cart-footer">
              <button 
                type="button" 
                className={`place-order-cta-btn ${isSubmitting ? 'btn-disabled' : ''}`}
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                    <Loader2 size={18} className="spin-icon" />
                    <span>Placing Order with Kitchen...</span>
                  </span>
                ) : (
                  <>
                    <span>Order My Food</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>₹{grandTotal}</span>
                      <CheckCircle size={18} />
                    </span>
                  </>
                )}
              </button>

              <div className="place-order-subtext">
                <Info size={12} color="var(--accent-orange)" />
                <span>
                  {isSupabaseConfigured 
                    ? 'Server-side verified pricing & instant kitchen delivery' 
                    : 'Simulates order placement & generates ticket receipt'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
