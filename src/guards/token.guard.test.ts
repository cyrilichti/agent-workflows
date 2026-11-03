import test from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { tokenGuard } from './token.guard.ts';
import { bridgeConfig } from '../fixtures/bridge-config.ts';

test('token guard checks the configuration supplied for the request', () => {
  const request = { headers: { authorization: `Bearer ${bridgeConfig.http.token}` } } as IncomingMessage;
  assert.equal(tokenGuard(request, bridgeConfig), true);
  assert.equal(tokenGuard(request, {
    ...bridgeConfig, http: { ...bridgeConfig.http, token: 'another-token-'.repeat(4) },
  }), false);
  for (const authorization of [undefined, '', 'wrong', `bearer ${bridgeConfig.http.token}`]) {
    assert.equal(tokenGuard({ headers: { authorization } } as IncomingMessage, bridgeConfig), false);
  }
});
