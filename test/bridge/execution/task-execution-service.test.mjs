import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { TaskRecordStore } from '../../../src/bridge/persistence/task-record-store.mjs';
import { TaskExecutionService } from '../../../src/bridge/execution/task-execution-service.mjs';
import { ProviderError } from '../../../src/bridge/execution/task-contract.mjs';
function fixture(t, options = {}) {
  const directory = mkdtempSync(`${tmpdir()}/local-ai-test-`);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  let calls = 0;
  const settings = {
    provider: {
      async generate() {
        calls++;
        return { text: 'OK', model: 'test', usage: { input: 10, cachedInput: 4, output: 2 } };
      },
    },
    providerName: 'codex',
    model: 'test',
    store: new TaskRecordStore(directory),
    trace: async () => {},
    publicUrl: 'http://localhost:3001',
    projectId: 'local-ai',
    enabled: true,
    ...options,
  };
  return { service: new TaskExecutionService(settings), settings, calls: () => calls };
}
const input = { requestId: 'test-request-001', prompt: 'Say OK' };
test('duplicate request reuses durable result, including after service restart', async (t) => {
  const f = fixture(t);
  const first = await f.service.executeTask(input);
  assert.equal(first.status, 'completed');
  assert.deepEqual(await new TaskExecutionService(f.settings).executeTask(input), first);
  assert.equal(f.calls(), 1);
});

test('same ID with different content or provider is rejected', async (t) => {
  const f = fixture(t);
  await f.service.executeTask(input);
  await assert.rejects(f.service.executeTask({ ...input, prompt: 'Other' }), { code: 'conflict' });
  await assert.rejects(
    new TaskExecutionService({ ...f.settings, providerName: 'openai-api' }).executeTask(input),
    { code: 'conflict' },
  );
});

test('disabled inference consumes no provider calls', async (t) => {
  const f = fixture(t, { enabled: false });
  await assert.rejects(f.service.executeTask(input), { code: 'disabled' });
  assert.equal(f.calls(), 0);
});

test('tracing outage preserves response; delivery retry never reruns inference', async (t) => {
  let down = true;
  const f = fixture(t, {
    trace: async () => {
      if (down) throw new Error('offline');
    },
  });
  assert.equal((await f.service.executeTask(input)).traceStatus, 'pending');
  down = false;
  await f.service.flushPendingTraces();
  assert.equal((await f.service.executeTask(input)).traceStatus, 'accepted');
  assert.equal(f.calls(), 1);
});

test('interrupted run becomes unknown after restart and is never replayed', async (t) => {
  const f = fixture(t);
  await f.service.executeTask(input);
  const r = f.settings.store.get(input.requestId);
  r.status = 'running';
  r.traceStatus = 'pending';
  f.settings.store.put(r);
  const result = await new TaskExecutionService(f.settings).executeTask(input);
  assert.equal(result.status, 'unknown');
  assert.equal(result.error.code, 'interrupted');
  assert.equal(f.calls(), 1);
});

test('timeout is unknown and safely retained', async (t) => {
  const f = fixture(t, {
    provider: {
      async generate() {
        throw new ProviderError('timeout', 'Unknown outcome');
      },
    },
  });
  const result = await f.service.executeTask(input);
  assert.equal(result.status, 'unknown');
  assert.equal(result.error.code, 'timeout');
});

test('concurrency is bounded and duplicates cannot execute twice', async (t) => {
  let release;
  const f = fixture(t, {
    provider: {
      generate: () =>
        new Promise((resolve) => {
          release = () => resolve({ text: 'OK', model: 'test' });
        }),
    },
  });
  const first = f.service.executeTask(input);
  assert.equal((await f.service.executeTask(input)).status, 'running');
  await assert.rejects(f.service.executeTask({ ...input, requestId: 'other-request' }), {
    code: 'busy',
  });
  release();
  await first;
});

test('untrusted provider exceptions do not expose credentials', async (t) => {
  const f = fixture(t, {
    provider: {
      async generate() {
        throw new Error('secret-token');
      },
    },
  });
  assert.doesNotMatch(JSON.stringify(await f.service.executeTask(input)), /secret-token/);
});

test('concurrent outbox and duplicate deliveries share one trace attempt', async (t) => {
  let release,
    attempts = 0;
  const f = fixture(t, {
    trace: () => {
      attempts++;
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  const first = f.service.executeTask(input);
  await new Promise((resolve) => setImmediate(resolve));
  const duplicate = f.service.executeTask(input);
  const flush = f.service.flushPendingTraces();
  release();
  const [a, b] = await Promise.all([first, duplicate, flush]);
  assert.equal(a.traceStatus, 'accepted');
  assert.equal(b.traceStatus, 'accepted');
  assert.equal(attempts, 1);
  assert.equal(f.calls(), 1);
});

test('shutdown cancellation reaches the running provider and preserves an unknown result', async (t) => {
  const f = fixture(t, {
    provider: {
      generate: (_prompt, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new ProviderError('timeout', 'Cancelled')),
            { once: true },
          );
        }),
    },
  });
  const running = f.service.executeTask(input);
  f.service.cancelActiveTask();
  assert.equal((await running).status, 'unknown');
  assert.equal(f.service.busy, false);
});
