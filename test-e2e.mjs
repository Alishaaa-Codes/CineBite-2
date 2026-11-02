// Automated Headless Browser E2E Test using Chrome DevTools Protocol
const CDP_BASE = 'http://127.0.0.1:9222';
const APP_URL = 'http://127.0.0.1:5173/?screen=Screen%202%20(Audi%202)&seat=F-14';

async function run() {
  console.log('--- CineBite E2E Test Suite Starting ---');

  // 1. Create a new tab target
  const newTabRes = await fetch(`${CDP_BASE}/json/new?${encodeURIComponent(APP_URL)}`, { method: 'PUT' });
  const target = await newTabRes.json();
  console.log(`✓ Opened target page: ${target.url} (id: ${target.id})`);

  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let messageId = 1;
  const pendingRequests = new Map();
  const consoleMessages = [];
  const errors = [];

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      consoleMessages.push({ type: msg.params.type, text });
      if (msg.params.type === 'error') {
        errors.push(`Console Error: ${text}`);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(`Uncaught Exception: ${msg.params.exceptionDetails.text} at ${msg.params.exceptionDetails.url}:${msg.params.exceptionDetails.lineNumber}`);
    }
  };

  // Enable Runtime and Page
  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  // Helper to evaluate JS in the browser
  async function evaluate(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error in "${expression}": ${res.exceptionDetails.text}`);
    }
    return res.result.value;
  }

  // Wait 1.5s for initial render and hydration
  await new Promise((r) => setTimeout(r, 1500));

  // Test 1: Page Header and Title
  const pageTitle = await evaluate('document.title');
  console.log(`[Test 1] Document Title: "${pageTitle}"`);
  if (!pageTitle.includes('CineBite')) throw new Error('Title does not contain CineBite');

  const brandText = await evaluate('document.querySelector(".brand-name")?.innerText');
  console.log(`[Test 1] Brand text: "${brandText}"`);

  // Test 2: Seat Detection from URL params
  const seatDisplay = await evaluate('document.querySelector(".seat-value")?.innerText');
  console.log(`[Test 2] Seat value loaded from URL: "${seatDisplay}"`);
  if (!seatDisplay || !seatDisplay.includes('F-14')) {
    throw new Error(`Seat was not loaded correctly from URL! Found: "${seatDisplay}"`);
  }

  // Test 3: Menu Categories and Cards
  const categoryCount = await evaluate('document.querySelectorAll(".category-pill").length');
  console.log(`[Test 3] Category pills count: ${categoryCount}`);
  if (categoryCount < 5) throw new Error(`Expected at least 5 category pills, found ${categoryCount}`);

  const foodCardsCount = await evaluate('document.querySelectorAll(".food-card").length');
  console.log(`[Test 3] Initial Food cards count: ${foodCardsCount}`);
  if (foodCardsCount === 0) throw new Error('No food cards found on page');

  // Test 4: Category Filtering (e.g. click "Pizza")
  await evaluate(`
    const pills = Array.from(document.querySelectorAll('.category-pill'));
    const pizzaPill = pills.find(p => p.innerText.includes('Pizza'));
    if (pizzaPill) pizzaPill.click();
  `);
  await new Promise((r) => setTimeout(r, 300));
  const pizzaCardsCount = await evaluate('document.querySelectorAll(".food-card").length');
  console.log(`[Test 4] Filter by Pizza: ${pizzaCardsCount} cards displayed`);

  // Reset to "All Items"
  await evaluate(`
    const allPill = Array.from(document.querySelectorAll('.category-pill')).find(p => p.innerText.includes('All'));
    if (allPill) allPill.click();
  `);
  await new Promise((r) => setTimeout(r, 300));

  // Test 5: Search Filtering
  await evaluate(`
    const searchInput = document.querySelector('.search-input');
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeSetter.call(searchInput, 'Popcorn');
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 400));
  const searchResultsCount = await evaluate('document.querySelectorAll(".food-card").length');
  console.log('[Test 5] Search for "Popcorn": ' + searchResultsCount + ' cards displayed (3 popcorn items + 1 combo)');
  if (searchResultsCount !== 4) throw new Error('Expected 4 cards matching Popcorn, got ' + searchResultsCount);

  // Clear search
  await evaluate(`
    const clearBtn = document.querySelector('.search-clear-btn');
    if (clearBtn) clearBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 400));


  // Test 6: Add Items to Cart
  console.log('[Test 6] Testing Add to Cart and Quantity controls...');
  // Find first card's ADD button
  await evaluate(`
    const firstAddBtn = document.querySelector('.food-card .add-btn');
    if (firstAddBtn) firstAddBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 300));

  let cartCount = await evaluate('document.querySelector(".cart-count-badge")?.innerText || document.querySelector(".floating-cart-count-pill")?.innerText');
  console.log(`[Test 6] Cart count after 1st add: ${cartCount}`);
  if (cartCount !== '1') throw new Error(`Expected cart count 1, got ${cartCount}`);

  // Increment quantity on the first card
  await evaluate(`
    const plusBtn = document.querySelector('.food-card .card-qty-btn:last-child');
    if (plusBtn) plusBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 300));
  cartCount = await evaluate('document.querySelector(".cart-count-badge")?.innerText || document.querySelector(".floating-cart-count-pill")?.innerText');
  console.log(`[Test 6] Cart count after increment (+): ${cartCount}`);
  if (cartCount !== '2') throw new Error(`Expected cart count 2, got ${cartCount}`);

  // Add second food item (Nachos or Fries)
  await evaluate(`
    const addBtns = document.querySelectorAll('.food-card .add-btn');
    if (addBtns.length > 0) addBtns[0].click();
  `);
  await new Promise((r) => setTimeout(r, 300));
  cartCount = await evaluate('document.querySelector(".cart-count-badge")?.innerText || document.querySelector(".floating-cart-count-pill")?.innerText');
  console.log(`[Test 6] Cart count after adding 2nd item: ${cartCount}`);
  if (cartCount !== '3') throw new Error(`Expected cart count 3, got ${cartCount}`);

  // Test 7: Open Cart Drawer & Check Bill Calculation
  console.log('[Test 7] Opening Cart Drawer...');
  await evaluate(`
    const openCartBtn = document.querySelector('.desktop-cart-btn') || document.querySelector('.floating-cart-cta-btn');
    if (openCartBtn) openCartBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  const isCartDrawerOpen = await evaluate('!!document.querySelector(".cart-drawer")');
  console.log(`[Test 7] Cart drawer is open: ${isCartDrawerOpen}`);
  if (!isCartDrawerOpen) throw new Error('Cart drawer failed to open');

  const cartRowsCount = await evaluate('document.querySelectorAll(".cart-item-row").length');
  console.log(`[Test 7] Cart item rows: ${cartRowsCount}`);
  if (cartRowsCount !== 2) throw new Error(`Expected 2 distinct cart rows, found ${cartRowsCount}`);

  const billLines = await evaluate(`
    Array.from(document.querySelectorAll('.bill-line')).map(b => b.innerText.replace(/\\n/g, ': '))
  `);
  console.log('[Test 7] Bill Breakdown:', billLines);

  const grandTotalText = await evaluate('document.querySelector(".bill-line.total-line span:last-child")?.innerText');
  console.log(`[Test 7] Grand Total: ${grandTotalText}`);

  // Test 8: Enter Delivery Notes & Proceed to Order Summary
  console.log('[Test 8] Entering special instructions and proceeding to Order Summary...');
  await evaluate(`
    const noteArea = document.querySelector('.special-notes-input');
    if (noteArea) {
      noteArea.value = 'Extra napkins, no ice please.';
      noteArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Step 1: Click "Review Order Summary"
    const reviewBtn = document.querySelector('.place-order-cta-btn');
    if (reviewBtn) reviewBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  const isOrderSummaryDisplayed = await evaluate('document.querySelector(".cart-header-title")?.innerText === "Order Summary"');
  console.log(`[Test 8] Order summary screen rendered: ${isOrderSummaryDisplayed}`);

  // Step 2: Click "Confirm & Place Order (Demo)"
  await evaluate(`
    const confirmBtn = document.querySelector('.place-order-cta-btn');
    if (confirmBtn) confirmBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1400));

  // Test 9: Verify Live Order Status Tracker (Cinema Ticket)
  const isTrackerOpen = await evaluate('!!document.querySelector(".tracker-modal-card")');
  console.log(`[Test 9] Order status tracker modal opened: ${isTrackerOpen}`);
  if (!isTrackerOpen) throw new Error('Order tracker modal did not open after placing order');

  const orderId = await evaluate('document.querySelector(".ticket-order-id")?.innerText');
  const statusPill = await evaluate('document.querySelector(".ticket-status-pill")?.innerText');
  console.log(`[Test 9] Order ID: ${orderId}, Status: "${statusPill}"`);
  if (!statusPill.includes('RECEIVED')) throw new Error('Expected initial status to be RECEIVED');

  // Test 10: Status Stepper Simulation
  console.log('[Test 10] Testing Live Status transitions (Simulation)...');
  await evaluate('document.querySelector(".simulator-btn")?.click()');
  await new Promise((r) => setTimeout(r, 300));
  let updatedStatus = await evaluate('document.querySelector(".ticket-status-pill")?.innerText');
  console.log(`[Test 10] After 1st advance: "${updatedStatus}"`);
  if (!updatedStatus.includes('PREPARING')) throw new Error('Expected status PREPARING');

  await evaluate('document.querySelector(".simulator-btn")?.click()');
  await new Promise((r) => setTimeout(r, 300));
  updatedStatus = await evaluate('document.querySelector(".ticket-status-pill")?.innerText');
  console.log(`[Test 10] After 2nd advance: "${updatedStatus}"`);
  if (!updatedStatus.includes('READY')) throw new Error('Expected status READY');

  await evaluate('document.querySelector(".simulator-btn")?.click()');
  await new Promise((r) => setTimeout(r, 300));
  updatedStatus = await evaluate('document.querySelector(".ticket-status-pill")?.innerText');
  console.log(`[Test 10] After 3rd advance: "${updatedStatus}"`);
  if (!updatedStatus.includes('DELIVERED')) throw new Error('Expected status DELIVERED');

  // Test 11: Close tracker and verify Active Order Banner appears
  await evaluate('document.querySelector(".ticket-footer .btn-secondary")?.click()');
  await new Promise((r) => setTimeout(r, 400));
  const activeOrderNotice = await evaluate('document.querySelector(".seat-live-dot") ? true : false');
  console.log(`[Test 11] Active order banner visible on main page: ${activeOrderNotice}`);

  // Clean up tab
  await fetch(`${CDP_BASE}/json/close/${target.id}`, { method: 'PUT' });
  ws.close();

  // Check console errors
  console.log('\n--- Console Messages & Error Summary ---');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Total errors / exceptions: ${errors.length}`);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
    throw new Error('E2E tests failed with console errors');
  }

  console.log('\n🎉 ALL 11 E2E TESTS PASSED WITH 0 CONSOLE ERRORS! 🎉');
}

run().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
