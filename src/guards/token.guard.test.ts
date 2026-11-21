import test from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { tokenGuard } from './token.guard.ts';
import type { AppConfig } from '../types/app-config.types.ts';

test('token guard checks the configuration supplied for the request', () => {
  const bridgeConfig: AppConfig = {
    providerName: 'codex', model: 'test', providerOptions: {},
    http: { host: '127.0.0.1', port: 8787, token: 'test-only-token-'.repeat(4) },
    execution: { enabled: true, timeoutMs: 30_000 },
    langfuse: {
      url: 'http://localhost:3001', publicUrl: 'http://localhost:3001',
      projectId: 'agent-workflows', environment: undefined, publicKey: '', secretKey: '',
    },
  };
  const request = { headers: { authorization: `Bearer ${bridgeConfig.http.token}` } } as IncomingMessage;
  assert.equal(tokenGuard(request, bridgeConfig), true);
  assert.equal(tokenGuard(request, {
    ...bridgeConfig, http: { ...bridgeConfig.http, token: 'another-token-'.repeat(4) },
  }), false);
  for (const authorization of [undefined, '', 'wrong', `bearer ${bridgeConfig.http.token}`]) {
    assert.equal(tokenGuard({ headers: { authorization } } as IncomingMessage, bridgeConfig), false);
  }
});
