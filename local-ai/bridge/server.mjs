import { createServer } from 'node:http';
import { createProvider } from './providers/index.mjs';
import { Store } from './store.mjs';
import { Service } from './service.mjs';
import { createTracer } from './tracing.mjs';

const env = process.env;
for (const name of ['AI_PROVIDER', 'AI_MODEL', 'LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY'])
  if (!env[name]) throw new Error(`Missing configuration: ${name}`);
const service = new Service({
  provider: createProvider(env.AI_PROVIDER, { model: env.AI_MODEL, workspace: env.CODEX_WORKSPACE_ID,
    authDir: env.CODEX_HOME, keyFile: env.OPENAI_API_KEY_FILE }),
  providerName: env.AI_PROVIDER, model: env.AI_MODEL,
  store: new Store(env.DATA_DIR ?? '/data'),
  trace: createTracer({ url: env.LANGFUSE_URL, publicKey: env.LANGFUSE_PUBLIC_KEY, secretKey: env.LANGFUSE_SECRET_KEY }),
  publicUrl: env.LANGFUSE_PUBLIC_URL, projectId: env.LANGFUSE_PROJECT_ID,
  enabled: env.INFERENCE_ENABLED === 'true', timeoutMs: Number(env.REQUEST_TIMEOUT_MS ?? 90000)
});
const reply = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return reply(res, 200, { status: 'ok', provider: env.AI_PROVIDER, inferenceEnabled: service.enabled });
  if (req.method !== 'POST' || req.url !== '/generate') return reply(res, 404, { error: 'not_found' });
  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 65536) { reply(res, 413, { error: 'body_too_large' }); return; }
    }
    let parsed;
    try { parsed = req.headers['content-type']?.startsWith('text/plain') ? { prompt: body, requestId: req.headers['x-request-id'] } : JSON.parse(body); } catch { return reply(res, 400, { error: 'invalid_json' }); }
    const result = await service.run(parsed);
    reply(res, 200, result);
  } catch (error) {
    const statuses = { conflict: 409, busy: 429, disabled: 503, invalid_input: 400 };
    reply(res, statuses[error.code] ?? 500, { error: error.code ?? 'internal_error', message: statuses[error.code] ? error.message : 'Local service failed.' });
  }
});
server.requestTimeout = 120000;
server.listen(8080, '0.0.0.0', () => console.log(`Local AI bridge ready (${env.AI_PROVIDER}); inference enabled: ${service.enabled}`));
setInterval(() => service.flush().catch(() => console.error('Trace delivery pending')), 15000).unref();
