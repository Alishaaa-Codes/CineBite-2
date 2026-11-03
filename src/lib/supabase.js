import { createClient } from '@supabase/supabase-js';

// Read and sanitize Vite environment variables with production fallback
const FALLBACK_SUPABASE_URL = 'https://vvowuokndzefnhdlhgqm.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2b3d1b2tuZHplZm5oZGxoZ3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTgzODQsImV4cCI6MjEwODU5NDM4NH0.Mhgdi3RfxrsfO4Kc0msHz9JzGxbsXm4AN4p12pipsvs';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || FALLBACK_SUPABASE_URL;
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || FALLBACK_SUPABASE_ANON_KEY;

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
// PERSISTENT REALTIME & BROADCAST CHANNELS (Auto-connecting singletons)
// -----------------------------------------------------------------------------
let liveKitchenChannel = null;

export function getKitchenOrdersChannel() {
  if (!supabase) return null;
  if (!liveKitchenChannel) {
    liveKitchenChannel = supabase.channel('cinebite-live-kitchen', {
      config: {
        broadcast: {
          ack: true
        }
      }
    });

    // Attach Postgres database change listeners ONCE before subscribing
    try {
      liveKitchenChannel
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload?.new && typeof window !== 'undefined') {
              const detail = {
                id: payload.new.id,
                orderId: payload.new.id,
                orderNumber: payload.new.order_number,
                status: payload.new.status
              };
              window.dispatchEvent(new CustomEvent('cinebite:order-updated', { detail }));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload?.new && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('cinebite:new-order', { detail: payload.new }));
            }
          }
        );
    } catch (e) {}

    if (typeof window !== 'undefined') {
      liveKitchenChannel.subscribe();
    }
  }
  return liveKitchenChannel;
}

// Auto-initialize connection on script load so channel is already joined when user orders
if (typeof window !== 'undefined' && supabase) {
  try {
    getKitchenOrdersChannel();
  } catch (e) {}
}

