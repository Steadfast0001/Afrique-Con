import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getCampayToken(env) {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }
  const username = env.CAMPAY_USERNAME || process.env.CAMPAY_USERNAME;
  const password = env.CAMPAY_PASSWORD || process.env.CAMPAY_PASSWORD;

  if (!username || !password) {
    return null;
  }

  const baseUrl = (env.CAMPAY_ENV || process.env.CAMPAY_ENV) === 'prod' ? 'https://www.campay.net/api' : 'https://demo.campay.net/api';

  const res = await fetch(`${baseUrl}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  cachedToken = data.token;
  tokenExpiresAt = now + ((data.expires_in || 3600) * 1000);
  return cachedToken;
}

const mockTransactions = new Map();

const campayDevMiddleware = (env) => ({
  name: 'campay-dev-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/api/campay-collect' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const token = await getCampayToken(env);

            if (!token) {
              const mockRef = 'mock-ref-' + Date.now();
              mockTransactions.set(mockRef, {
                status: 'SUCCESSFUL',
                amount: parsed.amount || '5000',
                created: Date.now()
              });
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                reference: mockRef,
                status: 'PENDING',
                operator: 'MTN',
                message: 'Mock payment initiated (Test Environment)'
              }));
              return;
            }

            const baseUrl = (env.CAMPAY_ENV || process.env.CAMPAY_ENV) === 'prod' ? 'https://www.campay.net/api' : 'https://demo.campay.net/api';
            const campayRes = await fetch(`${baseUrl}/collect/`, {
              method: 'POST',
              headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                amount: String(parsed.amount || '25'),
                currency: parsed.currency || 'XAF',
                from: parsed.from,
                description: parsed.description || 'TransitFlow Booking',
                external_reference: parsed.external_reference || ('tf-' + Date.now())
              })
            });

            const data = await campayRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = campayRes.status;
            res.end(data);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      if (req.url.startsWith('/api/campay-status') && req.method === 'GET') {
        const urlObj = new URL(req.url, 'http://localhost');
        const ref = urlObj.searchParams.get('ref');
        if (!ref) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Missing ref parameter' }));
          return;
        }

        if (mockTransactions.has(ref)) {
          const tx = mockTransactions.get(ref);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            reference: ref,
            status: 'SUCCESSFUL',
            amount: tx.amount,
            currency: 'XAF',
            operator: 'MTN'
          }));
          return;
        }

        try {
          const token = await getCampayToken(env);
          if (!token) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              reference: ref,
              status: 'SUCCESSFUL',
              amount: '5000',
              currency: 'XAF',
              operator: 'MTN'
            }));
            return;
          }
          const baseUrl = (env.CAMPAY_ENV || process.env.CAMPAY_ENV) === 'prod' ? 'https://www.campay.net/api' : 'https://demo.campay.net/api';
          const campayRes = await fetch(`${baseUrl}/transaction/${ref}/`, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await campayRes.text();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = campayRes.status;
          res.end(data);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), campayDevMiddleware(env)],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  };
});
