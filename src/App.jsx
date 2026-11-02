import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import CategoryNav from './components/CategoryNav';
import FoodCard from './components/FoodCard';
import CartDrawer from './components/CartDrawer';
import FloatingCartBar from './components/FloatingCartBar';
import SeatModal from './components/SeatModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import SeatQRModal from './components/SeatQRModal';
import KitchenDashboard from './components/staff/KitchenDashboard';
import StaffLogin from './components/staff/StaffLogin';
import ItemSizeModal from './components/ItemSizeModal';
import { 
  CATEGORIES, 
  MENU_ITEMS, 
  DEFAULT_CINEMA_DETAILS 
} from './data/mockMenu';
import { 
  placeCinemaOrder, 
  isSupabaseConfigured, 
  subscribeToOrderStatus, 
  getStaffSession,
  broadcastMenuStockToggle,
  broadcastMenuSync,
  subscribeToMenuUpdates
} from './lib/supabase';
import './styles/staff.css';
import { 
  Search, 
  X, 
  Popcorn 
} from 'lucide-react';

export default function App() {
  // 1. Navigation / Portal View State ('customer' | 'staff')
  const [portalView, setPortalView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (path === '/kitchen' || path === '/staff' || params.get('portal') === 'staff' || params.get('view') === 'staff') {
        return 'staff';
      }
    }
    return 'customer';
  });

  // 2. Staff Authentication State (Persists across shift refresh via sessionStorage)
  const [staffAuth, setStaffAuth] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('cinebite_staff_auth');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const handleStaffLoginSuccess = useCallback((auth) => {
    setStaffAuth(auth);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('cinebite_staff_auth', JSON.stringify(auth));
      } catch (e) {}
    }
  }, []);

  const handleStaffLogout = useCallback(async () => {
    setStaffAuth(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('cinebite_staff_auth');
      } catch (e) {}
    }
    try {
      await signOutStaff();
    } catch (e) {}
  }, []);

  // Listen for browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (path === '/kitchen' || path === '/staff' || params.get('portal') === 'staff') {
        setPortalView('staff');
      } else {
        setPortalView('customer');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((view) => {
    setPortalView(view);
    if (typeof window !== 'undefined') {
      const newPath = view === 'staff' ? '/kitchen' : '/';
      window.history.pushState(null, '', newPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // 3. Cinema & Seat Details
  const [cinemaDetails, setCinemaDetails] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlScreen = params.get('screen');
      const urlSeat = params.get('seat');
      const urlTheater = params.get('theater');

      return {
        ...DEFAULT_CINEMA_DETAILS,
        theaterName: urlTheater || DEFAULT_CINEMA_DETAILS.theaterName,
        screenName: urlScreen || DEFAULT_CINEMA_DETAILS.screenName,
        seatNumber: urlSeat ? urlSeat.toUpperCase() : DEFAULT_CINEMA_DETAILS.seatNumber
      };
    }
    return DEFAULT_CINEMA_DETAILS;
  });

  // 4. Cart & Modal States
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (path === '/kitchen' || path === '/staff' || params.get('portal') === 'staff') {
        return false;
      }
      return true;
    }
    return true;
  });

  const [isQRModalOpen, setIsQRModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'qr' || params.get('view') === 'qr' || params.get('scanner') === 'true') {
        return true;
      }
    }
    return false;
  });

  // 5. Dynamic Menu Items (Persisted in localStorage & synced across browser tabs)
  const [menuItems, setMenuItems] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cinebite_menu_items');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        localStorage.setItem('cinebite_menu_items', JSON.stringify(MENU_ITEMS));
      } catch (e) {}
    }
    return MENU_ITEMS;
  });

  // Sync menu changes across multiple browser tabs / windows and cross-device realtime
  useEffect(() => {
    const unsub = subscribeToMenuUpdates((fresh) => {
      if (Array.isArray(fresh) && fresh.length > 0) {
        setMenuItems(fresh);
      }
    });
    return unsub;
  }, []);

  // Add new food item from Kitchen Dashboard
  const handleAddNewItem = useCallback((newItem) => {
    setMenuItems((prev) => {
      const updated = [newItem, ...prev];
      broadcastMenuSync(updated);
      return updated;
    });
  }, []);

  // Toggle item in/out of stock from Kitchen Dashboard
  const handleToggleStock = useCallback((itemId) => {
    setMenuItems((prev) => {
      let nextState = false;
      const updated = prev.map((item) => {
        if (item.id === itemId) {
          nextState = !item.isOutOfStock;
          return { ...item, isOutOfStock: nextState };
        }
        return item;
      });
      broadcastMenuStockToggle(itemId, nextState, updated);
      return updated;
    });
  }, []);

  // 6. Category & Filter States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // 6. Active Order & Live Tracker State (Persisted across Safari refreshes with 3-hour TTL)
  const [activeOrder, setActiveOrder] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cinebite_customer_active_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.order && (Date.now() - (parsed.savedAt || 0) < 3 * 60 * 60 * 1000)) {
            return parsed.order;
          }
        }
      } catch (e) {}
    }
    return null;
  });

  const updateActiveOrder = useCallback((updater) => {
    setActiveOrder((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        try {
          if (next) {
            localStorage.setItem('cinebite_customer_active_order', JSON.stringify({
              order: next,
              savedAt: Date.now()
            }));
          } else {
            localStorage.removeItem('cinebite_customer_active_order');
          }
        } catch (e) {}
      }
      return next;
    });
  }, []);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalView, setOrderModalView] = useState('confirmation'); // 'confirmation' | 'tracker'

  // 7. Size & Weight Selection Modal State
  const [sizeModalItem, setSizeModalItem] = useState(null);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);

  // Real-time status subscription from Supabase for customer
  useEffect(() => {
    if (activeOrder?.dbOrderId || activeOrder?.orderId) {
      const unsubscribe = subscribeToOrderStatus({
        orderId: activeOrder.dbOrderId || activeOrder.orderId,
        orderNumber: activeOrder.orderId,
        accessToken: activeOrder.accessToken
      }, (newStatus) => {
        updateActiveOrder((prev) => {
          if (!prev) return null;
          if (prev.status === newStatus) return prev;
          return { ...prev, status: newStatus };
        });
      });
      return unsubscribe;
    }
  }, [activeOrder?.dbOrderId, activeOrder?.orderId, activeOrder?.accessToken, updateActiveOrder]);

  // Open Size & Weight Selector Modal (for food categories with weight specification)
  const handleOpenSizeModal = (item) => {
    setSizeModalItem(item);
    setIsSizeModalOpen(true);
  };

  // Confirm size from modal
  const handleConfirmSize = (item, selectedSize, quantity = 1) => {
    const cartItemId = `${item.id}-size-${selectedSize.id}`;
    const cartItem = {
      ...item,
      id: cartItemId,
      menuItemId: item.id,
      name: `${item.name} (${selectedSize.name})`,
      portion: `${selectedSize.name} (${selectedSize.weight})`,
      price: selectedSize.price,
      selectedSize
    };

    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === cartItemId);
      if (existing) {
        return prevCart.map((ci) =>
          ci.id === cartItemId ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      }
      return [...prevCart, { ...cartItem, quantity }];
    });
  };

  // Cart operations (Direct add for items without weight options)
  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing) {
        return prevCart.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((ci) =>
        ci.id === itemId ? { ...ci, quantity: newQuantity } : ci
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Place Order (Calls atomic Supabase RPC or local fallback)
  const handlePlaceOrder = async (orderData) => {
    try {
      const result = await placeCinemaOrder({
        theatreId: cinemaDetails.theatreId,
        screenId: cinemaDetails.screenId,
        seatNumber: cinemaDetails.seatNumber,
        cart: orderData.cart,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        specialNotes: orderData.specialNotes
      });

      const confirmedOrder = {
        ...orderData,
        orderId: result.orderId,
        dbOrderId: result.dbOrderId,
        accessToken: result.accessToken,
        status: result.status || 'received',
        grandTotal: result.totalAmount || orderData.grandTotal,
        subtotal: result.subtotal || orderData.subtotal,
        gst: result.taxAmount || orderData.gst,
        placedAt: result.placedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      updateActiveOrder(confirmedOrder);
      setCart([]);
      setIsCartOpen(false);
      setOrderModalView('confirmation');
      setIsOrderModalOpen(true);
    } catch (err) {
      console.error('Order placement failed:', err);
      throw err;
    }
  };

  const handleAdvanceStatus = () => {
    if (!activeOrder) return;
    const flow = ['received', 'preparing', 'ready', 'delivered'];
    const currentIndex = flow.indexOf(activeOrder.status);
    const nextStatus = flow[(currentIndex + 1) % flow.length];

    setActiveOrder((prev) => ({
      ...prev,
      status: nextStatus
    }));
  };

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.categoryId === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVeg = !vegOnly || item.isVeg === true;

      return matchesCategory && matchesSearch && matchesVeg;
    });
  }, [menuItems, selectedCategory, searchQuery, vegOnly]);

  const totalCartCount = cart.reduce((acc, ci) => acc + ci.quantity, 0);

  // ---------------------------------------------------------------------------
  // RENDER: STAFF PORTAL VIEW (/kitchen or /staff)
  // ---------------------------------------------------------------------------
  if (portalView === 'staff') {
    if (!staffAuth) {
      return (
        <StaffLogin 
          onLoginSuccess={handleStaffLoginSuccess}
          onSwitchToCustomer={() => navigateTo('customer')}
        />
      );
    }

    return (
      <KitchenDashboard 
        staffUser={staffAuth.user}
        staffProfile={staffAuth.profile}
        isDemoMode={staffAuth.isDemo}
        onLogout={handleStaffLogout}
        onSwitchToCustomer={() => navigateTo('customer')}
        menuItems={menuItems}
        onAddItem={handleAddNewItem}
        onToggleStock={handleToggleStock}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: CUSTOMER ORDERING VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="cinebite-app">
      {/* 1. Header with cinema branding and seat pill */}
      <Header
        cinemaDetails={cinemaDetails}
        onOpenSeatModal={() => setIsSeatModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        totalCartItems={totalCartCount}
      />

      {/* Main Container */}
      <main className="app-container">
        {/* Active Order Persistent Notice Bar */}
        {activeOrder && !isOrderModalOpen && (
          <div 
            onClick={() => {
              setOrderModalView('tracker');
              setIsOrderModalOpen(true);
            }}
            style={{
              margin: '0.75rem 0',
              background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.22), rgba(20, 23, 32, 0.95))',
              border: '1px solid rgba(229, 9, 20, 0.45)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(229, 9, 20, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="seat-live-dot" />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Order {activeOrder.orderId} • Seat {activeOrder.cinemaDetails?.seatNumber || cinemaDetails.seatNumber}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-orange)', fontWeight: 700, marginTop: '2px' }}>
                  {activeOrder.status === 'delivered'
                    ? 'Delivered to Seat 🎉'
                    : activeOrder.status === 'ready'
                    ? 'Runner on the way to your row 🏃'
                    : activeOrder.status === 'preparing'
                    ? 'Kitchen preparing snacks 🍳'
                    : 'Order received by food department 🕒'}
                </div>
              </div>
            </div>
            <button 
              type="button"
              style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                color: '#FFFFFF', 
                background: 'var(--red-gradient)', 
                padding: '6px 14px', 
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--shadow-red-button)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer'
              }}
            >
              Track Live 🚀
            </button>
          </div>
        )}

        {/* 2. Cinema Hero Marquee Banner */}
        <section className="cinema-banner">
          <div className="banner-pill">
            <Popcorn size={13} />
            <span>In-Seat Dining Service</span>
          </div>
          <h2 className="banner-title">
            Enjoy The Movie. We'll Bring The Food.
          </h2>
          <p className="banner-subtitle">
            Order directly from your seat in <strong>{cinemaDetails.screenName.split('(')[0].trim()}</strong>,{' '}
            Seat <strong style={{ color: 'var(--gold-primary)' }}>{cinemaDetails.seatNumber}</strong>. 
            Delivered hot & quiet to your armrest without missing a single scene.
          </p>
        </section>

        {/* 3. Search Bar & Veg Filter */}
        <section className="search-filter-section">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search popcorn, nachos, pizza, cold drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filter-toggles">
            <button
              className={`veg-toggle-btn ${vegOnly ? 'active' : ''}`}
              onClick={() => setVegOnly(!vegOnly)}
              aria-pressed={vegOnly}
            >
              <div className="diet-indicator veg" style={{ width: '14px', height: '14px' }}>
                <span className="diet-dot" style={{ width: '5px', height: '5px' }} />
              </div>
              <span>Veg Only</span>
            </button>
          </div>
        </section>

        {/* 4. Category Horizontal Navigation */}
        <CategoryNav
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
        />

        {/* 5. Food Cards Grid */}
        <section aria-label="Menu Items">
          {filteredItems.length === 0 ? (
            <div className="empty-menu-box">
              <Popcorn size={48} />
              <h3>No Cinema Snacks Found</h3>
              <p>We couldn't find anything matching your search. Try another keyword or reset filters.</p>
              <button
                className="add-btn"
                onClick={() => {
                  setSearchQuery('');
                  setVegOnly(false);
                  setSelectedCategory('all');
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map((item) => {
                const hasWeightSpec = Boolean(item.hasWeightOptions || item.categoryId === 'popcorn');
                const quantity = hasWeightSpec
                  ? cart
                      .filter((ci) => ci.menuItemId === item.id || ci.id === item.id || ci.id.startsWith(item.id))
                      .reduce((acc, ci) => acc + ci.quantity, 0)
                  : (cart.find((ci) => ci.id === item.id)?.quantity || 0);

                return (
                  <FoodCard
                    key={item.id}
                    item={item}
                    cartQuantity={quantity}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onOpenSizeModal={handleOpenSizeModal}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 6. Footer with cinema staff access link */}
        <footer style={{
          marginTop: '3.5rem',
          padding: '2rem 1rem 4rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem'
        }}>
          <p style={{ margin: 0 }}>
            CineBite™ Cinema In-Seat Dining • Fast & Silent Delivery
          </p>
        </footer>
      </main>

      {/* 7. Floating Cart Bar for Mobile Viewport */}
      <FloatingCartBar
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 8. Cart Drawer & Checkout Sheet */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cinemaDetails={cinemaDetails}
        onOpenSeatModal={() => {
          setIsCartOpen(false);
          setIsSeatModalOpen(true);
        }}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* 9. Seat Customization Modal */}
      <SeatModal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        cinemaDetails={cinemaDetails}
        onSave={(updated) => setCinemaDetails(updated)}
      />

      {/* 10. Live Order Status Tracker (Cinema Ticket Receipt) */}
      <OrderSuccessModal
        isOpen={isOrderModalOpen}
        order={activeOrder}
        initialView={orderModalView}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderMore={() => {
          setIsOrderModalOpen(false);
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }}
        onAdvanceStatus={handleAdvanceStatus}
      />

      {/* 11. Size & Weight Selection Modal (Small, Medium, Large) */}
      <ItemSizeModal
        isOpen={isSizeModalOpen}
        item={sizeModalItem}
        onClose={() => {
          setIsSizeModalOpen(false);
          setSizeModalItem(null);
        }}
        onConfirm={handleConfirmSize}
      />
    </div>
  );
}
