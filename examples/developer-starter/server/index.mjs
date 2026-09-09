import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOffersClient, presentOffer, readConfiguration } from './offers.mjs';

export function createStarterServer(config) {
  // Reject invalid SDK configuration before accepting HTTP traffic.
  createOffersClient(config).dispose();
  const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
  return http.createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    if (req.method !== 'GET') { send(405, { error: 'Only GET is supported.' }); return; }
    let url;
    try {
      if (!req.url?.startsWith('/') || req.url.startsWith('//')) throw new Error('Invalid request target');
      url = new URL(req.url, 'http://localhost');
    } catch { send(400, { error: 'Invalid request target.' }); return; }
    if (url.pathname === '/api/config') { send(200, { mode: config.mode }); return; }
    if (url.pathname.startsWith('/api/')) {
      const detail = url.pathname.match(/^\/api\/offers\/([^/]+)$/);
      if (url.pathname !== '/api/offers' && !detail) { send(404, { error: 'Not found.' }); return; }
      const scenario = config.mode === 'fixture' ? url.searchParams.get('scenario') || 'success' : 'success';
      if (!['success', 'empty', 'error', 'auth-error', 'slow'].includes(scenario)) { send(400, { error: 'Unknown demonstration state.' }); return; }
      let slug;
      try {
        slug = detail ? decodeURIComponent(detail[1]) : undefined;
        if (slug !== undefined && (!slug.trim() || ['.', '..'].includes(slug.trim()) || slug.includes('/') || slug.length > 200)) throw new Error('Invalid identifier');
      } catch { send(400, { error: 'Invalid offer identifier.' }); return; }
      let client;
      const abort = new AbortController();
      res.on('close', () => { if (!res.writableEnded) abort.abort(); });
      try {
        client = createOffersClient(config, scenario);
        const result = detail ? await client.offers.getOffer({ slug, request: { signal: abort.signal } }) : await client.offers.listOffers({ limit: 100, request: { signal: abort.signal } });
        send(200, detail ? { offer: presentOffer(result.data, config.mode === 'fixture') } : { offers: (result.data.data || []).map((offer) => presentOffer(offer, config.mode === 'fixture')) });
      } catch (error) {
        if (res.destroyed) return;
        const status = [401, 403, 404, 429].includes(error.status) ? error.status : 502;
        send(status, { error: status === 401 || status === 403 ? 'Sandbox access was rejected. Check your access configuration.' : status === 404 ? 'This offer is no longer available.' : status === 429 ? 'Too many requests. Wait a moment and retry.' : 'Offers are temporarily unavailable. Please retry.' });
      } finally { client?.dispose(); }
      return;
    }
    try {
      const decoded = decodeURIComponent(url.pathname);
      const file = path.resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
      if (!file.startsWith(`${root}${path.sep}`)) { send(404, { error: 'Not found.' }); return; }
      const bytes = await fs.readFile(file);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });res.end(bytes);
    } catch { send(404, { error: 'Not found. Build the starter before starting it.' }); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = readConfiguration(process.env, process.argv.includes('--fixture'));
  const port = Number(process.env.STARTER_PORT || 4300);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('STARTER_PORT must be a valid port.');
  createStarterServer(config).listen(port, '127.0.0.1', () => console.log(`Starter (${config.mode}): http://127.0.0.1:${port}`));
}
