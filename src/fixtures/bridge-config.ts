import type { AppConfig } from '../types/app-config.types.ts';

export const bridgeConfig: AppConfig = {
  providerName: 'codex', model: 'test', providerOptions: {},
  http: { host: '127.0.0.1', port: 8787, token: 'test-only-token-'.repeat(4) },
  execution: { enabled: true, timeoutMs: 30_000 },
  langfuse: {
    url: 'http://localhost:3001', publicUrl: 'http://localhost:3001',
    projectId: 'agent-workflows', environment: undefined, publicKey: '', secretKey: '',
  },
};
