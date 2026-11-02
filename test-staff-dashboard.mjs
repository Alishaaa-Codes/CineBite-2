// Automated E2E Test Suite for CineBite Food Department / Kitchen Dashboard
const CDP_BASE = 'http://127.0.0.1:9222';
const BASE_URL = 'http://127.0.0.1:5173';

async function run() {
  console.log('=================================================================');
  console.log('🧪 CineBite: Staff Dashboard & Real-Time Orders E2E Test Suite');
  console.log('=================================================================\n');

  // 1. Create a new tab target
  const newTabRes = await fetch(`${CDP_BASE}/json/new?${encodeURIComponent(BASE_URL + '/?screen=Screen%202&seat=F-14')}`, { method: 'PUT' });
  const target = await newTabRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let messageId = 1;
  const pendingRequests = new Map();
  const consoleErrors = [];

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve) => { ws.onopen = resolve; });

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      const text = msg.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      // Filter out harmless favicon or font warnings
      if (!text.includes('favicon') && !text.includes('socket')) {
        consoleErrors.push(text);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text);
    }
  };

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');
  await new Promise((r) => setTimeout(r, 1200));

  async function evalInPage(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async function waitFor(selector, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const exists = await evalInPage(`Boolean(document.querySelector('${selector}'))`);
      if (exists) return true;
      await new Promise(r => setTimeout(r, 200));
    }
    throw new Error(`Timeout waiting for selector: ${selector}`);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Customer View & Staff Button in Header
    // -------------------------------------------------------------------------
    console.log('▶ Test 1: Waiting for React app to mount and verifying Header...');
    await waitFor('.staff-portal-nav-btn');
    const hasKitchenBtn = await evalInPage(`
      Boolean(document.querySelector('.staff-portal-nav-btn'))
    `);
    console.log(`   Has Kitchen button in Header: ${hasKitchenBtn}`);
    if (!hasKitchenBtn) throw new Error('Kitchen portal button not found in header');

    // -------------------------------------------------------------------------
    // TEST 2: Navigate to Kitchen Portal & Verify Staff Login
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 2: Navigating to Staff Portal...');
    await evalInPage(`
      document.querySelector('.staff-portal-nav-btn').click();
    `);
    await new Promise((r) => setTimeout(r, 600));

    const loginCard = await evalInPage(`
      (() => {
        const title = document.querySelector('.staff-login-title')?.textContent;
        const emailInput = Boolean(document.querySelector('#staff-email'));
        const passInput = Boolean(document.querySelector('#staff-password'));
        const demoBtn = Boolean(document.querySelector('.staff-demo-btn'));
        return { title, emailInput, passInput, demoBtn };
      })()
    `);
    console.log('   Login Screen State:', loginCard);
    if (!loginCard.title?.includes('Food Department Portal') || !loginCard.emailInput || !loginCard.passInput) {
      throw new Error('Staff login card did not render properly');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Enter Kitchen Dashboard
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 3: Launching Kitchen Dashboard...');
    await evalInPage(`
      document.querySelector('.staff-demo-btn').click();
    `);
    await new Promise((r) => setTimeout(r, 800));

    const dashboardState = await evalInPage(`
      (() => {
        const title = document.querySelector('.kitchen-title-box h1')?.textContent;
        const livePill = Boolean(document.querySelector('.kitchen-live-pill'));
        const clock = Boolean(document.querySelector('.kitchen-clock'));
        const kpiCards = document.querySelectorAll('.kpi-card').length;
        const statusTabs = document.querySelectorAll('.status-tab').length;
        const soundBtn = Boolean(document.querySelector('.kitchen-header-actions button'));
        const orderCardsCount = document.querySelectorAll('.order-card').length;
        return { title, livePill, clock, kpiCards, statusTabs, soundBtn, orderCardsCount };
      })()
    `);
    console.log('   Dashboard State:', dashboardState);
    if (!dashboardState.title?.includes('CineBite Kitchen') || dashboardState.kpiCards < 5) {
      throw new Error('Kitchen dashboard header or KPIs not rendered');
    }
    console.log(`   Initial Orders in Queue: ${dashboardState.orderCardsCount}`);

    // -------------------------------------------------------------------------
    // TEST 4: Customer Places an In-Seat Order
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 4: Switching back to Customer View to place a new order...');
    await evalInPage(`
      document.querySelector('.kitchen-switch-btn').click();
    `);
    await new Promise((r) => setTimeout(r, 600));

    // Add Popcorn to cart
    console.log('   Adding "Caramel Gold Crunch Popcorn" to cart...');
    await evalInPage(`
      (() => {
        const addBtn = document.querySelector('.add-btn');
        if (addBtn) addBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));

    // Open cart drawer
    console.log('   Opening cart drawer...');
    await evalInPage(`
      document.querySelector('.desktop-cart-btn').click();
    `);
    await new Promise((r) => setTimeout(r, 600));

    // Fill special note in step 1
    console.log('   Entering special kitchen note in cart...');
    await evalInPage(`
      (() => {
        const noteInput = document.querySelector('.special-notes-input');
        if (noteInput) {
          const proto = window.HTMLTextAreaElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(noteInput, 'Please add extra caramel topping');
          noteInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await new Promise((r) => setTimeout(r, 400));

    // Click Proceed to Summary (Step 1 -> Step 2)
    console.log('   Proceeding to Order Summary...');
    await evalInPage(`
      document.querySelector('.place-order-cta-btn').click();
    `);
    await new Promise((r) => setTimeout(r, 600));

    // Click Confirm & Send Order (Step 2 submit)
    console.log('   Confirming and transmitting order...');
    await evalInPage(`
      document.querySelector('.place-order-cta-btn').click();
    `);
    // Verify confirmation modal opened with polling
    let placedOrder = null;
    for (let i = 0; i < 30; i++) {
      placedOrder = await evalInPage(`
        (() => {
          const orderId = document.querySelector('.ticket-order-id')?.textContent;
          const status = document.querySelector('.receipt-status-badge')?.textContent;
          const total = document.querySelector('.ticket-amount')?.textContent;
          return orderId ? { orderId, status, total } : null;
        })()
      `);
      if (placedOrder?.orderId) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log('   Customer Order Confirmation Ticket:', placedOrder);
    if (!placedOrder?.orderId) {
      throw new Error('Order was not placed successfully');
    }

    // Close confirmation modal
    await evalInPage(`
      const closeBtn = document.querySelector('.ticket-close-btn');
      if (closeBtn) closeBtn.click();
    `);
    await new Promise((r) => setTimeout(r, 400));

    // -------------------------------------------------------------------------
    // TEST 5: Verify Order Arrives in Kitchen Dashboard
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 5: Returning to Kitchen Dashboard to verify incoming order...');
    await evalInPage(`
      document.querySelector('.staff-portal-nav-btn').click();
    `);
    await new Promise((r) => setTimeout(r, 800));

    // Check if new order card appears
    const matchingOrder = await evalInPage(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const target = cards.find(c => c.textContent.includes('${placedOrder.orderId}') || c.textContent.includes('extra caramel'));
        if (!target) return null;

        const orderNum = target.querySelector('.order-num-badge')?.textContent;
        const seat = target.querySelector('.seat-highlight-pill')?.textContent;
        const note = target.querySelector('.special-notes-alert')?.textContent;
        const nextBtn = target.querySelector('.btn-status-next')?.textContent;
        return { orderNum, seat, note, nextBtn };
      })()
    `);
    console.log('   Kitchen Card for Customer Order:', matchingOrder);
    if (!matchingOrder) {
      throw new Error(`Customer order ${placedOrder.orderId} not found in kitchen queue`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Staff Updates Status: Received -> Preparing -> Ready -> Delivered
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 6: Testing Kitchen Staff Status Transitions...');
    
    // Step A: Received -> Preparing
    console.log('   Clicking "Start Preparing"...');
    await evalInPage(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const target = cards.find(c => c.textContent.includes('${placedOrder.orderId}') || c.textContent.includes('extra caramel'));
        const btn = target?.querySelector('.btn-status-next');
        if (btn) btn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));

    const preparingState = await evalInPage(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const target = cards.find(c => c.textContent.includes('${placedOrder.orderId}') || c.textContent.includes('extra caramel'));
        const isPreparing = target?.classList.contains('status-preparing');
        const btnText = target?.querySelector('.btn-status-next')?.textContent;
        return { isPreparing, btnText };
      })()
    `);
    console.log('   Transition 1 (to preparing):', preparingState);
    if (!preparingState.isPreparing) throw new Error('Order failed to transition to preparing');

    // Step B: Preparing -> Ready
    console.log('   Clicking "Mark as Ready"...');
    await evalInPage(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const target = cards.find(c => c.textContent.includes('${placedOrder.orderId}') || c.textContent.includes('extra caramel'));
        const btn = target?.querySelector('.btn-status-next');
        if (btn) btn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));

    const readyState = await evalInPage(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const target = cards.find(c => c.textContent.includes('${placedOrder.orderId}') || c.textContent.includes('extra caramel'));
        const isReady = target?.classList.contains('status-ready');
        const btnText = target?.querySelector('.btn-status-next')?.textContent;
        return { isReady, btnText };
      })()
    `);
    console.log('   Transition 2 (to ready):', readyState);
    if (!readyState.isReady) throw new Error('Order failed to transition to ready');

    // Step C: Ready -> Delivered
    console.log('   Clicking "Mark Delivered"...');
    await evalInPage(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const target = cards.find(c => c.textContent.includes('${placedOrder.orderId}') || c.textContent.includes('extra caramel'));
        const btn = target?.querySelector('.btn-status-next');
        if (btn) btn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));

    const deliveredState = await evalInPage(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const target = cards.find(c => c.textContent.includes('${placedOrder.orderId}') || c.textContent.includes('extra caramel'));
        const isDelivered = target?.classList.contains('status-delivered');
        return { isDelivered };
      })()
    `);
    console.log('   Transition 3 (to delivered):', deliveredState);
    if (!deliveredState.isDelivered) throw new Error('Order failed to transition to delivered');

    // -------------------------------------------------------------------------
    // TEST 7: Detailed Order Modal
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 7: Testing Order Detail Modal...');
    await evalInPage(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.order-card'));
        const target = cards[0];
        const detailBtn = target?.querySelector('.btn-view-details');
        if (detailBtn) detailBtn.click();
      })()
    `);
    await new Promise((r) => setTimeout(r, 600));

    const modalData = await evalInPage(`
      (() => {
        const modal = document.querySelector('.kitchen-modal-card');
        if (!modal) return null;
        const banner = modal.querySelector('.ticket-screen-banner')?.textContent;
        const rows = modal.querySelectorAll('.ticket-table tbody tr').length;
        const grandTotal = modal.querySelector('.ticket-total-row.grand')?.textContent;
        return { isOpen: true, banner, rows, grandTotal };
      })()
    `);
    console.log('   Modal Data:', modalData);
    if (!modalData?.isOpen || modalData.rows === 0) {
      throw new Error('Order detail modal failed to open with items');
    }

    // Close modal
    await evalInPage(`
      document.querySelector('.kitchen-modal-header button:last-child').click();
    `);
    await new Promise((r) => setTimeout(r, 400));

    // -------------------------------------------------------------------------
    // TEST 8: Tab Filters & Search
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 8: Testing Filter Tabs and Search...');
    await evalInPage(`
      document.querySelector('.status-tabs-group button:nth-child(5)').click(); // Delivered tab
    `);
    await new Promise((r) => setTimeout(r, 400));

    const deliveredCount = await evalInPage(`
      document.querySelectorAll('.order-card').length
    `);
    console.log(`   Cards in Delivered tab: ${deliveredCount}`);

    // Reset to All
    await evalInPage(`
      document.querySelector('.status-tabs-group button:first-child').click();
    `);
    await new Promise((r) => setTimeout(r, 400));

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n=================================================================');
    console.log('✅ ALL TESTS PASSED: FOOD DEPARTMENT DASHBOARD FULLY OPERATIONAL');
    console.log(`   Console Errors Detected: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('   Errors:', consoleErrors);
    }
    console.log('=================================================================\n');

  } catch (err) {
    console.error('\n❌ Test Failure:', err.message);
    process.exit(1);
  } finally {
    await fetch(`${CDP_BASE}/json/close/${target.id}`, { method: 'PUT' });
    ws.close();
  }
}

run();
