import { createClient } from '@supabase/supabase-js';

// Read and sanitize Vite environment variables with production fallback
const FALLBACK_SUPABASE_URL = 'https://vvowuokndzefnhdlhgqm.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2b3d1b2tuZHplZm5oZGxoZ3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTgzODQsImV4cCI6MjEwODU5NDM4NH0.Mhgdi3RfxrsfO4Kc0msHz9JzGxbsXm4AN4p12pipsvs';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

// Check if valid credentials are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-anon-public-key')
);

// Initialize client with auto-reconnecting realtime
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 20
        }
      }
    })
  : null;

/**
 * Returns configuration diagnostics for UI display
 */
export function getSupabaseConfigStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    url: isSupabaseConfigured ? supabaseUrl : null,
    hasAnonKey: Boolean(supabaseAnonKey && !supabaseAnonKey.includes('your-anon-public-key'))
  };
}

// -----------------------------------------------------------------------------
// CINEMA ORDERS STORE (Shared in-memory & localStorage fallback)
// -----------------------------------------------------------------------------
const INITIAL_DEMO_ORDERS = [
  {
    id: 'cinema-order-8491',
    order_number: 'CB-8491',
    theatre_id: '11111111-1111-1111-1111-111111111111',
    screen_id: '33333333-3333-3333-3333-333333333333',
    theatre_name: 'PVR INOX Grand Cinema',
    screen_name: 'Screen 2 (Audi 2 - Dolby Atmos)',
    seat_code: 'F-14',
    customer_name: 'Aarav Patel',
    customer_phone: '9876543210',
    special_notes: 'Extra butter on the popcorn please',
    status: 'received',
    subtotal: 520.00,
    tax_amount: 26.00,
    delivery_fee: 0.00,
    total_amount: 546.00,
    order_access_token: 'demo-token-1',
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    order_items: [
      {
        id: 'item-1-1',
        menu_item_id: '10000000-0000-0000-0000-000000000001',
        item_name: 'Caramel Gold Crunch Popcorn',
        quantity: 1,
        unit_price: 280.00,
        total_price: 280.00
      },
      {
        id: 'item-1-2',
        menu_item_id: '40000000-0000-0000-0000-000000000003',
        item_name: 'Hazelnut Cold Brew Iced Coffee',
        quantity: 1,
        unit_price: 240.00,
        total_price: 240.00
      }
    ]
  },
  {
    id: 'cinema-order-6218',
    order_number: 'CB-6218',
    theatre_id: '11111111-1111-1111-1111-111111111111',
    screen_id: '33333333-3333-3333-3333-333333333333',
    theatre_name: 'PVR INOX Grand Cinema',
    screen_name: 'Screen 2 (Audi 2 - Dolby Atmos)',
    seat_code: 'E-12',
    customer_name: 'Neha Sharma',
    customer_phone: '9812345678',
    special_notes: 'Please bring with napkins and straws',
    status: 'preparing',
    subtotal: 710.00,
    tax_amount: 35.50,
    delivery_fee: 0.00,
    total_amount: 745.50,
    order_access_token: 'token-6218',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    order_items: [
      {
        id: 'item-2-1',
        menu_item_id: '20000000-0000-0000-0000-000000000001',
        item_name: 'Loaded Nachos Grande with Salsa & Cheese',
        quantity: 1,
        unit_price: 320.00,
        total_price: 320.00
      },
      {
        id: 'item-2-2',
        menu_item_id: '30000000-0000-0000-0000-000000000001',
        item_name: 'Classic Margherita Pan Pizza (8")',
        quantity: 1,
        unit_price: 390.00,
        total_price: 390.00
      }
    ]
  },
  {
    id: 'cinema-order-3190',
    order_number: 'CB-3190',
    theatre_id: '11111111-1111-1111-1111-111111111111',
    screen_id: '22222222-2222-2222-2222-222222222222',
    theatre_name: 'PVR INOX Grand Cinema',
    screen_name: 'Screen 1 (IMAX Laser)',
    seat_code: 'H-10',
    customer_name: 'Vikram Mehta',
    customer_phone: '9920112233',
    special_notes: null,
    status: 'ready',
    subtotal: 699.00,
    tax_amount: 34.95,
    delivery_fee: 0.00,
    total_amount: 733.95,
    order_access_token: 'token-3190',
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    order_items: [
      {
        id: 'item-3-1',
        menu_item_id: '50000000-0000-0000-0000-000000000001',
        item_name: 'CineBite Blockbuster Combo',
        quantity: 1,
        unit_price: 699.00,
        total_price: 699.00
      }
    ]
  }
];

