import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Clock, 
  Search, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  ExternalLink, 
  LogOut, 
  Bell, 
  FileText, 
  AlertCircle,
  Eye,
  Check,
  TrendingUp,
  Trophy,
  Flame,
  Menu,
  X,
  PlusCircle,
  PackageX
} from 'lucide-react';
import { 
  fetchStaffOrders, 
  updateOrderStatus, 
  subscribeToKitchenOrders, 
  signOutStaff 
} from '../../lib/supabase';
import { kitchenAudio } from '../../lib/audioAlert';
import OrderDetailModal from './OrderDetailModal';
import AddItemModal from './AddItemModal';
import ManageStockModal from './ManageStockModal';

export default function KitchenDashboard({ 
  staffUser, 
  staffProfile, 
  isDemoMode, 
  onLogout, 
  onSwitchToCustomer,
  menuItems = [],
  onAddItem,
  onToggleStock
}) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMuted, setIsMuted] = useState(kitchenAudio.isMuted);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'received' | 'preparing' | 'ready' | 'delivered'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScreen, setSelectedScreen] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [checkedItems, setCheckedItems] = useState({}); // { `${orderId}-${itemIdx}`: boolean }
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const outOfStockCount = useMemo(() => {
    return (menuItems || []).filter(i => i.isOutOfStock).length;
  }, [menuItems]);

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Initial Orders
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchStaffOrders(isDemoMode);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time Supabase / Local Orders Subscription
  useEffect(() => {
    const unsubscribe = subscribeToKitchenOrders({
      isDemo: isDemoMode,
      onInsert: (newOrder) => {
        // Play cinema kitchen chime!
        kitchenAudio.playNewOrderChime();

        // Show banner alert for 5 seconds
        setNewOrderAlert(newOrder.order_number || 'New Order');
        setTimeout(() => setNewOrderAlert(null), 5000);

        // Prepend to orders list
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === newOrder.id);
          if (exists) return prev;
          return [newOrder, ...prev];
        });
      },
      onUpdate: (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
        );
        setSelectedOrder((prev) =>
          prev && prev.id === updatedOrder.id ? { ...prev, ...updatedOrder } : prev
        );
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isDemoMode]);

  // Handle Sound Toggle
  const handleToggleSound = () => {
    const nextMuted = kitchenAudio.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      kitchenAudio.playStatusChangeChime();
    }
  };

  // Handle Order Status Transitions
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setIsUpdatingId(orderId);
      const updated = await updateOrderStatus(orderId, newStatus, isDemoMode);
      kitchenAudio.playStatusChangeChime();

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Toggle item packing checklist
  const handleToggleItemCheck = (orderId, itemIdx) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate Elapsed Time
  const getElapsedTimeText = (isoDate) => {
    const diffMs = currentTime - new Date(isoDate);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  // KPI Calculations
  const counts = useMemo(() => {
    return {
      all: orders.length,
      received: orders.filter((o) => o.status === 'received').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      delivered: orders.filter((o) => o.status === 'delivered').length
    };
  }, [orders]);

  // 1. Total Sales & Financial Metrics
  const salesStats = useMemo(() => {
    let total = 0;
    let delivered = 0;
    orders.forEach((o) => {
      const amount = Number(o.total_amount || 0);
      total += amount;
      if (o.status === 'delivered') {
        delivered += amount;
      }
    });

    const averageOrderValue = orders.length > 0 ? Math.round(total / orders.length) : 0;

    return {
      totalSales: Math.round(total),
      deliveredSales: Math.round(delivered),
      averageOrderValue,
      totalOrdersCount: orders.length
    };
  }, [orders]);

  // 2. Most Popular Items Calculation
  const popularItems = useMemo(() => {
    const itemMap = new Map();

    orders.forEach((order) => {
      if (Array.isArray(order.order_items)) {
        order.order_items.forEach((item) => {
          const name = item.item_name || item.name || 'Snack Item';
          const qty = Number(item.quantity || 1);
          const price = Number(item.unit_price || item.price || 0);
          const current = itemMap.get(name) || { name, quantity: 0, revenue: 0 };
          current.quantity += qty;
          current.revenue += qty * price;
          itemMap.set(name, current);
        });
      } else if (Array.isArray(order.cart)) {
        order.cart.forEach((item) => {
          const name = item.name || 'Snack Item';
          const qty = Number(item.quantity || 1);
          const price = Number(item.price || 0);
          const current = itemMap.get(name) || { name, quantity: 0, revenue: 0 };
          current.quantity += qty;
          current.revenue += qty * price;
          itemMap.set(name, current);
        });
      }
    });

    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const mostPopularItem = popularItems[0] || null;

  // Unique screens for dropdown filter
  const screenOptions = useMemo(() => {
    const screens = new Set(orders.map((o) => o.screen_name).filter(Boolean));
    return Array.from(screens);
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab = activeTab === 'all' || order.status === activeTab;
      const matchesScreen = selectedScreen === 'all' || order.screen_name === selectedScreen;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.order_number?.toLowerCase().includes(q) ||
        order.seat_code?.toLowerCase().includes(q) ||
        order.screen_name?.toLowerCase().includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.order_items?.some((i) => i.item_name?.toLowerCase().includes(q));

      return matchesTab && matchesScreen && matchesSearch;
    });
  }, [orders, activeTab, selectedScreen, searchQuery]);

  return (
    <div className="kitchen-portal-wrapper">
      {/* 1. Header */}
      <header className="kitchen-header">
        <div className="kitchen-header-top">
          <div className="kitchen-brand-area">
            {/* Mobile Sidebar Toggle Button */}
            <button 
              className="kitchen-sidebar-toggle"
              onClick={() => setIsSidebarOpen(prev => !prev)}
              title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar & Analytics'}
              aria-label="Toggle Dashboard Sidebar"
            >
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="kitchen-logo-badge">
              <ChefHat size={20} />
            </div>
            <div className="kitchen-title-box">
              <h1>
                Cine<span>Bite</span> Kitchen Feed
              </h1>
              <p>Food Department Live In-Seat Fulfillment</p>
            </div>
          </div>

          <div className="kitchen-header-actions">
            <div className="kitchen-live-pill">
              <span className="kitchen-live-dot" />
              <span>LIVE</span>
            </div>

            <div className="kitchen-clock">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            <button 
              className="kitchen-btn-icon" 
              onClick={handleToggleSound}
              title={isMuted ? 'Unmute Audio Chime' : 'Mute Audio Chime'}
            >
              {isMuted ? <VolumeX size={15} color="#EF4444" /> : <Volume2 size={15} color="#4ADE80" />}
              <span>{isMuted ? 'Muted' : 'Sound On'}</span>
            </button>

            <button 
              className="kitchen-btn-icon" 
              onClick={loadOrders}
              title="Refresh Orders"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>

            {/* + Add New Item Button */}
            <button 
              className="kitchen-btn-icon kitchen-add-item-btn"
              onClick={() => setIsAddItemModalOpen(true)}
              title="Add a new food item to the cinema menu"
              style={{
                background: 'linear-gradient(135deg, #FF9F1C, #FFB703)',
                color: '#0A0C14',
                border: 'none',
                fontWeight: 800
              }}
            >
              <PlusCircle size={15} />
              <span>+ Add Item</span>
            </button>

            {/* Out of Stock Button */}
            <button 
              className={`kitchen-btn-icon kitchen-stock-btn ${outOfStockCount > 0 ? 'has-out-stock' : ''}`}
              onClick={() => setIsStockModalOpen(true)}
              title="Manage menu item availability (mark Out of Stock or In Stock)"
              style={{
                background: outOfStockCount > 0 ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-tertiary)',
                border: outOfStockCount > 0 ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-color)',
                color: outOfStockCount > 0 ? '#F87171' : 'var(--text-secondary)'
              }}
            >
              <PackageX size={15} />
              <span>Out of Stock</span>
              {outOfStockCount > 0 && (
                <span className="stock-count-bubble">{outOfStockCount}</span>
              )}
            </button>

            <button 
              className="kitchen-btn-icon kitchen-switch-btn"
              onClick={onSwitchToCustomer}
              title="Switch to customer ordering menu"
            >
              <ExternalLink size={14} />
              <span>Customer View</span>
            </button>

            <button 
              className="kitchen-btn-icon"
              onClick={async () => {
                await signOutStaff();
                onLogout();
              }}
              title="Log out of staff portal"
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* New Order Notification Banner (Dark Cinema Palette) */}
        {newOrderAlert && (
          <div style={{
            background: '#121520',
            borderBottom: '1px solid rgba(255, 159, 28, 0.4)',
            color: '#FFB703',
            padding: '8px 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} color="#FF9F1C" />
              <span>🔔 NEW ORDER: {newOrderAlert} ARRIVED IN KITCHEN</span>
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--text-secondary)' }}>Check Screen & Seat below</span>
          </div>
        )}
      </header>

      {/* 2. Responsive Workspace Layout (Sidebar + Main Order Feed) */}
      <div className="kitchen-workspace-layout">
        {/* Mobile Backdrop */}
        <div 
          className={`sidebar-mobile-backdrop ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Dedicated Kitchen Sidebar */}
        <aside className={`kitchen-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          {/* A. Financial Overview: Total Sales */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>Financial Overview</span>
              <TrendingUp size={14} color="var(--text-orange)" />
            </div>
            <div className="sidebar-sales-card">
              <span className="sidebar-sales-label">
                <TrendingUp size={14} /> Total Sales
              </span>
              <div className="sidebar-sales-amount">
                ₹{salesStats.totalSales.toLocaleString('en-IN')}
              </div>
              <div className="sidebar-sales-grid">
                <div className="sidebar-sales-stat">
                  <span className="sidebar-sales-stat-label">Delivered</span>
                  <span className="sidebar-sales-stat-val">
                    ₹{salesStats.deliveredSales.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="sidebar-sales-stat">
                  <span className="sidebar-sales-stat-label">Avg Ticket</span>
                  <span className="sidebar-sales-stat-val">
                    ₹{salesStats.averageOrderValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* B. Most Popular Item & Snack Leaderboard */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>Top Selling Snack</span>
              <Flame size={14} color="#E50914" />
            </div>
            
            <div className="sidebar-popular-card">
              {mostPopularItem ? (
                <>
                  <div className="sidebar-popular-champion">
                    <div className="sidebar-popular-crown-tag">
                      <Trophy size={12} /> #1 Most Popular
                    </div>
                    <h4 className="sidebar-popular-name">{mostPopularItem.name}</h4>
                    <div className="sidebar-popular-stats">
                      <span>{mostPopularItem.quantity} units ordered</span>
                      <span>₹{mostPopularItem.revenue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {popularItems.length > 1 && (
                    <div className="sidebar-leaderboard-list">
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                        Snack Leaderboard
                      </span>
                      {popularItems.slice(0, 4).map((item, idx) => {
                        const maxQty = mostPopularItem.quantity || 1;
                        const pct = Math.max(15, Math.round((item.quantity / maxQty) * 100));
                        return (
                          <div key={item.name} className="sidebar-leaderboard-item">
                            <div className="sidebar-leaderboard-meta">
                              <span>
                                <strong className="sidebar-leaderboard-rank">#{idx + 1}</strong> {item.name}
                              </span>
                              <span>{item.quantity} sold</span>
                            </div>
                            <div className="sidebar-leaderboard-track">
                              <div 
                                className="sidebar-leaderboard-bar" 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  No snack orders yet today
                </div>
              )}
            </div>
          </div>

          {/* C. Quick Queue Navigation */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>Queue Status</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{counts.all} total</span>
            </div>
            <div className="sidebar-nav-list">
              <button
                className={`sidebar-nav-btn ${activeTab === 'received' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('received');
                  setIsSidebarOpen(false);
                }}
              >
                <span>● New / Received</span>
                <span className="sidebar-count-badge">{counts.received}</span>
              </button>
              <button
                className={`sidebar-nav-btn ${activeTab === 'preparing' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('preparing');
                  setIsSidebarOpen(false);
                }}
              >
                <span>🍳 In Kitchen</span>
                <span className="sidebar-count-badge">{counts.preparing}</span>
              </button>
              <button
                className={`sidebar-nav-btn ${activeTab === 'ready' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('ready');
                  setIsSidebarOpen(false);
                }}
              >
                <span>🔔 Ready for Runner</span>
                <span className="sidebar-count-badge">{counts.ready}</span>
              </button>
              <button
                className={`sidebar-nav-btn ${activeTab === 'delivered' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('delivered');
                  setIsSidebarOpen(false);
                }}
              >
                <span>✓ Delivered</span>
                <span className="sidebar-count-badge">{counts.delivered}</span>
              </button>
              <button
                className={`sidebar-nav-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('all');
                  setIsSidebarOpen(false);
                }}
              >
                <span>📋 Total Orders</span>
                <span className="sidebar-count-badge">{counts.all}</span>
              </button>
            </div>
          </div>

          {/* D. Staff Profile Footer */}
          <div className="sidebar-staff-footer">
            <div className="sidebar-staff-avatar">
              <ChefHat size={18} />
            </div>
            <div className="sidebar-staff-details">
              <span className="sidebar-staff-name">
                {staffProfile?.full_name || staffUser?.email || 'Kitchen Crew'}
              </span>
              <span className="sidebar-staff-role">
                {isDemoMode ? 'Demo Simulator' : 'Food Dept. Staff'}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Feed Content */}
        <div className="kitchen-main-feed">
          {/* Stats Strip */}
          <div className="kitchen-stats-strip">
            <div className="kpi-card kpi-received" onClick={() => setActiveTab('received')} style={{ cursor: 'pointer' }}>
              <span className="kpi-label">● Received</span>
              <span className="kpi-value">{counts.received}</span>
            </div>
            <div className="kpi-card kpi-preparing" onClick={() => setActiveTab('preparing')} style={{ cursor: 'pointer' }}>
              <span className="kpi-label">🍳 Preparing</span>
              <span className="kpi-value">{counts.preparing}</span>
            </div>
            <div className="kpi-card kpi-ready" onClick={() => setActiveTab('ready')} style={{ cursor: 'pointer' }}>
              <span className="kpi-label">🔔 Ready</span>
              <span className="kpi-value">{counts.ready}</span>
            </div>
            <div className="kpi-card kpi-delivered" onClick={() => setActiveTab('delivered')} style={{ cursor: 'pointer' }}>
              <span className="kpi-label">✓ Delivered</span>
              <span className="kpi-value">{counts.delivered}</span>
            </div>
            <div className="kpi-card kpi-all" onClick={() => setActiveTab('all')} style={{ cursor: 'pointer' }}>
              <span className="kpi-label">📋 Total Orders</span>
              <span className="kpi-value">{counts.all}</span>
            </div>
          </div>

          {/* Filter & Control Bar */}
          <div className="kitchen-controls-bar">
            <div className="status-tabs-group">
              <button
                className={`status-tab ${activeTab === 'received' ? 'active' : ''}`}
                onClick={() => setActiveTab('received')}
              >
                <span>New / Received</span>
                <span className="status-badge-count">{counts.received}</span>
              </button>
              <button
                className={`status-tab ${activeTab === 'preparing' ? 'active' : ''}`}
                onClick={() => setActiveTab('preparing')}
              >
                <span>In Kitchen</span>
                <span className="status-badge-count">{counts.preparing}</span>
              </button>
              <button
                className={`status-tab ${activeTab === 'ready' ? 'active' : ''}`}
                onClick={() => setActiveTab('ready')}
              >
                <span>Ready for Runner</span>
                <span className="status-badge-count">{counts.ready}</span>
              </button>
              <button
                className={`status-tab ${activeTab === 'delivered' ? 'active' : ''}`}
                onClick={() => setActiveTab('delivered')}
              >
                <span>Delivered</span>
                <span className="status-badge-count">{counts.delivered}</span>
              </button>
              <button
                className={`status-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <span>Total Orders</span>
                <span className="status-badge-count">{counts.all}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {screenOptions.length > 1 && (
                <select
                  value={selectedScreen}
                  onChange={(e) => setSelectedScreen(e.target.value)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Screens</option>
                  {screenOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}

              <div className="kitchen-search-box">
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  className="kitchen-search-input"
                  placeholder="Search Order #, Seat, Screen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

      {/* 4. Orders Grid Queue */}
      <main className="kitchen-orders-container">
        {isLoading ? (
          <div className="kitchen-empty-state">
            <RefreshCw size={36} className="animate-spin kitchen-empty-icon" />
            <p>Syncing live cinema kitchen orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="kitchen-empty-state">
            <ChefHat size={48} className="kitchen-empty-icon" />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              No Orders in This View
            </h3>
            <p style={{ maxWidth: '380px', margin: '0 auto', fontSize: '0.85rem' }}>
              {searchQuery 
                ? 'No orders matched your search criteria.' 
                : activeTab === 'all' 
                ? 'No customer orders have been received yet. Place an order from the customer view to see it arrive here in real time!' 
                : `There are currently no orders with status "${activeTab}".`}
            </p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => {
              const diffMs = currentTime - new Date(order.created_at);
              const isUrgent = diffMs > 10 * 60 * 1000 && order.status !== 'delivered';

              return (
                <div key={order.id} className={`order-card status-${order.status}`}>
                  {/* Card Header */}
                  <div className="order-card-header">
                    <div className="order-num-group">
                      <span className="order-num-badge">{order.order_number}</span>
                      <span className={`order-time-elapsed ${isUrgent ? 'urgent' : ''}`}>
                        <Clock size={12} />
                        <span>{getElapsedTimeText(order.created_at)}</span>
                        {isUrgent && <span style={{ color: '#FF4D4D', fontWeight: 800 }}>⚠️ RUSH</span>}
                      </span>
                    </div>

                    <div className="seat-highlight-pill">
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {order.screen_name ? order.screen_name.split('(')[0].trim() : 'Screen'}
                      </div>
                      <div style={{ fontSize: '1.1rem', color: 'var(--gold-primary)' }}>
                        SEAT {order.seat_code}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="customer-info-row">
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {order.customer_name || 'Moviegoer'}
                    </span>
                    {order.customer_phone && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        • 📞 {order.customer_phone}
                      </span>
                    )}
                  </div>

                  {/* Special Notes */}
                  {order.special_notes && (
                    <div className="special-notes-alert">
                      <FileText size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{order.special_notes}</span>
                    </div>
                  )}

                  {/* Checklist of Items */}
                  <ul className="order-items-checklist">
                    {order.order_items?.map((item, idx) => {
                      const itemKey = `${order.id}-${idx}`;
                      const isChecked = Boolean(checkedItems[itemKey]);

                      return (
                        <li 
                          key={item.id || idx} 
                          className="order-item-row"
                          onClick={() => handleToggleItemCheck(order.id, idx)}
                          style={{ cursor: 'pointer', opacity: isChecked ? 0.5 : 1 }}
                        >
                          <div className="item-name-qty">
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '3px',
                              border: isChecked ? '1px solid #22C55E' : '1px solid var(--border-color)',
                              background: isChecked ? '#22C55E' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '4px'
                            }}>
                              {isChecked && <Check size={11} color="#000" strokeWidth={3} />}
                            </div>
                            <span className="item-qty-tag">{item.quantity}x</span>
                            <span style={{ 
                              color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: isChecked ? 'line-through' : 'none'
                            }}>
                              {item.item_name}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            ₹{Number(item.total_price).toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Card Footer */}
                  <div className="order-card-footer">
                    <div className="order-total-row">
                      <span className="order-total-label">Total Incl. 5% GST</span>
                      <span className="order-total-amount">₹{Number(order.total_amount).toFixed(2)}</span>
                    </div>

                    <div className="order-actions-group">
                      {order.status === 'received' && (
                        <button
                          className="btn-status-next to-preparing"
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          disabled={isUpdatingId === order.id}
                        >
                          <ChefHat size={15} />
                          <span>Start Preparing</span>
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          className="btn-status-next to-ready"
                          onClick={() => handleStatusChange(order.id, 'ready')}
                          disabled={isUpdatingId === order.id}
                        >
                          <CheckCircle2 size={15} />
                          <span>Mark as Ready</span>
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          className="btn-status-next to-delivered"
                          onClick={() => handleStatusChange(order.id, 'delivered')}
                          disabled={isUpdatingId === order.id}
                        >
                          <Send size={15} />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      <button
                        className="btn-view-details"
                        onClick={() => setSelectedOrder(order)}
                        title="View Complete Ticket & Notes"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
        </div>
      </div>

      {/* 5. Detailed Slip Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleStatusChange}
          isUpdating={isUpdatingId === selectedOrder.id}
        />
      )}

      {/* 6. Add New Item Modal */}
      <AddItemModal 
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onAddItem={onAddItem}
      />

      {/* 7. Manage Item Stock Modal */}
      <ManageStockModal 
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        menuItems={menuItems}
        onToggleStock={onToggleStock}
      />
    </div>
  );
}
