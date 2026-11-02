import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Footprints, 
  Sparkles, 
  X, 
  Armchair, 
  Film,
  FastForward,
  Info,
  AlertTriangle,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';

const STATUS_STEPS = [
  {
    id: 'received',
    title: 'Order Received',
    desc: 'Order sent to kitchen & acknowledged',
    icon: CheckCircle2
  },
  {
    id: 'preparing',
    title: 'Kitchen is Preparing',
    desc: 'Popcorn popping, nachos warm & drinks freshly poured',
    icon: ChefHat
  },
  {
    id: 'ready',
    title: 'On the Way to Your Seat',
    desc: 'Cinema runner is delivering the tray to your row',
    icon: Footprints
  },
  {
    id: 'delivered',
    title: 'Delivered to Seat',
    desc: 'Served directly to your seat. Enjoy your film!',
    icon: Sparkles
  }
];

export default function OrderSuccessModal({
  isOpen,
  order,
  initialView = 'confirmation',
  onClose,
  onOrderMore,
  onAdvanceStatus
}) {
  const [currentView, setCurrentView] = useState(initialView);

  // Sync view whenever modal opens or initialView changes
  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen || !order) return null;

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.id === order.status);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="tracker-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* =========================================================
            VIEW 1: ORDERED SUCCESSFULLY CONFIRMATION
           ========================================================= */}
        {currentView === 'confirmation' ? (
          <div>
            {/* Header Ribbon */}
            <div className="ticket-header-strip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  className="local-demo-badge"
                  style={order.isLocalDemo === false ? {
                    background: 'rgba(16, 185, 129, 0.15)',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    color: 'var(--veg-color)'
                  } : undefined}
                >
                  {order.isLocalDemo === false ? 'SUPABASE LIVE ORDER' : 'LOCAL DEMO ORDER'}
                </span>
                <div className="ticket-status-pill">
                  <span className="ticket-pulse-dot" />
                  <span>ORDER CONFIRMED</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="ticket-order-id">{order.orderId}</span>
                <button 
                  className="seat-modal-close-btn" 
                  onClick={onClose} 
                  style={{ width: '28px', height: '28px' }}
                  aria-label="Close ticket"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Confirmation Content */}
            <div className="confirmation-view">
              {/* Luminous Animated Success Badge */}
              <div className="confirmation-badge-glow">
                <CheckCircle2 size={44} color="#4ADE80" strokeWidth={2.4} />
              </div>

              <div>
                <h2 className="confirmation-title">🎉 Ordered Successfully!</h2>
                <p className="confirmation-subtitle">
                  Your cinema food order has been placed and transmitted to the Food Department & Kitchen.
                </p>
              </div>

              {/* Order Destination & Overview Card */}
              <div className="confirmation-card">
                <div className="confirmation-destination-banner">
                  <div className="confirmation-destination-left">
                    <Armchair size={22} color="var(--accent-orange)" />
                    <div>
                      <div className="confirmation-seat-pill">
                        Seat {order.cinemaDetails.seatNumber}
                      </div>
                      <div className="confirmation-screen-text">
                        {order.cinemaDetails.theaterName.replace('Cinema', '').trim()} • {order.cinemaDetails.screenName.split('(')[0].trim()}
                      </div>
                    </div>
                  </div>
                  <span className="ticket-status-pill" style={{ fontSize: '0.68rem', padding: '0.2rem 0.6rem' }}>
                    <span className="ticket-pulse-dot" />
                    QUEUED
                  </span>
                </div>

                {/* Items Quick Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Confirmed Snacks ({order.cart.reduce((a, b) => a + b.quantity, 0)})
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Placed at {order.placedAt}
                    </span>
                  </div>

                  {order.cart.map((ci) => (
                    <div key={ci.id} className="confirmation-item-preview">
                      <span>{ci.quantity}x {ci.name}</span>
                      <span>₹{ci.price * ci.quantity}</span>
                    </div>
                  ))}

                  {order.specialNotes && (
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-orange)', fontStyle: 'italic', marginTop: '2px' }}>
                      Note: "{order.specialNotes}"
                    </div>
                  )}
                </div>

                <div className="confirmation-total-row">
                  <span>Grand Total (incl. 5% GST)</span>
                  <span style={{ color: 'var(--accent-orange)' }}>₹{order.grandTotal}</span>
                </div>
              </div>

              {/* Primary Action: Go to Live Tracker */}
              <div className="confirmation-actions">
                <button 
                  type="button" 
                  className="confirmation-cta-btn"
                  onClick={() => setCurrentView('tracker')}
                >
                  <span>Track Food Delivery Status</span>
                  <ArrowRight size={18} />
                </button>

                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ width: '100%', padding: '0.85rem', textAlign: 'center' }}
                  onClick={onClose}
                >
                  Close Receipt
                </button>
              </div>

              <div className="ticket-tip" style={{ padding: 0, marginTop: '0.25rem' }}>
                💡 You can close this screen anytime. Tap the <strong>"Track Live"</strong> banner at the top of your screen to re-open your status tracker during the movie.
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================
             VIEW 2: LIVE FOOD DELIVERY STATUS TRACKER
             ========================================================= */
          <div>
            {/* Ticket Top Ribbon */}
            <div className="ticket-header-strip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  type="button" 
                  className="tracker-back-btn" 
                  onClick={() => setCurrentView('confirmation')}
                  title="Back to confirmation"
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>
                <div className="ticket-status-pill">
                  <span className="ticket-pulse-dot" />
                  <span>STATUS: {order.status.toUpperCase()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="ticket-order-id">{order.orderId}</span>
                <button 
                  className="seat-modal-close-btn" 
                  onClick={onClose} 
                  style={{ width: '28px', height: '28px' }}
                  aria-label="Close ticket"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="ticket-content">
              {/* Cinema Seat Destination Banner */}
              <div className="ticket-seat-display">
                <div className="ticket-seat-col">
                  <span className="ticket-seat-label">Theater</span>
                  <span className="ticket-seat-val" style={{ fontSize: '0.85rem' }}>
                    {order.cinemaDetails.theaterName.replace('Cinema', '').trim()}
                  </span>
                </div>
                <div className="ticket-seat-divider" />
                <div className="ticket-seat-col">
                  <span className="ticket-seat-label">Screen</span>
                  <span className="ticket-seat-val" style={{ fontSize: '0.95rem' }}>
                    {order.cinemaDetails.screenName.split('(')[0].trim()}
                  </span>
                </div>
                <div className="ticket-seat-divider" />
                <div className="ticket-seat-col">
                  <span className="ticket-seat-label">Seat</span>
                  <span className="ticket-seat-val" style={{ color: 'var(--accent-orange)' }}>
                    {order.cinemaDetails.seatNumber}
                  </span>
                </div>
              </div>

              {/* Live Progress Stepper (Delivery Tracker) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Delivery Status Tracker
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Auto-updates in real-time
                  </span>
                </div>

                <div className="stepper-container">
                  {STATUS_STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx < currentStepIndex || order.status === 'delivered';
                    const isActive = idx === currentStepIndex && order.status !== 'delivered';

                    return (
                      <div 
                        key={step.id} 
                        className={`stepper-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                      >
                        <div className="stepper-icon-box">
                          <StepIcon size={16} />
                        </div>
                        <div className="stepper-text">
                          <span className="stepper-title">{step.title}</span>
                          <span className="stepper-desc">{step.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic ETA Box based on current status */}
              <div className="eta-box">
                <Clock size={22} className="eta-icon" />
                <div>
                  <h4 className="eta-title">
                    {order.status === 'delivered'
                      ? 'Delivered to Seat!'
                      : order.status === 'ready'
                      ? 'Runner On The Way (~1-2 Mins)'
                      : order.status === 'preparing'
                      ? 'Kitchen Cooking & Prepping (~6-8 Mins)'
                      : 'Estimated Delivery in ~10-12 Mins'}
                  </h4>
                  <p className="eta-desc">
                    {order.status === 'delivered'
                      ? 'Your cinema bites have been served directly to your seat. Enjoy the movie!'
                      : order.status === 'ready'
                      ? 'Cinema runner is walking down the auditorium aisle to your seat.'
                      : order.status === 'preparing'
                      ? 'Chefs are popping fresh popcorn, assembling nachos, and pouring drinks.'
                      : 'Kitchen received your ticket and will begin preparation shortly.'}
                  </p>
                </div>
              </div>

              {/* Demo / Simulation Controls */}
              <div className="simulator-bar">
                <div>
                  <span className="simulator-label">Test Mode Simulator</span>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', margin: 0 }}>
                    Test status changes manually or via Kitchen Dashboard
                  </p>
                </div>
                <button 
                  type="button" 
                  className="simulator-btn"
                  onClick={onAdvanceStatus}
                >
                  <FastForward size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {order.status === 'delivered' ? 'Restart Status' : 'Next Status ⏩'}
                </button>
              </div>

              {/* Order Items Breakdown */}
              <div className="ticket-order-items">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Confirmed Items ({order.cart.reduce((a, b) => a + b.quantity, 0)})
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {order.placedAt}
                  </span>
                </div>

                {order.cart.map((ci) => (
                  <div key={ci.id} className="ticket-item-row">
                    <span>{ci.quantity}x {ci.name}</span>
                    <span>₹{ci.price * ci.quantity}</span>
                  </div>
                ))}

                {order.specialNotes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-orange)', fontStyle: 'italic', marginTop: '4px' }}>
                    Note: "{order.specialNotes}"
                  </div>
                )}

                <div className="ticket-item-row total-row">
                  <span>Total Bill (incl. 5% GST)</span>
                  <span>₹{order.grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="ticket-footer">
              <button 
                type="button" 
                className="btn-primary" 
                style={{ width: '100%', padding: '0.85rem' }}
                onClick={onClose}
              >
                Close Receipt
              </button>
            </div>

            <div className="ticket-tip">
              💡 You can close this screen anytime. Tap the <strong>"Track Live"</strong> bar at the top of your screen to re-open your live status tracker.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
