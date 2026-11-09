import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function cinebiteSyncPlugin() {
  let customItems = [];
  let outOfStockIds = [];
  let updatedAt = Date.now();
  const sseClients = new Set();

  return {
    name: 'cinebite-sync-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/cinebite-sync') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ customItems, outOfStockIds, updatedAt }));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                if (Array.isArray(data.customItems)) {
                  customItems = data.customItems;
                } else if (data.item && data.item.id) {
                  customItems = [data.item, ...customItems.filter((it) => String(it.id) !== String(data.item.id))];
                }
                if (Array.isArray(data.outOfStockIds)) {
                  outOfStockIds = data.outOfStockIds;
                }
                updatedAt = data.updatedAt || Date.now();

                const payload = JSON.stringify({ customItems, outOfStockIds, item: data.item, updatedAt });
                for (const client of sseClients) {
                  try {
                    client.write(`data: ${payload}\n\n`);
                  } catch (e) {}
                }
              } catch (e) {}
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ ok: true, count: customItems.length, updatedAt }));
            });
            return;
          }
        } else if (url === '/api/cinebite-stream') {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (typeof res.flushHeaders === 'function') res.flushHeaders();

          try {
            res.write(`data: ${JSON.stringify({ customItems, outOfStockIds, updatedAt })}\n\n`);
          } catch (e) {}
          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cinebiteSyncPlugin()],
  server: {
    port: 5173,
    host: true
  }
})