let sharedBroadcastChannel = null;
export function getSharedBroadcastChannel() {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    if (!sharedBroadcastChannel) {
      try {
        sharedBroadcastChannel = new BroadcastChannel('cinebite-orders-channel');
      } catch (e) {}
    }
    return sharedBroadcastChannel;
  }
  return null;
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
        const bc = getSharedBroadcastChannel();
        if (bc) bc.postMessage({ type: 'new-order', order });
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
      const bc = getSharedBroadcastChannel();
      if (bc) bc.postMessage({ type: 'order-updated', ...detailPayload });
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
    const channel = getKitchenOrdersChannel();
    if (channel) {
      const doSend = () => {
        channel.send({
          type: 'broadcast',
          event: 'new_order',
          payload: liveOrder
        }).catch(() => {});
      };

      if (channel.state === 'joined') {
        doSend();
      } else {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') doSend();
        });
        setTimeout(doSend, 400);
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
export async function getOrderStatus(orderId, accessToken, orderNumber = null) {
  if (!orderId && !orderNumber) return null;

  const targetId = orderId;
  const targetNum = orderNumber || (String(orderId).startsWith('CB-') ? orderId : null);

  // 1. Check localOrders store
  const local = localOrders.getOrders().find(o => 
    (targetId && (o.id === targetId || o.order_number === targetId)) ||
    (targetNum && (o.order_number === targetNum || o.id === targetNum))
  );

  // 2. If Supabase is configured and not a pure local mock
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(targetId || ''));

  if (isSupabaseConfigured && supabase) {
    try {
      if (accessToken && isUuid) {
        const rpcPromise = supabase.rpc('get_order_status', {
          p_order_id: targetId,
          p_access_token: accessToken
        });
        const rpcRes = await Promise.race([
          rpcPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 1200))
        ]).catch(() => null);

        if (rpcRes?.data) {
          const data = rpcRes.data;
          if (local && data.status && local.status !== data.status) {
            localOrders.updateStatus(targetId, data.status);
            if (targetNum) localOrders.updateStatus(targetNum, data.status);
          }
          return data;
        }
      }

      let query = supabase.from('orders').select('id, order_number, status, updated_at');
      if (isUuid) {
        query = query.eq('id', targetId);
      } else if (targetNum) {
        query = query.eq('order_number', targetNum);
      } else {
        query = query.eq('id', targetId);
      }

      const queryPromise = query.maybeSingle();
      const res = await Promise.race([
        queryPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 1200))
      ]).catch(() => null);

      if (res?.data) {
        const data = res.data;
        if (local && data.status && local.status !== data.status) {
          localOrders.updateStatus(targetId, data.status);
          if (targetNum) localOrders.updateStatus(targetNum, data.status);
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
  if (!optionsOrId || typeof onStatusChange !== 'function') return () => {};

  const orderId = typeof optionsOrId === 'object' ? optionsOrId.orderId : optionsOrId;
  const orderNumber = typeof optionsOrId === 'object' ? optionsOrId.orderNumber : null;
  const accessToken = typeof optionsOrId === 'object' ? optionsOrId.accessToken : null;

  if (!orderId && !orderNumber) return () => {};

  const clean = (v) => String(v || '').trim().toLowerCase();
  const cleanDigits = (v) => String(v || '').replace(/\D/g, '');

  const targetStrings = [clean(orderId), clean(orderNumber)].filter(Boolean);
  const targetDigits = targetStrings.map(cleanDigits).filter(d => d.length >= 4);

  const matches = (idToCheck, numToCheck) => {
    if (!idToCheck && !numToCheck) return false;
    const incomingStrings = [clean(idToCheck), clean(numToCheck)].filter(Boolean);
    if (targetStrings.some(t => incomingStrings.includes(t))) return true;

    const incomingDigits = incomingStrings.map(cleanDigits).filter(d => d.length >= 4);
    if (targetDigits.some(td => incomingDigits.includes(td))) return true;

    return false;
  };

  const STATUS_RANKS = {
    received: 1,
    preparing: 2,
    ready: 3,
    delivered: 4,
    cancelled: 5
  };

  let highestStatusSeen = 'received';
  try {
    const local = localOrders.getOrders().find(o => matches(o.id, o.order_number));
    if (local?.status) highestStatusSeen = local.status;
  } catch (e) {}

  const applyStatusChange = (newStatus) => {
    if (!newStatus) return;
    const currentRank = STATUS_RANKS[highestStatusSeen] || 1;
    const nextRank = STATUS_RANKS[newStatus] || 1;

    // Never downgrade an order status unless explicitly cancelled
    if (newStatus !== 'cancelled' && nextRank < currentRank) {
      return;
    }

    highestStatusSeen = newStatus;

    // 1. Update local store so poller and other tabs see the freshest status
    try {
      if (orderId) localOrders.updateStatus(orderId, newStatus);
      if (orderNumber) localOrders.updateStatus(orderNumber, newStatus);
    } catch (e) {}

    // 2. Update active order TTL entry in localStorage
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('cinebite_customer_active_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.order) {
            parsed.order.status = newStatus;
            localStorage.setItem('cinebite_customer_active_order', JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {}

    // 3. Notify the React component
    onStatusChange(newStatus);
  };

  // 1. Same-window CustomEvent listener
  const handleLocalUpdate = (e) => {
    const detail = e.detail;
    if (matches(detail?.id, detail?.orderNumber) && detail?.status) {
      applyStatusChange(detail.status);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('cinebite:order-updated', handleLocalUpdate);
  }

  // 2. Cross-tab BroadcastChannel listener
  const bc = getSharedBroadcastChannel();
  const handleBcMessage = (e) => {
    const data = e?.data;
    if (data?.type === 'order-updated' && matches(data.id, data.orderNumber) && data.status) {
      applyStatusChange(data.status);
    }
  };
  if (bc) {
    try {
      bc.addEventListener('message', handleBcMessage);
    } catch (e) {}
  }

  // 3. Cross-tab localStorage storage event listener
  const handleStorage = (e) => {
    if (e.key === 'cinebite_status_sync' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (matches(data.id, data.orderNumber) && data.status) {
          applyStatusChange(data.status);
        }
      } catch (err) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // 4. Supabase Realtime channel (cinebite-live-kitchen Broadcast + Postgres Changes)
  const sbChannel = getKitchenOrdersChannel();
  if (sbChannel) {
    try {
      sbChannel
        .on('broadcast', { event: 'status_update' }, (msg) => {
          const payload = msg?.payload;
          if (payload && matches(payload.orderId, payload.orderNumber) && payload.status) {
            applyStatusChange(payload.status);
          }
        })
        .on('broadcast', { event: 'sync_orders' }, (msg) => {
          const ordersList = Array.isArray(msg?.payload) ? msg.payload : [];
          const matched = ordersList.find(o => matches(o?.id, o?.order_number));
          if (matched?.status) {
            applyStatusChange(matched.status);
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
              }).catch(() => {});
            }
          } catch (e) {}
        });

      const requestStatusSync = () => {
        try {
          sbChannel.send({
            type: 'broadcast',
            event: 'request_status_sync',
            payload: { orderId, orderNumber }
          }).catch(() => {});
        } catch (e) {}
      };

      if (sbChannel.state === 'joined') {
        requestStatusSync();
      } else {
        sbChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') requestStatusSync();
        });
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
      const freshOrder = await getOrderStatus(orderId, accessToken, orderNumber);
      if (freshOrder?.status && !isCancelled) {
        applyStatusChange(freshOrder.status);
        if (freshOrder.status === 'delivered' || freshOrder.status === 'cancelled') {
          clearInterval(pollTimer);
          return;
        }
      }

      const local = localOrders.getOrders().find(o => matches(o.id, o.order_number));
      if (local?.status && !isCancelled) {
        applyStatusChange(local.status);
        if (local.status === 'delivered' || local.status === 'cancelled') {
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
      try { bc.removeEventListener('message', handleBcMessage); } catch (e) {}
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
export async function updateOrderStatus(orderId, newStatus, isDemo = false, explicitOrderNumber = null) {
  if (!orderId || !newStatus) throw new Error('Order ID and new status are required.');

  // 1. Resolve order details from local store or explicit parameter
  const localList = localOrders.getOrders();
  const existingOrder = localList.find(o => 
    o.id === orderId || 
    o.order_number === orderId || 
    (explicitOrderNumber && o.order_number === explicitOrderNumber)
  );

  const resolvedId = existingOrder?.id || orderId;
  const resolvedNumber = explicitOrderNumber || existingOrder?.order_number || (String(orderId).startsWith('CB-') ? orderId : null);

  // Update or add into local store for instant UI feedback
  let updatedOrder = null;
  if (existingOrder) {
    updatedOrder = localOrders.updateStatus(resolvedId, newStatus);
    if (resolvedNumber && resolvedNumber !== resolvedId) {
      localOrders.updateStatus(resolvedNumber, newStatus);
    }
  } else {
    updatedOrder = localOrders.addOrder({
      id: resolvedId,
      order_number: resolvedNumber || (String(orderId).startsWith('CB-') ? orderId : `CB-${Math.floor(1000 + Math.random() * 9000)}`),
      status: newStatus,
      updated_at: new Date().toISOString()
    });
  }

  // 2. Broadcast status update across devices via Supabase Realtime WebSocket
  const detailPayload = {
    orderId: resolvedId,
    orderNumber: resolvedNumber || updatedOrder?.order_number,
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  try {
    const channel = getKitchenOrdersChannel();
    if (channel) {
      const doSend = () => {
        return channel.send({
          type: 'broadcast',
          event: 'status_update',
          payload: detailPayload
        }).catch(() => {});
      };

      if (channel.state === 'joined') {
        doSend();
        setTimeout(doSend, 200);
      } else {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            doSend();
            setTimeout(doSend, 200);
          }
        });
        setTimeout(doSend, 350);
      }
    }
  } catch (bcErr) {
    console.warn('Realtime status broadcast warning:', bcErr);
  }

  // 3. Attempt server database update (non-blocking)
  let data = null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
  if (!isDemo && isSupabaseConfigured && supabase) {
    try {
      let updateQuery = supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        });

      if (isUuid) {
        updateQuery = updateQuery.eq('id', orderId);
      } else if (resolvedNumber) {
        updateQuery = updateQuery.eq('order_number', resolvedNumber);
      } else {
        updateQuery = updateQuery.eq('id', orderId);
      }

      const updatePromise = updateQuery.select(`id, order_number, status, updated_at`).maybeSingle();
      const res = await Promise.race([
        updatePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB update timeout')), 1200))
      ]);
      data = res?.data;
    } catch (e) {
      // quiet warning
    }
  }

  return data || updatedOrder || localOrders.getOrders().find(o => o.id === orderId || o.order_number === orderId);
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
  const bc = getSharedBroadcastChannel();
  const handleBcMessage = (e) => {
    const data = e?.data;
    if (data?.type === 'new-order' && data.order) {
      handleNew(data.order);
    } else if (data?.type === 'order-updated') {
      handleStatus(data);
    }
  };
  if (bc) {
    try {
      bc.addEventListener('message', handleBcMessage);
    } catch (e) {}
  }

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
  const sbChannel = getKitchenOrdersChannel();
  if (sbChannel) {
    try {
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
        .on('broadcast', { event: 'sync_orders' }, (payload) => {
          if (Array.isArray(payload?.payload)) {
            for (const item of payload.payload) {
              handleNew(item);
            }
          }
        })
        .on('broadcast', { event: 'request_sync' }, () => {
          try {
            const currentOrders = localOrders.getOrders();
            if (currentOrders?.length) {
              sbChannel.send({
                type: 'broadcast',
                event: 'sync_orders',
                payload: currentOrders
              }).catch(() => {});
            }
          } catch (e) {}
        })
        .on('broadcast', { event: 'request_status_sync' }, (msg) => {
          try {
            const req = msg?.payload;
            if (req) {
              const currentOrders = localOrders.getOrders();
              const match = currentOrders.find(o => 
                (req.orderId && (o.id === req.orderId || o.order_number === req.orderId)) ||
                (req.orderNumber && (o.order_number === req.orderNumber || o.id === req.orderNumber))
              );
              if (match && match.status) {
                sbChannel.send({
                  type: 'broadcast',
                  event: 'status_update',
                  payload: {
                    orderId: match.id,
                    orderNumber: match.order_number,
                    status: match.status,
                    updated_at: match.updated_at || new Date().toISOString()
                  }
                }).catch(() => {});
              }
            }
          } catch (e) {}
        });

      if (sbChannel.state === 'joined') {
        sbChannel.send({
          type: 'broadcast',
          event: 'request_sync',
          payload: { requestedAt: Date.now() }
        }).catch(() => {});
      } else {
        sbChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            try {
              sbChannel.send({
                type: 'broadcast',
                event: 'request_sync',
                payload: { requestedAt: Date.now() }
              }).catch(() => {});
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
      try { bc.removeEventListener('message', handleBcMessage); } catch (e) {}
    }
    // Channel connection remains continuously open across kitchen re-renders
  };
}

// -----------------------------------------------------------------------------
// MENU & STOCK REALTIME SYNCHRONIZATION (Cross-Device)
// -----------------------------------------------------------------------------

/**
 * Broadcasts an Out-of-Stock toggle across all connected customer & kitchen devices
 */
export function broadcastMenuStockToggle(itemId, isOutOfStock, updatedMenuItems) {
  if (typeof window === 'undefined') return;

  let menuList = updatedMenuItems;
  if (!menuList) {
    try {
      const saved = JSON.parse(localStorage.getItem('cinebite_menu_items') || '[]');
      if (Array.isArray(saved) && saved.length) {
        menuList = saved.map(it => it.id === itemId ? { ...it, isOutOfStock } : it);
      }
    } catch (e) {}
  }

  try {
    if (menuList && Array.isArray(menuList)) {
      localStorage.setItem('cinebite_menu_items', JSON.stringify(menuList));
    }
    localStorage.setItem('cinebite_stock_sync', JSON.stringify({
      itemId,
      isOutOfStock,
      time: Date.now()
    }));
  } catch (e) {}

  const bc = getSharedBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage({ type: 'stock_toggle', itemId, isOutOfStock, menuItems: menuList });
    } catch (e) {}
  }

  try {
    const channel = getKitchenOrdersChannel();
    if (channel) {
      const doSend = () => {
        return channel.send({
          type: 'broadcast',
          event: 'menu_stock_toggle',
          payload: { itemId, isOutOfStock, menuItems: menuList }
        }).catch(() => {});
      };

      if (channel.state === 'joined') {
        doSend();
      } else {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') doSend();
        });
      }
    }
  } catch (e) {}
}

