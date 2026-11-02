import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function FloatingCartBar({ cart, onOpenCart }) {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const gst = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + gst;

  if (totalItems === 0) return null;

  return (
    <div className="floating-cart-bar" onClick={onOpenCart}>
      <div className="floating-cart-left">
        <div className="floating-cart-count-pill">
          {totalItems}
        </div>
        <div className="floating-cart-details">
          <span className="floating-cart-label">Cart Total</span>
          <span className="floating-cart-total">₹{grandTotal}</span>
        </div>
      </div>

      <button className="floating-cart-cta-btn" onClick={onOpenCart}>
        <span>View Order</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