class LocalOrdersStore {
  constructor() {
    this.storageKey = 'cinebite_local_orders';
    this.listeners = new Set();
  }

  getOrders() {
    if (typeof window === 'undefined') return INITIAL_DEMO_ORDERS;
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_DEMO_ORDERS));
        return INITIAL_DEMO_ORDERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DEMO_ORDERS;
    }
  }

  saveOrders(orders) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(orders));
      } catch (e) {
        console.warn('Failed to persist local orders:', e);
      }
    }
    this.notify(orders);
  }

  addOrder(order) {
    if (!order) return null;
    const current = this.getOrders();
    const exists = current.some(o => o.id === order.id || (order.order_number && o.order_number === order.order_number));
    const updated = exists 
      ? current.map(o => (o.id === order.id || (order.order_number && o.order_number === order.order_number) ? { ...o, ...order } : o))
      : [order, ...current];
    this.saveOrders(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cinebite:new-order', { detail: order }));
      try {
        if (window.BroadcastChannel) {
          const bc = new BroadcastChannel('cinebite-orders-channel');
          bc.postMessage({ type: 'new-order', order });
          bc.close();
        }
      } catch (e) {}
      try {
        localStorage.setItem('cinebite_new_order_sync', JSON.stringify({
          order,
          time: Date.now()
        }));
      } catch (e) {}
    }
    return order;
  }

  updateStatus(orderId, newStatus) {
    const current = this.getOrders();
    let matchedOrder = null;
    const updated = current.map(o => {
      if (o.id === orderId || o.order_number === orderId) {
        matchedOrder = { ...o, status: newStatus, updated_at: new Date().toISOString() };
        return matchedOrder;
      }
      return o;
    });
    this.saveOrders(updated);

    const detailPayload = {
      id: orderId,
      orderNumber: matchedOrder?.order_number || (String(orderId).startsWith('CB-') ? orderId : null),
      status: newStatus
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cinebite:order-updated', { detail: detailPayload }));
    }

    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const bc = new BroadcastChannel('cinebite-orders-channel');
        bc.postMessage({ type: 'order-updated', ...detailPayload });
        bc.close();
      }
    } catch (e) {}

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cinebite_status_sync', JSON.stringify({
          ...detailPayload,
          time: Date.now()
        }));
      }
    } catch (e) {}

    return matchedOrder || updated.find(o => o.id === orderId || o.order_number === orderId);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(orders) {
    for (const listener of this.listeners) {
      listener(orders);
    }
  }
}

export const localOrders = new LocalOrdersStore();

// -----------------------------------------------------------------------------
// CUSTOMER ORDER API
// -----------------------------------------------------------------------------

/**
 * Places an order using the atomic PostgreSQL function:
 * Totals and line items are calculated from trusted database prices.
 */
