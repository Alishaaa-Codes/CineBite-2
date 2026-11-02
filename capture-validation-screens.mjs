import fs from 'fs';

const CDP_BASE = 'http://127.0.0.1:9222';
const APP_URL = 'http://127.0.0.1:5173/?screen=Screen%202%20(Audi%202)&seat=F-14';

async function capture() {
  const newTabRes = await fetch(`${CDP_BASE}/json/new?${encodeURIComponent(APP_URL)}`, { method: 'PUT' });
  const target = await newTabRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let messageId = 1;
  const pendingRequests = new Map();

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
    }
  };

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  async function evaluate(expression) {
    const res = await sendCommand('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }

  await new Promise((r) => setTimeout(r, 1200));

  // Add 1 item
  await evaluate('document.querySelector(".food-card .add-btn")?.click()');
  await new Promise((r) => setTimeout(r, 300));

  // Open Cart
  await evaluate('document.querySelector(".floating-cart-bar")?.click()');
  await new Promise((r) => setTimeout(r, 500));

  // Click Review Order Summary
  await evaluate('document.querySelector(".place-order-cta-btn")?.click()');
  await new Promise((r) => setTimeout(r, 500));

  // Capture Step 2: Order Summary
  const snap1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('cinebite-order-summary.png', Buffer.from(snap1.data, 'base64'));
  console.log('Saved cinebite-order-summary.png');

  // Click Confirm & Place Order (Demo)
  await evaluate('document.querySelector(".place-order-cta-btn")?.click()');
  await new Promise((r) => setTimeout(r, 1400)); // wait for simulated async processing

  // Capture Local Demo Ticket
  const snap2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('cinebite-local-demo-ticket.png', Buffer.from(snap2.data, 'base64'));
  console.log('Saved cinebite-local-demo-ticket.png');

  await fetch(`${CDP_BASE}/json/close/${target.id}`, { method: 'PUT' });
  ws.close();
}

capture().catch(console.error);
