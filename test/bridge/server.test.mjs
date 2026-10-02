import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createBridgeHttpServer } from '../../src/bridge/server.mjs';

test('HTTP bridge authenticates before executing and accepts a task without a project', async (t) => {
  const token = 'test-only-token-'.repeat(4);
  const calls = [];
  const server = createBridgeHttpServer({
    token,
    providerName: 'codex',
    taskExecution: {
      enabled: true,
      async executeTask(body) {
        calls.push(body);
        return { status: 'completed' };
      },
    },
  });
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/generate`;
  assert.equal((await fetch(url, { method: 'POST', body: 'Hello' })).status, 401);
  assert.equal(calls.length, 0);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
      'X-Request-Id': 'request-001',
    },
    body: 'Hello\n"world"',
  });
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [{ requestId: 'request-001', prompt: 'Hello\n"world"' }]);
  assert.equal(
    (
      await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{',
      })
    ).status,
    400,
  );
  assert.equal(calls.length, 1);
});