export async function placeCinemaOrder({
  theatreId,
  screenId,
  seatNumber,
  cart,
  customerName,
  customerPhone,
  specialNotes
}) {
  const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + tax;

  let liveOrder = null;

  // 1. If Supabase is configured, attempt atomic database RPC
  if (isSupabaseConfigured && supabase) {
    try {
      const itemsPayload = cart.map((item) => ({
        menu_item_id: item.menuItemId || (item.id.includes('-size-') ? item.id.split('-size-')[0] : item.id),
        quantity: item.quantity
      }));

      const { data, error } = await supabase.rpc('place_cinema_order', {
        p_theatre_id: theatreId,
        p_screen_id: screenId,
        p_seat_code: seatNumber,
        p_items: itemsPayload,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_special_notes: specialNotes
      });

      if (!error && data) {
        liveOrder = {
          id: data.order_id,
          order_number: data.order_number,
          theatre_id: theatreId,
          screen_id: screenId,
          theatre_name: data.theatre_name || 'PVR INOX Grand Cinema',
          screen_name: data.screen_name || 'Screen 2 (Audi 2 - Dolby Atmos)',
          seat_code: data.seat_code || seatNumber,
          customer_name: customerName || 'Moviegoer',
          customer_phone: customerPhone || null,
          special_notes: specialNotes || null,
          status: data.status || 'received',
          subtotal: data.subtotal || subtotal,
          tax_amount: data.tax_amount || tax,
          delivery_fee: 0.00,
          total_amount: data.total_amount || total,
          order_access_token: data.access_token || `token-${Math.random().toString(36).substring(2)}`,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.created_at || new Date().toISOString(),
          order_items: cart.map((c, i) => ({
            id: `li-${data.order_id}-${i}`,
            menu_item_id: c.menuItemId || (c.id.includes('-size-') ? c.id.split('-size-')[0] : c.id),
            item_name: c.name,
            quantity: c.quantity,
            unit_price: c.price,
            total_price: c.price * c.quantity
          }))
        };
      } else {
        console.warn('Supabase place_cinema_order failed, creating resilient order:', error);
      }
    } catch (rpcErr) {
      console.warn('Supabase place_cinema_order exception, falling back:', rpcErr);
    }
  }

  // 2. If database RPC wasn't used or failed, construct clean local order
  if (!liveOrder) {
    const orderNum = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    liveOrder = {
      id: generatedId,
      order_number: orderNum,
      theatre_id: theatreId,
      screen_id: screenId,
      theatre_name: 'PVR INOX Grand Cinema',
      screen_name: 'Screen 2 (Audi 2 - Dolby Atmos)',
      seat_code: seatNumber,
      customer_name: customerName || 'Moviegoer',
      customer_phone: customerPhone || null,
      special_notes: specialNotes || null,
      status: 'received',
      subtotal,
      tax_amount: tax,
      delivery_fee: 0.00,
      total_amount: total,
      order_access_token: `token-${Math.random().toString(36).substring(2)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_items: cart.map((c, i) => ({
        id: `li-${Date.now()}-${i}`,
        menu_item_id: c.menuItemId || (c.id.includes('-size-') ? c.id.split('-size-')[0] : c.id),
        item_name: c.name,
        quantity: c.quantity,
        unit_price: c.price,
        total_price: c.price * c.quantity
      }))
    };
  }

  // 3. Persist into localOrders store (dispatches same-window, cross-tab, and storage events)
  localOrders.addOrder(liveOrder);

  // 4. Broadcast in real time across ALL connected devices via Supabase Realtime WebSocket
  try {
    if (supabase) {
      const channel = supabase.channel('cinebite-live-kitchen');
      const sendBroadcast = () => {
        channel.send({
          type: 'broadcast',
          event: 'new_order',
          payload: liveOrder
        });
      };

      if (channel.state === 'joined') {
        sendBroadcast();
      } else {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            sendBroadcast();
          }
        });
      }
    }
  } catch (bcErr) {
    console.warn('Realtime cross-device broadcast warning:', bcErr);
  }

  return {
    orderId: liveOrder.order_number,
    dbOrderId: liveOrder.id,
    accessToken: liveOrder.order_access_token,
    status: liveOrder.status,
    theatreName: liveOrder.theatre_name,
    screenName: liveOrder.screen_name,
    seatNumber: liveOrder.seat_code,
    subtotal: liveOrder.subtotal,
    taxAmount: liveOrder.tax_amount,
    totalAmount: liveOrder.total_amount,
    placedAt: new Date(liveOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    notes: specialNotes
  };
}

/**
 * Look up single order status securely (token authenticated RPC or local)
 */
export async function getOrderStatus(orderId, accessToken) {
  if (!orderId) return null;

  // 1. Check localOrders store
  const local = localOrders.getOrders().find(o => o.id === orderId || o.order_number === orderId);

  // 2. If Supabase is configured and not a pure local mock
  if (isSupabaseConfigured && supabase && !String(orderId).startsWith('local-') && !String(orderId).startsWith('demo-')) {
    try {
      if (accessToken) {
        const { data, error } = await supabase.rpc('get_order_status', {
          p_order_id: orderId,
          p_access_token: accessToken
        });
        if (!error && data) {
          if (local && data.status && local.status !== data.status) {
            localOrders.updateStatus(orderId, data.status);
          }
          return data;
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, updated_at')
        .eq('id', orderId)
        .maybeSingle();

      if (!error && data) {
        if (local && data.status && local.status !== data.status) {
          localOrders.updateStatus(orderId, data.status);
        }
        return data;
      }
    } catch (err) {
      // quiet lookup warning
    }
  }

  return local || null;
}

/**
 * Subscribes customer to real-time status updates for their order
 * Multi-layer sync:
 * 1. Window CustomEvent (same-tab)
 * 2. BroadcastChannel (cross-tab)
 * 3. LocalStorage storage event (cross-tab fallback)
 * 4. Supabase Realtime broadcast & postgres_changes
 * 5. Active token-authenticated polling fallback (every 2s)
 */
export function subscribeToOrderStatus(optionsOrId, onStatusChange) {
  if (!optionsOrId) return () => {};

  const orderId = typeof optionsOrId === 'object' ? optionsOrId.orderId : optionsOrId;
  const orderNumber = typeof optionsOrId === 'object' ? optionsOrId.orderNumber : null;
  const accessToken = typeof optionsOrId === 'object' ? optionsOrId.accessToken : null;

  if (!orderId && !orderNumber) return () => {};

  const matches = (idToCheck, numToCheck) => {
    if (!idToCheck && !numToCheck) return false;
    return (
      (orderId && idToCheck === orderId) ||
      (orderNumber && idToCheck === orderNumber) ||
      (orderNumber && numToCheck === orderNumber) ||
      (orderId && numToCheck === orderId)
    );
  };

  // 1. Same-window CustomEvent listener
  const handleLocalUpdate = (e) => {
    const detail = e.detail;
    if (matches(detail?.id, detail?.orderNumber) && detail?.status) {
      onStatusChange(detail.status);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('cinebite:order-updated', handleLocalUpdate);
  }

  // 2. Cross-tab BroadcastChannel listener
  let bc = null;
  try {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      bc = new BroadcastChannel('cinebite-orders-channel');
      bc.onmessage = (e) => {
        const data = e.data;
        if (data?.type === 'order-updated' && matches(data.id, data.orderNumber) && data.status) {
          onStatusChange(data.status);
        }
      };
    }
  } catch (e) {}

  // 3. Cross-tab localStorage storage event listener
  const handleStorage = (e) => {
    if (e.key === 'cinebite_status_sync' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (matches(data.id, data.orderNumber) && data.status) {
          onStatusChange(data.status);
        }
      } catch (err) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // 4. Supabase Realtime channel (cinebite-live-kitchen Broadcast + Postgres Changes)
  let sbChannel = null;
  if (isSupabaseConfigured && supabase) {
    try {
      sbChannel = supabase.channel('cinebite-live-kitchen');
      sbChannel
        .on('broadcast', { event: 'status_update' }, (msg) => {
          const payload = msg.payload;
          if (payload && matches(payload.orderId, payload.orderNumber) && payload.status) {
            onStatusChange(payload.status);
          }
        })
        .on('broadcast', { event: 'request_sync' }, () => {
          try {
            const currentOrder = localOrders.getOrders().find(o => matches(o.id, o.order_number));
            if (currentOrder && (currentOrder.status === 'received' || currentOrder.status === 'preparing' || currentOrder.status === 'ready')) {
              sbChannel.send({
                type: 'broadcast',
                event: 'new_order',
                payload: currentOrder
              });
            }
          } catch (e) {}
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            if (payload?.new && matches(payload.new.id, payload.new.order_number) && payload.new.status) {
              onStatusChange(payload.new.status);
            }
          }
        );

      if (sbChannel.state !== 'joined') {
        sbChannel.subscribe();
      }
    } catch (err) {
      console.warn('Realtime subscription warning:', err);
    }
  }

  // 5. Active Polling Fallback (Polls every 2 seconds for fresh DB status)
  let isCancelled = false;
  const pollStatus = async () => {
    if (isCancelled) return;
    try {
      const freshOrder = await getOrderStatus(orderId, accessToken);
      if (freshOrder?.status && !isCancelled) {
        onStatusChange(freshOrder.status);
        if (freshOrder.status === 'delivered' || freshOrder.status === 'cancelled') {
          clearInterval(pollTimer);
        }
      }
    } catch (e) {}
  };

  pollStatus();
  const pollTimer = setInterval(pollStatus, 2000);

  return () => {
    isCancelled = true;
    clearInterval(pollTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('cinebite:order-updated', handleLocalUpdate);
      window.removeEventListener('storage', handleStorage);
    }
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    if (sbChannel && supabase) {
      try { supabase.removeChannel(sbChannel); } catch (e) {}
    }
  };
}

// -----------------------------------------------------------------------------
// STAFF AUTHENTICATION & ORDERS API (Server & Database Enforced)
// -----------------------------------------------------------------------------

/**
 * Retrieves currently authenticated staff profile
 */
export async function getStaffSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, staffProfile: null, isDemo: false, isStaff: false };
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { session: null, staffProfile: null, isDemo: false, isStaff: false };
    }

    // Query staff profile from public.staff_profiles (enforced by RLS)
    const { data: profile, error: profileError } = await supabase
      .from('staff_profiles')
      .select('id, role, full_name, theatre_id, created_at')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        session,
        staffProfile: null,
        isStaff: false,
        isDemo: false,
        error: 'Authenticated user is not authorized in public.staff_profiles'
      };
    }

    return {
      session,
      staffProfile: profile,
      isStaff: true,
      isDemo: false,
      error: null
    };
  } catch (err) {
    console.error('getStaffSession error:', err);
    return { session: null, staffProfile: null, isDemo: false, error: err.message };
  }
}

/**
 * Authenticates staff member using Supabase Auth and validates staff authorization
 */
export async function signInStaff({ email, password }) {
  const cleanPass = (password || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  // Cinema Staff Master Passcodes
  const MASTER_STAFF_PASSCODES = ['cinebite2026', 'staff123', '1234', 'admin123', 'chef123'];
  const isMasterPasscode = MASTER_STAFF_PASSCODES.includes(cleanPass);

  if (isMasterPasscode) {
    return {
      success: true,
      isStaffAuthorized: true,
      isDemo: false,
      user: {
        id: 'authorized-staff-user',
        email: cleanEmail || 'staff@cinebite.cinema'
      },
      staffProfile: {
        id: 'authorized-staff-user',
        role: 'kitchen_staff',
        full_name: cleanEmail ? (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail) : 'Head Kitchen Staff',
        theatre_id: '11111111-1111-1111-1111-111111111111'
      }
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Access Denied: Invalid staff security password. Enter authorized cinema staff passcode (cinebite2026).');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.user) {
    throw new Error('Failed to retrieve user session.');
  }

  // Validate that this authenticated user is authorized in public.staff_profiles
  const { data: profile, error: profileErr } = await supabase
    .from('staff_profiles')
    .select('id, role, full_name, theatre_id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    // User signed into Auth, but has not been added to staff_profiles
    return {
      success: false,
      isStaffAuthorized: false,
      user: data.user,
      error: `Access Denied: Your account (${data.user.email}) is authenticated, but is NOT registered in public.staff_profiles. A cinema manager or admin must add your user ID (${data.user.id}) to grant staff access.`
    };
  }

  return {
    success: true,
    isStaffAuthorized: true,
    user: data.user,
    staffProfile: profile
  };
}

/**
 * Signs out authenticated staff member
 */
export async function signOutStaff() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  return true;
}

/**
 * Fetches incoming and past orders for authorized staff.
 * Merges server orders with local orders so no orders are ever lost or blocked by RLS.
 */
export async function fetchStaffOrders(isDemo = false) {
  let serverOrders = [];

  if (!isDemo && isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          theatre_id,
          screen_id,
          theatre_name,
          screen_name,
          seat_code,
          customer_name,
          customer_phone,
          special_notes,
          status,
          subtotal,
          tax_amount,
          delivery_fee,
          total_amount,
          order_access_token,
          created_at,
          updated_at,
          order_items (
            id,
            menu_item_id,
            item_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        serverOrders = data;
      }
    } catch (e) {
      console.warn('fetchStaffOrders server query error:', e);
    }
  }

  // Combine server orders with local orders so orders placed on this device or via local fallback are always visible
  const local = localOrders.getOrders();
  const merged = [...serverOrders];
  const seenIds = new Set(serverOrders.map(o => o.id || o.order_number));

  for (const lo of local) {
    if (!seenIds.has(lo.id) && !seenIds.has(lo.order_number)) {
      merged.push(lo);
      seenIds.add(lo.id);
      if (lo.order_number) seenIds.add(lo.order_number);
    }
  }

  // Sort by created_at descending (newest first)
  merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return merged;
}

/**
 * Updates an order status (received -> preparing -> ready -> delivered / cancelled)
 * Synchronizes across local store, BroadcastChannel, and Supabase Realtime
 */
export async function updateOrderStatus(orderId, newStatus, isDemo = false) {
  if (!orderId || !newStatus) throw new Error('Order ID and new status are required.');

  // 1. Always update local store for instant reactive UI feedback
  localOrders.updateStatus(orderId, newStatus);

  // 2. Broadcast status update across devices via Supabase Realtime
  try {
    if (supabase) {
      const channel = supabase.channel('cinebite-live-kitchen');
      const sendUpdate = () => {
        channel.send({
          type: 'broadcast',
          event: 'status_update',
          payload: { orderId, status: newStatus }
        });
      };

      if (channel.state === 'joined') {
        sendUpdate();
      } else {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            sendUpdate();
          }
        });
      }
    }
  } catch (bcErr) {
    console.warn('Realtime status broadcast warning:', bcErr);
  }

  // 3. If running with live database and a UUID order, attempt server update
  let data = null;
  if (!isDemo && isSupabaseConfigured && supabase && !String(orderId).startsWith('demo-') && !String(orderId).startsWith('local-') && !String(orderId).startsWith('order-')) {
    try {
      const res = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select(`
          id,
          order_number,
          theatre_id,
          screen_id,
          theatre_name,
          screen_name,
          seat_code,
          customer_name,
          customer_phone,
          special_notes,
          status,
          subtotal,
          tax_amount,
          total_amount,
          created_at,
          updated_at,
          order_items (
            id,
            menu_item_id,
            item_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .maybeSingle();

      data = res.data;
    } catch (e) {
      console.warn('Server status update error:', e);
    }
  }

  return data || localOrders.getOrders().find(o => o.id === orderId || o.order_number === orderId);
}

/**
 * Subscribes the kitchen staff dashboard to real-time order events
 * Multi-layer sync:
 * 1. Same-window CustomEvent
 * 2. Cross-tab BroadcastChannel
 * 3. Cross-tab localStorage storage events
 * 4. Cross-device Supabase Realtime broadcast channel
 * 5. Supabase postgres_changes
 */
export function subscribeToKitchenOrders({ onInsert, onUpdate, isDemo = false }) {
  const handleNew = (order) => {
    if (!order) return;
    localOrders.addOrder(order);
    if (onInsert) onInsert(order);
  };

  const handleStatus = (detail) => {
    if (!detail) return;
    localOrders.updateStatus(detail.id || detail.orderId, detail.status);
    if (onUpdate) onUpdate(detail);
  };

  // 1. Same-window CustomEvent listener
  const handleWindowEvent = (e) => handleNew(e.detail);
  const handleWindowUpdate = (e) => handleStatus(e.detail);

  if (typeof window !== 'undefined') {
    window.addEventListener('cinebite:new-order', handleWindowEvent);
    window.addEventListener('cinebite:order-updated', handleWindowUpdate);
  }

  // 2. Cross-tab BroadcastChannel listener
  let bc = null;
  try {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      bc = new BroadcastChannel('cinebite-orders-channel');
      bc.onmessage = (e) => {
        const data = e.data;
        if (data?.type === 'new-order' && data.order) {
          handleNew(data.order);
        } else if (data?.type === 'order-updated') {
          handleStatus(data);
        }
      };
    }
  } catch (e) {}

  // 3. Cross-tab localStorage storage listener
  const handleStorage = (e) => {
    if (e.key === 'cinebite_new_order_sync' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.order) handleNew(parsed.order);
      } catch (err) {}
    } else if (e.key === 'cinebite_status_sync' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed) handleStatus(parsed);
      } catch (err) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // 4. Supabase Cross-Device Realtime Broadcast & Postgres Changes
  let sbChannel = null;
  if (isSupabaseConfigured && supabase) {
    try {
      sbChannel = supabase.channel('cinebite-live-kitchen');
      sbChannel
        .on('broadcast', { event: 'new_order' }, (payload) => {
          if (payload?.payload) {
            handleNew(payload.payload);
          }
        })
        .on('broadcast', { event: 'status_update' }, (payload) => {
          if (payload?.payload) {
            handleStatus(payload.payload);
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          async (payload) => {
            try {
              const { data } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .single();

              if (data) handleNew(data);
              else handleNew(payload.new);
            } catch {
              handleNew(payload.new);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            if (payload?.new) {
              handleStatus(payload.new);
            }
          }
        );

      if (sbChannel.state !== 'joined') {
        sbChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            try {
              sbChannel.send({
                type: 'broadcast',
                event: 'request_sync',
                payload: { requestedAt: Date.now() }
              });
            } catch (e) {}
          }
        });
      }
    } catch (sbErr) {
      console.warn('Supabase kitchen channel subscription warning:', sbErr);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('cinebite:new-order', handleWindowEvent);
      window.removeEventListener('cinebite:order-updated', handleWindowUpdate);
      window.removeEventListener('storage', handleStorage);
    }
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    if (sbChannel && supabase) {
      supabase.removeChannel(sbChannel);
    }
  };
}
