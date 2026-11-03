import test from 'node:test';
import assert from 'node:assert/strict';
import { startBridge, token, headers } from '../fixtures/start-bridge.ts';
import { MAX_HTTP_BODY_BYTES } from '../config/keys.ts';

test('HTTP bridge authenticates before executing and accepts a task without a project', async (t) => {
  const { url, events } = await startBridge(t);
  const health = await fetch(`${url}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', provider: 'codex', inferenceEnabled: true });
  assert.equal((await fetch(url, { method: 'POST', body: 'Hello' })).status, 401);
  assert.equal(events.filter(({ event }) => event === 'task').length, 0);
  const response = await fetch(url, {
    method: 'POST', headers: {
      Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain', 'X-Request-Id': 'request-001',
    }, body: 'Hello\n"world"',
  });
  assert.equal(response.status, 200);
  assert.deepEqual(events.filter(({ event }) => event === 'task').map(({ input }) => input),
    [{ requestId: 'request-001', prompt: 'Hello\n"world"' }]);
  const invalid = await fetch(url, { method: 'POST', headers, body: '{' });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'invalid_json' });
  const tooLarge = await fetch(url, {
    method: 'POST', headers, body: 'é'.repeat(Math.floor(MAX_HTTP_BODY_BYTES / 2) + 1),
  });
  assert.equal(tooLarge.status, 413);
  assert.deepEqual(await tooLarge.json(), { error: 'body_too_large' });
  assert.equal(events.filter(({ event }) => event === 'task').length, 1);
});

test('HTTP bridge returns 429 for a concurrent call with the same request ID', async (t) => {
  const { url, child } = await startBridge(t, 'busy');
  const options = { method: 'POST', headers, body: JSON.stringify({ requestId: 'request-001', prompt: 'Say OK' }) };
  const generating = new Promise<void>((resolve) => {
    child.on('message', (message: { event?: string }) => {
      if (message.event === 'generating') resolve();
    });
  });
  const first = fetch(url, options);
  await generating;
  const second = await fetch(url, options);
  assert.equal(second.status, 429);
  assert.equal((await second.json()).error, 'busy');
  child.send('release');
  assert.equal((await first).status, 200);
});

for (const [mode, status] of [['failed', 502], ['unknown', 504]] as const) {
  test(`HTTP bridge preserves traces for ${mode} inference outcomes`, async (t) => {
    const { url } = await startBridge(t, mode);
    const response = await fetch(url, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'text/plain' }, body: 'Hello',
    });
    assert.equal(response.status, status);
    const result = await response.json();
    assert.equal(result.traceUrl, 'http://localhost:3001/project/agent-workflows/traces/123');
    if (mode === 'unknown') assert.equal(result.error.code, 'timeout');
  });
}
