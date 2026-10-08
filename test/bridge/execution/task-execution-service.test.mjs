import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskExecutionService } from '../../../src/bridge/execution/task-execution-service.mjs';
import { ProviderError } from '../../../src/bridge/execution/task-contract.mjs';

function fixture(options = {}) {
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
    trace: async () => {},
    publicUrl: 'http://localhost:3001',
    projectId: 'local-ai',
    enabled: true,
    ...options,
  };
  return { service: new TaskExecutionService(settings), calls: () => calls };
}

const input = { requestId: 'test-request-001', prompt: 'Say OK' };

test('repeated request IDs run new inference and produce distinct traces', async () => {
  const f = fixture();
  const first = await f.service.executeTask(input);
  const second = await f.service.executeTask({ ...input, prompt: 'Say something else' });
  assert.equal(f.calls(), 2);
  assert.equal(first.status, 'completed');
  assert.equal(second.status, 'completed');
  assert.equal(first.requestId, input.requestId);
  assert.equal(second.requestId, input.requestId);
  assert.notEqual(first.traceId, second.traceId);
  assert.equal(first.traceStatus, 'accepted');
  assert.equal(second.traceStatus, 'accepted');
});

test('disabled inference consumes no provider calls', async () => {
  const f = fixture({ enabled: false });
  await assert.rejects(f.service.executeTask(input), { code: 'disabled' });
  assert.equal(f.calls(), 0);
});

test('trace failure preserves response and is attempted once', async () => {
  let attempts = 0;
  const f = fixture({
    trace: async () => {
      attempts++;
      throw new Error('offline');
    },
  });
  const result = await f.service.executeTask(input);
  assert.equal(result.status, 'completed');
  assert.equal(result.text, 'OK');
  assert.equal(result.traceStatus, 'failed');
  assert.equal(attempts, 1);
  assert.equal(f.calls(), 1);
});

test('timeout returns an unknown outcome', async () => {
  const f = fixture({
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

test('concurrent requests receive busy even with the same request ID', async () => {
  let release;
  let calls = 0;
  const f = fixture({
    provider: {
      generate: () => {
        calls++;
        return new Promise((resolve) => {
          release = () => resolve({ text: 'OK', model: 'test' });
        });
      },
    },
  });
  const first = f.service.executeTask(input);
  await assert.rejects(f.service.executeTask(input), { code: 'busy' });
  await assert.rejects(f.service.executeTask({ ...input, requestId: 'other-request' }), {
    code: 'busy',
  });
  assert.equal(calls, 1);
  release();
  await first;
  const later = f.service.executeTask(input);
  release();
  assert.equal((await later).status, 'completed');
  assert.equal(calls, 2);
});

test('untrusted provider exceptions do not expose credentials', async () => {
  const f = fixture({
    provider: {
      async generate() {
        throw new Error('secret-token');
      },
    },
  });
  assert.doesNotMatch(JSON.stringify(await f.service.executeTask(input)), /secret-token/);
});

test('shutdown cancellation reaches the running provider and returns an unknown result', async () => {
  const f = fixture({
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

test('delivery mode constrains the provider then exposes rendered text and derived outcome', async () => {
  let calls = 0;
  let trace;
  const observed = {
    requestId: 'github.com/example/project#1', requestUrl: 'https://github.com/example/project/pull/1',
    inspectionStatus: 'completed_without_findings', itemId: 'ICY-108',
    itemUrl: 'https://linear.app/example/issue/ICY-108', labelStatus: 'applied',
    details: 'Inspection terminée sans findings.',
  };
  const f = fixture({
    provider: { async generate(prompt, options) {
      calls++;
      assert.match(prompt, /^Execute \/work/);
      assert.match(prompt, /final observed inspection/);
      assert.deepEqual(options.outputSchema.properties.itemId.enum, ['ICY-108']);
      assert.equal(options.directory, '/projects/app');
      return { text: JSON.stringify(observed), model: 'test' };
    } },
    trace: async (record) => { trace = record; },
  });
  const result = await f.service.executeTask({
    ...input, prompt: 'Execute /work for item ICY-108.', directory: '/projects/app',
    resultContract: { type: 'inspect', itemId: 'ICY-108' },
  });
  assert.equal(calls, 1);
  assert.equal(result.status, 'completed');
  assert.equal(result.deliveryResult.outcome, 'success');
  assert.match(result.text, /^## Inspect result\n\n/);
  assert.match(result.text, /inspection completed without findings/);
  assert.match(result.text, /agent-inspected applied/);
  assert.deepEqual(trace.deliveryResult, result.deliveryResult);
  assert.equal(trace.text, result.text);
});

test('invalid delivery output fails without retrying the mutating workflow', async () => {
  let calls = 0;
  const f = fixture({ provider: { async generate() {
    calls++;
    return { text: '## Inspect result\n\nWork completed successfully.', model: 'test' };
  } } });
  const result = await f.service.executeTask({
    ...input, resultContract: { type: 'inspect', itemId: 'ICY-108' },
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'invalid_output');
  assert.ok(!Object.hasOwn(result, 'deliveryResult'));
  assert.equal(calls, 1);
  assert.equal(f.service.busy, false);
});
