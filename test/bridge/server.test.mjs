import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createBridgeHttpServer } from '../../src/bridge/server.mjs';
import { TaskExecutionService } from '../../src/bridge/execution/task-execution-service.mjs';

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

test('HTTP bridge returns 429 for a concurrent call with the same request ID', async (t) => {
  const token = 'test-only-token-'.repeat(4);
  let release;
  let started;
  const providerStarted = new Promise((resolve) => { started = resolve; });
  const taskExecution = new TaskExecutionService({
    provider: {
      generate: () => new Promise((resolve) => {
        release = () => resolve({ text: 'OK', model: 'test' });
        started();
      }),
    },
    providerName: 'codex',
    model: 'test',
    trace: async () => {},
    publicUrl: 'http://localhost:3001',
    projectId: 'local-ai',
    enabled: true,
  });
  const server = createBridgeHttpServer({ token, providerName: 'codex', taskExecution });
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/generate`;
  const options = {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: 'request-001', prompt: 'Say OK' }),
  };
  const first = fetch(url, options);
  await providerStarted;
  const second = await fetch(url, options);
  assert.equal(second.status, 429);
  assert.equal((await second.json()).error, 'busy');
  release();
  assert.equal((await first).status, 200);
});
