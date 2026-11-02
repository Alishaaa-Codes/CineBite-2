import { createClient } from '@supabase/supabase-js';

// Read and sanitize Vite environment variables
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if valid credentials are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-anon-public-key')
);

// Initialize client only if valid configuration is present
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
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
// LOCAL DEMO ORDERS STORE (Shared in-memory & localStorage fallback)
// -----------------------------------------------------------------------------
const INITIAL_DEMO_ORDERS = [
  {
    id: 'demo-order-1',
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
    id: 'demo-order-2',
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
    order_access_token: 'demo-token-2',
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
    id: 'demo-order-3',
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
    order_access_token: 'demo-token-3',
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
    const current = this.getOrders();
    const updated = [order, ...current];
    this.saveOrders(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cinebite:new-order', { detail: order }));
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
  if (!isSupabaseConfigured || !supabase) {
    // Generate simulated order
    const orderNum = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = cart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + tax;

    const demoOrder = {
      id: `local-${Date.now()}`,
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

    localOrders.addOrder(demoOrder);

    return {
      isLocalDemo: true,
      orderId: demoOrder.order_number,
      dbOrderId: demoOrder.id,
      accessToken: demoOrder.order_access_token,
      status: demoOrder.status,
      theatreName: demoOrder.theatre_name,
      screenName: demoOrder.screen_name,
      seatNumber: demoOrder.seat_code,
      subtotal: demoOrder.subtotal,
      taxAmount: demoOrder.tax_amount,
      totalAmount: demoOrder.total_amount,
      placedAt: new Date(demoOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: specialNotes
    };
  }

  // Format payload for atomic RPC: [{"menu_item_id": "...", "quantity": 2}]
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

  if (error) {
    console.error('Supabase place_cinema_order error:', error);
    throw new Error(error.message || 'Failed to place order in database.');
  }

  const liveOrder = {
    id: data.order_id,
    order_number: data.order_number,
    theatre_id: theatreId,
    screen_id: screenId,
    theatre_name: data.theatre_name,
    screen_name: data.screen_name,
    seat_code: data.seat_code,
    customer_name: customerName || 'Moviegoer',
    customer_phone: customerPhone || null,
    special_notes: specialNotes || null,
    status: data.status || 'received',
    subtotal: data.subtotal,
    tax_amount: data.tax_amount,
    delivery_fee: 0.00,
    total_amount: data.total_amount,
    order_access_token: data.access_token,
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

  // Mirror into local store and trigger live browser events for kitchen dashboard
  localOrders.addOrder(liveOrder);

  return {
    isLocalDemo: false,
    orderId: data.order_number,
    dbOrderId: data.order_id,
    accessToken: data.access_token,
    status: data.status,
    theatreName: data.theatre_name,
    screenName: data.screen_name,
    seatNumber: data.seat_code,
    subtotal: data.subtotal,
    taxAmount: data.tax_amount,
    totalAmount: data.total_amount,
    placedAt: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  // 4. Supabase Realtime channel (Broadcast + Postgres Changes)
  let sbChannel = null;
  if (isSupabaseConfigured && supabase && orderId && !String(orderId).startsWith('local-') && !String(orderId).startsWith('demo-')) {
    try {
      sbChannel = supabase
        .channel(`order-status-${orderId}`)
        .on('broadcast', { event: 'status_update' }, (msg) => {
          if (msg.payload?.status) {
            onStatusChange(msg.payload.status);
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`
          },
          (payload) => {
            if (payload?.new?.status) {
              onStatusChange(payload.new.status);
            }
          }
        )
        .subscribe();
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
    return { session: null, staffProfile: null, isDemo: true };
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return { session: null, staffProfile: null, isDemo: false };
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
  if (!isSupabaseConfigured || !supabase) {
    // If not configured, provide simulated demo sign-in
    if (email && password) {
      return {
        success: true,
        isDemo: true,
        user: { id: 'demo-staff-user', email },
        staffProfile: {
          id: 'demo-staff-user',
          role: 'kitchen_staff',
          full_name: email.split('@')[0],
          theatre_id: '11111111-1111-1111-1111-111111111111'
        }
      };
    }
    throw new Error('Please enter staff email and password.');
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
 * Row Level Security strictly enforces that non-staff receive 0 rows.
 */
export async function fetchStaffOrders(isDemo = false) {
  if (isDemo || !isSupabaseConfigured || !supabase) {
    return localOrders.getOrders();
  }

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

  if (error) {
    console.error('fetchStaffOrders error:', error);
    throw new Error(error.message || 'Failed to fetch kitchen orders.');
  }

  return data || [];
}

/**
 * Updates an order status (received -> preparing -> ready -> delivered / cancelled)
 * Row Level Security strictly enforces that only staff can perform updates.
 */
export async function updateOrderStatus(orderId, newStatus, isDemo = false) {
  if (!orderId || !newStatus) throw new Error('Order ID and new status are required.');

  // Always update local store for instant reactive UI feedback
  localOrders.updateStatus(orderId, newStatus);

  // If running in local demo mode, return updated local order
  if (isDemo || !isSupabaseConfigured || !supabase || String(orderId).startsWith('demo-') || String(orderId).startsWith('local-')) {
    return localOrders.getOrders().find(o => o.id === orderId);
  }

  const { data, error } = await supabase
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
    .single();

  if (error) {
    console.error('updateOrderStatus error:', error);
    throw new Error(error.message || 'Failed to update order status.');
  }

  // Trigger Supabase Realtime broadcast so customer channels update immediately across devices
  try {
    const channel = supabase.channel(`order-status-${orderId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'status_update',
          payload: { orderId, orderNumber: data?.order_number, status: newStatus }
        });
        setTimeout(() => {
          try { supabase.removeChannel(channel); } catch (e) {}
        }, 1500);
      }
    });
  } catch (bcErr) {
    console.warn('Realtime broadcast dispatch warning:', bcErr);
  }

  return data;
}

/**
 * Subscribes the kitchen staff dashboard to real-time order events
 */
export function subscribeToKitchenOrders({ onInsert, onUpdate, isDemo = false }) {
  // Always listen to local window events
  const handleNew = (e) => onInsert && onInsert(e.detail);
  const handleUpdate = (e) => onUpdate && onUpdate(e.detail);

  if (typeof window !== 'undefined') {
    window.addEventListener('cinebite:new-order', handleNew);
    window.addEventListener('cinebite:order-updated', handleUpdate);
  }

  // If Supabase is configured and not purely demo, also listen to Realtime
  let channel = null;
  if (!isDemo && isSupabaseConfigured && supabase) {
    channel = supabase
      .channel('cinebite-kitchen-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          // Fetch full order with items
          try {
            const { data } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single();

            if (data && onInsert) {
              onInsert(data);
            } else if (onInsert) {
              onInsert(payload.new);
            }
          } catch {
            if (onInsert) onInsert(payload.new);
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
          if (onUpdate && payload.new) {
            onUpdate(payload.new);
          }
        }
      )
      .subscribe();
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('cinebite:new-order', handleNew);
      window.removeEventListener('cinebite:order-updated', handleUpdate);
    }
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}
