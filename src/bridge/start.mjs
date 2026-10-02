import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createProvider } from './providers/index.mjs';
import { Store } from './store.mjs';
import { Service } from './service.mjs';
import { createTracer } from './tracing.mjs';
import { createBridgeServer } from './server.mjs';

// Do not load service credentials into the CLI environment. Keep the caller's
// HOME, PATH, CODEX_HOME, SSH_AUTH_SOCK and integration variables unchanged.
const environment = { ...process.env };
const env = { ...parseEnv(readFileSync('.env', 'utf8')), ...environment };
const providerName = env.AI_PROVIDER || 'codex';
const model = env.AI_MODEL || undefined;
if (providerName === 'openai-api' && !model) throw new Error('Set AI_MODEL for openai-api.');
for (const name of ['LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY', 'SECRET_BRIDGE_TOKEN'])
  if (!env[name]) throw new Error(`Missing configuration: ${name}. Run npm run bridge:setup.`);
const timeoutMs = Number(env.REQUEST_TIMEOUT_MS || 1800000);
const port = Number(env.BRIDGE_PORT || 8787);
if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 1800000) throw new Error('REQUEST_TIMEOUT_MS must be 1–1800000.');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid BRIDGE_PORT.');
const service = new Service({
  provider: createProvider(providerName, { model, workspace: env.CODEX_WORKSPACE_ID,
    executable: env.CODEX_BIN || 'codex', environment, directory: env.CODEX_WORKING_DIRECTORY || process.cwd(), key: env.OPENAI_API_KEY, keyFile: env.OPENAI_API_KEY_FILE }),
  providerName, model: model || 'configured-default',
  store: new Store(env.DATA_DIR || '.local/bridge'),
  trace: createTracer({ url: env.LANGFUSE_URL || 'http://localhost:3001', publicKey: env.LANGFUSE_PUBLIC_KEY, secretKey: env.LANGFUSE_SECRET_KEY }),
  publicUrl: env.LANGFUSE_PUBLIC_URL || 'http://localhost:3001', projectId: env.LANGFUSE_PROJECT_ID || 'local-ai',
  enabled: env.INFERENCE_ENABLED === 'true', timeoutMs
});
const server = createBridgeServer({ service, token: Buffer.from(env.SECRET_BRIDGE_TOKEN, 'base64').toString('utf8'), providerName });
server.listen(port, env.BRIDGE_HOST || '127.0.0.1', () => console.log(`Local bridge ready on port ${port} (${providerName}); inference enabled: ${service.enabled}`));
const flushTimer = setInterval(() => service.flush().catch(() => console.error('Trace delivery pending')), 15000).unref();

for (const event of ['SIGTERM', 'SIGINT']) process.once(event, () => {
  clearInterval(flushTimer);
  service.cancel();
  server.close();
});