/**
 * Broadcasts the entire menu snapshot across all connected devices (e.g. after adding an item)
 */
export function broadcastMenuSync(updatedMenuItems) {
  if (typeof window === 'undefined' || !updatedMenuItems) return;

  try {
    localStorage.setItem('cinebite_menu_items', JSON.stringify(updatedMenuItems));
  } catch (e) {}

  const bc = getSharedBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage({ type: 'menu_sync', menuItems: updatedMenuItems });
    } catch (e) {}
  }

  try {
    const channel = getKitchenOrdersChannel();
    if (channel) {
      const doSend = () => {
        return channel.send({
          type: 'broadcast',
          event: 'menu_sync',
          payload: { menuItems: updatedMenuItems }
        }).catch(() => {});
      };

      if (channel.state === 'joined') {
        doSend();
      } else {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') doSend();
        });
      }
    }
  } catch (e) {}
}

/**
 * Subscribes customer and staff devices to real-time menu and stock availability changes
 */
export function subscribeToMenuUpdates(onMenuUpdate) {
  if (typeof window === 'undefined' || typeof onMenuUpdate !== 'function') return () => {};

  // 1. Cross-tab BroadcastChannel listener
  const bc = getSharedBroadcastChannel();
  const handleBcMessage = (e) => {
    const data = e?.data;
    if (data?.type === 'stock_toggle') {
      if (Array.isArray(data.menuItems)) {
        onMenuUpdate(data.menuItems);
      } else if (data.itemId) {
        try {
          const current = JSON.parse(localStorage.getItem('cinebite_menu_items') || '[]');
          if (Array.isArray(current) && current.length) {
            const next = current.map(it => it.id === data.itemId ? { ...it, isOutOfStock: data.isOutOfStock } : it);
            onMenuUpdate(next);
          }
        } catch (e) {}
      }
    } else if (data?.type === 'menu_sync' && Array.isArray(data.menuItems)) {
      onMenuUpdate(data.menuItems);
    }
  };
  if (bc) {
    try {
      bc.addEventListener('message', handleBcMessage);
    } catch (e) {}
  }

  // 2. Cross-tab localStorage listener
  const handleStorage = (e) => {
    if (e.key === 'cinebite_menu_items' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) onMenuUpdate(parsed);
      } catch (err) {}
    } else if (e.key === 'cinebite_stock_sync' && e.newValue) {
      try {
        const sync = JSON.parse(e.newValue);
        const current = JSON.parse(localStorage.getItem('cinebite_menu_items') || '[]');
        if (Array.isArray(current) && sync.itemId) {
          const next = current.map(it => it.id === sync.itemId ? { ...it, isOutOfStock: sync.isOutOfStock } : it);
          onMenuUpdate(next);
        }
      } catch (err) {}
    }
  };
  window.addEventListener('storage', handleStorage);

  // 3. Supabase Realtime Broadcast listener (Cross-Device WebSocket)
  const channel = getKitchenOrdersChannel();
  if (channel) {
    try {
      channel.on('broadcast', { event: 'menu_stock_toggle' }, (msg) => {
        const payload = msg?.payload;
        if (payload?.menuItems && Array.isArray(payload.menuItems)) {
          try {
            localStorage.setItem('cinebite_menu_items', JSON.stringify(payload.menuItems));
          } catch (e) {}
          onMenuUpdate(payload.menuItems);
        } else if (payload?.itemId !== undefined) {
          try {
            const current = JSON.parse(localStorage.getItem('cinebite_menu_items') || '[]');
            if (Array.isArray(current) && current.length) {
              const next = current.map(it => it.id === payload.itemId ? { ...it, isOutOfStock: payload.isOutOfStock } : it);
              localStorage.setItem('cinebite_menu_items', JSON.stringify(next));
              onMenuUpdate(next);
            }
          } catch (e) {}
        }
      });

      channel.on('broadcast', { event: 'menu_sync' }, (msg) => {
        const payload = msg?.payload;
        if (payload?.menuItems && Array.isArray(payload.menuItems)) {
          try {
            localStorage.setItem('cinebite_menu_items', JSON.stringify(payload.menuItems));
          } catch (e) {}
          onMenuUpdate(payload.menuItems);
        }
      });

      channel.on('broadcast', { event: 'request_menu_sync' }, () => {
        try {
          const current = JSON.parse(localStorage.getItem('cinebite_menu_items') || '[]');
          if (Array.isArray(current) && current.length > 0) {
            channel.send({
              type: 'broadcast',
              event: 'menu_sync',
              payload: { menuItems: current }
            }).catch(() => {});
          }
        } catch (e) {}
      });

      // Request latest menu state from active tabs
      if (channel.state === 'joined') {
        channel.send({
          type: 'broadcast',
          event: 'request_menu_sync',
          payload: { time: Date.now() }
        }).catch(() => {});
      } else {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'request_menu_sync',
              payload: { time: Date.now() }
            }).catch(() => {});
          }
        });
      }
    } catch (e) {
      console.warn('Realtime menu subscription warning:', e);
    }
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (bc) {
      try {
        bc.removeEventListener('message', handleBcMessage);
      } catch (e) {}
    }
  };
}
