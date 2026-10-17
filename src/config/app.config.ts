import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { DEFAULT_TIMEOUT_MS, PROJECT_ROOT } from './keys.ts';
import type { AppConfig } from '../types/app-config.types.ts';

const env = { ...parseEnv(readFileSync('.env', 'utf8')), ...process.env };

export const appConfig = {
  providerName: env.AI_PROVIDER || 'codex',
  model: env.AI_MODEL || undefined,
  providerOptions: {
    model: env.AI_MODEL || undefined,
    workspace: env.CODEX_WORKSPACE_ID,
    executable: env.CODEX_BIN || 'codex',
    environment: { ...process.env },
    directory: env.CODEX_WORKING_DIRECTORY || PROJECT_ROOT,
    key: env.OPENAI_API_KEY,
    keyFile: env.OPENAI_API_KEY_FILE,
  },
  http: {
    host: env.BRIDGE_HOST || '127.0.0.1',
    port: Number(env.BRIDGE_PORT || 8787),
    token: Buffer.from(env.SECRET_BRIDGE_TOKEN ?? '', 'base64').toString('utf8'),
  },
  execution: {
    enabled: env.INFERENCE_ENABLED === 'true',
    timeoutMs: Number(env.REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
  },
  langfuse: {
    url: env.LANGFUSE_URL || 'http://localhost:3001',
    publicUrl: env.LANGFUSE_PUBLIC_URL || 'http://localhost:3001',
    projectId: env.LANGFUSE_PROJECT_ID || 'agent-workflows',
    environment: env.DEPLOYMENT_ENVIRONMENT?.trim() || undefined,
    publicKey: env.LANGFUSE_PUBLIC_KEY ?? '',
    secretKey: env.LANGFUSE_SECRET_KEY ?? '',
  },
} as const satisfies AppConfig;
