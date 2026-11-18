/**
 * CineBite Cloud Sync Engine
 * Real-time, multi-device, multi-cinema order streaming and status synchronization
 * Bridges Mobile Phones <-> Kitchen PCs <-> Staff Tablets seamlessly across the internet
 */

import { resolveCinema } from '../data/cinemaRegistry.js';

// Safe URL-friendly topic generator for cinema isolation
export function getCinemaTopic(slugOrName, prefix = 'kitchen') {
  const cinema = resolveCinema(slugOrName);
  const safeSlug = (cinema?.slug || 'pvr-grand').replace(/[^a-z0-9]/g, '_');
  return `cinebite_${prefix}_${safeSlug}`;
}

/**
 * Publishes a new order to the cloud relay for immediate delivery to the cinema's kitchen
 */
export async function publishCloudOrder(order) {
  if (!order) return null;

  const cinemaSlug = order.theatre_slug || resolveCinema(order.theatre_name || order.theatre_id)?.slug || 'pvr-grand';
  const topic = getCinemaTopic(cinemaSlug, 'kitchen');

  const payload = {
    type: 'new_order',
    cinemaSlug,
    order,
    timestamp: Date.now()
  };

  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Title': `New In-Seat Order: ${order.order_number || 'CB'} (${order.seat_code || 'Seat'})`,
        'X-Priority': 'urgent',
        'X-Tags': 'popcorn,bell'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn(`Cloud order publish returned status ${res.status}`);
    }
  } catch (err) {
    console.warn('Cloud order publish network warning (offline or blocked):', err);
  }

  return payload;
}

/**
 * Publishes order status transition (received -> preparing -> ready -> delivered)
 * from Kitchen PC to Customer Mobile Phone
 */
export async function publishCloudStatusUpdate({ cinemaSlug, orderId, orderNumber, status }) {
  const safeSlug = cinemaSlug || 'pvr-grand';
  const topic = getCinemaTopic(safeSlug, 'status');

  const payload = {
    type: 'status_update',
    cinemaSlug: safeSlug,
    orderId,
    orderNumber,
    status,
    timestamp: Date.now()
  };

  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Title': `Order ${orderNumber || orderId} is now ${status.toUpperCase()}`,
        'X-Priority': 'high',
        'X-Tags': 'chef,bell'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Cloud status publish network warning:', err);
  }

  return payload;
}

/**
 * Subscribes a Kitchen Dashboard on PC/Tablet to orders for their specific cinema
 */
export function subscribeToCinemaKitchenCloud({ cinemaSlug, onOrder, onStatusUpdate }) {
  const safeSlug = cinemaSlug || 'pvr-grand';
  const kitchenTopic = getCinemaTopic(safeSlug, 'kitchen');
  const statusTopic = getCinemaTopic(safeSlug, 'status');

  let isDestroyed = false;
  let kitchenEventSource = null;
  let statusEventSource = null;

  // 1. Poll past orders from the last 12 hours so recent orders appear immediately on page load/reload!
  const fetchRecentOrders = async () => {
    try {
      const res = await fetch(`https://ntfy.sh/${kitchenTopic}/json?poll=1&since=12h`);
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const raw = JSON.parse(line);
            if (raw.message) {
              const parsedMsg = typeof raw.message === 'string' ? JSON.parse(raw.message) : raw.message;
              if (parsedMsg?.type === 'new_order' && parsedMsg?.order && onOrder) {
                onOrder(parsedMsg.order, true); // true = isHistorical
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Could not poll past cloud orders:', e);
    }
  };

  fetchRecentOrders();

  // 2. Open Live Server-Sent Events (SSE) Stream for Instant Zero-Delay Delivery
  try {
    kitchenEventSource = new EventSource(`https://ntfy.sh/${kitchenTopic}/sse`);
    kitchenEventSource.onmessage = (event) => {
      if (isDestroyed) return;
      try {
        const raw = JSON.parse(event.data);
        if (raw?.message) {
          const parsedMsg = typeof raw.message === 'string' ? JSON.parse(raw.message) : raw.message;
          if (parsedMsg?.type === 'new_order' && parsedMsg?.order && onOrder) {
            onOrder(parsedMsg.order, false);
          }
        }
      } catch (err) {
        // silent parse skip
      }
    };
    kitchenEventSource.onerror = () => {
      // EventSource automatically attempts auto-reconnect
    };
  } catch (err) {
    console.warn('EventSource SSE connection failed:', err);
  }

  // 3. Status updates stream
  try {
    statusEventSource = new EventSource(`https://ntfy.sh/${statusTopic}/sse`);
    statusEventSource.onmessage = (event) => {
      if (isDestroyed) return;
      try {
        const raw = JSON.parse(event.data);
        if (raw?.message) {
          const parsedMsg = typeof raw.message === 'string' ? JSON.parse(raw.message) : raw.message;
          if (parsedMsg?.type === 'status_update' && onStatusUpdate) {
            onStatusUpdate(parsedMsg);
          }
        }
      } catch (e) {}
    };
  } catch (err) {}

  // Return unsubscribe cleanup function
  return () => {
    isDestroyed = true;
    if (kitchenEventSource) {
      try { kitchenEventSource.close(); } catch (e) {}
    }
    if (statusEventSource) {
      try { statusEventSource.close(); } catch (e) {}
    }
  };
}

/**
 * Subscribes Customer Phone to status updates for their specific order
 */
export function subscribeCustomerOrderStatusCloud({ cinemaSlug, orderId, orderNumber, onStatusChange }) {
  const safeSlug = cinemaSlug || 'pvr-grand';
  const statusTopic = getCinemaTopic(safeSlug, 'status');

  let isDestroyed = false;
  let statusEventSource = null;

  const matches = (incomingId, incomingNumber) => {
    const targetId = String(orderId || '').trim().toLowerCase();
    const targetNum = String(orderNumber || '').trim().toLowerCase();
    const inId = String(incomingId || '').trim().toLowerCase();
    const inNum = String(incomingNumber || '').trim().toLowerCase();

    return (targetId && (targetId === inId || targetId === inNum)) ||
           (targetNum && (targetNum === inId || targetNum === inNum));
  };

  try {
    statusEventSource = new EventSource(`https://ntfy.sh/${statusTopic}/sse`);
    statusEventSource.onmessage = (event) => {
      if (isDestroyed) return;
      try {
        const raw = JSON.parse(event.data);
        if (raw?.message) {
          const parsedMsg = typeof raw.message === 'string' ? JSON.parse(raw.message) : raw.message;
          if (parsedMsg?.type === 'status_update' && matches(parsedMsg.orderId, parsedMsg.orderNumber)) {
            if (onStatusChange && parsedMsg.status) {
              onStatusChange(parsedMsg.status);
            }
          }
        }
      } catch (e) {}
    };
  } catch (err) {
    console.warn('Customer status SSE connection warning:', err);
  }

  return () => {
    isDestroyed = true;
    if (statusEventSource) {
      try { statusEventSource.close(); } catch (e) {}
    }
  };
}
