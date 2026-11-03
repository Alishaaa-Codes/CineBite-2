import React from 'react';
import { 
  X, 
  Printer, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ChefHat, 
  Send,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function OrderDetailModal({ 
  order, 
  onClose, 
  onUpdateStatus, 
  isUpdating 
}) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return <span style={{ color: '#FF4D4D', fontWeight: 800 }}>● NEW / RECEIVED</span>;
      case 'preparing':
        return <span style={{ color: 'var(--text-orange)', fontWeight: 800 }}>🍳 IN PREPARATION</span>;
      case 'ready':
        return <span style={{ color: '#4ADE80', fontWeight: 800 }}>🔔 READY FOR RUNNER</span>;
      case 'delivered':
        return <span style={{ color: '#94A3B8', fontWeight: 700 }}>✓ DELIVERED TO SEAT</span>;
      case 'cancelled':
        return <span style={{ color: '#EF4444', fontWeight: 700 }}>✕ CANCELLED</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="kitchen-modal-backdrop" onClick={onClose}>
      <div className="kitchen-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="kitchen-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-orange)' }}>
                {order.order_number}
              </span>
              <span style={{ fontSize: '0.8rem' }}>{getStatusBadge(order.status)}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Placed at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="kitchen-btn-icon" 
              onClick={handlePrint}
              title="Print Kitchen Slip"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button 
              className="kitchen-btn-icon" 
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="kitchen-modal-body">
          {/* Cinema Screen & Seat Banner */}
          <div className="ticket-screen-banner">
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cinema Location
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                {order.screen_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {order.theatre_name}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Assigned Seat
              </span>
              <div style={{ 
                fontSize: '1.4rem', 
                fontWeight: 900, 
                color: 'var(--gold-primary)',
                fontFamily: 'var(--font-heading)'
              }}>
                {order.seat_code}
              </div>
            </div>
          </div>

          {/* Customer Metadata */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '10px',
            background: 'var(--bg-tertiary)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.82rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Customer</span>
              <strong style={{ color: 'var(--text-primary)' }}>{order.customer_name || 'Moviegoer'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Phone</span>
              <span style={{ color: 'var(--text-secondary)' }}>{order.customer_phone || 'None provided'}</span>
            </div>
          </div>

          {/* Special Kitchen Notes */}
          {order.special_notes && (
            <div className="special-notes-alert" style={{ marginBottom: '1.25rem' }}>
              <FileText size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Special Kitchen Instruction:</strong>
                <div>{order.special_notes}</div>
              </div>
            </div>
          )}

          {/* Order Items Table */}
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px',
            color: 'var(--text-secondary)'
          }}>
            Kitchen Preparation Items
          </span>

          <table className="ticket-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Qty</th>
                <th>Item Description</th>
                <th style={{ textAlign: 'right', width: '80px' }}>Unit</th>
                <th style={{ textAlign: 'right', width: '80px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>
                    <span className="item-qty-tag">{item.quantity}x</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.item_name}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                    ₹{Number(item.unit_price).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-orange)' }}>
                    ₹{Number(item.total_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Breakdown */}
          <div className="ticket-totals-box">
            <div className="ticket-total-row">
              <span>Item Subtotal</span>
              <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="ticket-total-row">
              <span>Cinema GST (5%)</span>
              <span>₹{Number(order.tax_amount || 0).toFixed(2)}</span>
            </div>
            <div className="ticket-total-row grand">
              <span>Grand Total</span>
              <span>₹{Number(order.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="modal-actions-footer">
          {order.status === 'received' && (
            <button
              className="btn-status-next to-preparing"
              onClick={() => onUpdateStatus(order.id, 'preparing', order.order_number)}
              disabled={isUpdating}
            >
              <ChefHat size={16} />
              <span>Start Preparing Order</span>
            </button>
          )}

          {order.status === 'preparing' && (
            <button
              className="btn-status-next to-ready"
              onClick={() => onUpdateStatus(order.id, 'ready', order.order_number)}
              disabled={isUpdating}
            >
              <CheckCircle2 size={16} />
              <span>Mark Order Ready for Runner</span>
            </button>
          )}

          {order.status === 'ready' && (
            <button
              className="btn-status-next to-delivered"
              onClick={() => onUpdateStatus(order.id, 'delivered', order.order_number)}
              disabled={isUpdating}
            >
              <Send size={16} />
              <span>Confirm Delivered to Seat</span>
            </button>
          )}

          {order.status === 'delivered' && (
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', color: '#4ADE80', fontWeight: 700 }}>
              ✓ This order has been completed and delivered
            </div>
          )}

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'cancelled', order.order_number)}
              disabled={isUpdating}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
