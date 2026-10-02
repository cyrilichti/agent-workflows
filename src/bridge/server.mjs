import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

const reply = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
export function createBridgeServer({ service, token, providerName }) {
  if (typeof token !== 'string' || Buffer.byteLength(token) < 32) throw new Error('Configure a bridge token of at least 32 bytes.');
  const expected = Buffer.from(`Bearer ${token}`);
  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') return reply(res, 200, { status: 'ok', provider: providerName, inferenceEnabled: service.enabled });
    const supplied = Buffer.from(req.headers.authorization ?? '');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reply(res, 401, { error: 'unauthorized' });
    if (req.method !== 'POST' || req.url !== '/generate') return reply(res, 404, { error: 'not_found' });
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 65536) { reply(res, 413, { error: 'body_too_large' }); return; }
      }
      let parsed;
      try { parsed = req.headers['content-type']?.startsWith('text/plain')
        ? { prompt: body, requestId: req.headers['x-request-id'] }
        : JSON.parse(body); } catch { return reply(res, 400, { error: 'invalid_json' }); }
      reply(res, 200, await service.run(parsed));
    } catch (error) {
      const statuses = { conflict: 409, busy: 429, disabled: 503, invalid_input: 400 };
      reply(res, statuses[error.code] ?? 500, { error: statuses[error.code] ? error.code : 'internal_error', message: statuses[error.code] ? error.message : 'Local service failed.' });
    }
  });
  server.requestTimeout = 120000; // Limit upload time; task execution has its own deadline.
  return server;
}
