import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { Store } from '../store.mjs';
import { Service } from '../service.mjs';
import { ProviderError, validateInput } from '../contract.mjs';
import { traceBatch } from '../tracing.mjs';
function fixture(t, options = {}) {
  const directory = mkdtempSync(`${tmpdir()}/local-ai-test-`);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  let calls = 0;
  const settings = { provider: { async generate() { calls++; return { text: 'OK', model: 'test', usage: { input: 10, cachedInput: 4, output: 2 } }; } },
    providerName: 'codex', model: 'test', store: new Store(directory), trace: async () => {}, publicUrl: 'http://localhost:3001',
    projectId: 'local-ai', enabled: true, ...options };
  return { service: new Service(settings), settings, calls: () => calls };
}
const input = { requestId: 'test-request-001', prompt: 'Say OK' };
test('duplicate request reuses durable result, including after service restart', async t => {
  const f = fixture(t); const first = await f.service.run(input);
  assert.equal(first.status, 'completed');
  assert.deepEqual(await new Service(f.settings).run(input), first);
  assert.equal(f.calls(), 1);
});
test('same ID with different content or provider is rejected', async t => {
  const f = fixture(t); await f.service.run(input);
  await assert.rejects(f.service.run({ ...input, prompt: 'Other' }), { code: 'conflict' });
  await assert.rejects(new Service({ ...f.settings, providerName: 'openai-api' }).run(input), { code: 'conflict' });
});
test('disabled inference consumes no provider calls', async t => {
  const f = fixture(t, { enabled: false });
  await assert.rejects(f.service.run(input), { code: 'disabled' }); assert.equal(f.calls(), 0);
});
test('tracing outage preserves response; delivery retry never reruns inference', async t => {
  let down = true;
  const f = fixture(t, { trace: async () => { if (down) throw new Error('offline'); } });
  assert.equal((await f.service.run(input)).traceStatus, 'pending');
  down = false; await f.service.flush();
  assert.equal((await f.service.run(input)).traceStatus, 'accepted'); assert.equal(f.calls(), 1);
});
test('interrupted run becomes unknown after restart and is never replayed', async t => {
  const f = fixture(t); await f.service.run(input);
  const r = f.settings.store.get(input.requestId); r.status = 'running'; r.traceStatus = 'pending'; f.settings.store.put(r);
  const result = await new Service(f.settings).run(input);
  assert.equal(result.status, 'unknown'); assert.equal(result.error.code, 'interrupted'); assert.equal(f.calls(), 1);
});
test('timeout is unknown and safely retained', async t => {
  const f = fixture(t, { provider: { async generate() { throw new ProviderError('timeout', 'Unknown outcome'); } } });
  const result = await f.service.run(input); assert.equal(result.status, 'unknown'); assert.equal(result.error.code, 'timeout');
});
test('concurrency is bounded and duplicates cannot execute twice', async t => {
  let release;
  const f = fixture(t, { provider: { generate: () => new Promise(resolve => { release = () => resolve({ text: 'OK', model: 'test' }); }) } });
  const first = f.service.run(input);
  assert.equal((await f.service.run(input)).status, 'running');
  await assert.rejects(f.service.run({ ...input, requestId: 'other-request' }), { code: 'busy' });
  release(); await first;
});
test('input validation prevents traversal and empty or excessive prompts', () => {
  for (const body of [null, {}, { ...input, requestId: '../escape' }, { ...input, prompt: '' }, { ...input, prompt: 'x'.repeat(16001) }])
    assert.throws(() => validateInput(body), { code: 'invalid_input' });
});
test('trace usage subtracts cached input and leaves unavailable usage absent', async t => {
  const f = fixture(t); await f.service.run(input); const r = f.settings.store.get(input.requestId);
  const usage = r => traceBatch(r).resourceSpans[0].scopeSpans[0].spans[0].attributes.find(a => a.key === 'langfuse.observation.usage_details')?.value.stringValue;
  assert.deepEqual(JSON.parse(usage(r)), { input: 6, output: 2, input_cached: 4 });
  delete r.usage; assert.equal(usage(r), undefined);
});
test('untrusted provider exceptions do not expose credentials', async t => {
  const f = fixture(t, { provider: { async generate() { throw new Error('secret-token'); } } });
  assert.doesNotMatch(JSON.stringify(await f.service.run(input)), /secret-token/);
});

test('concurrent outbox and duplicate deliveries share one trace attempt', async t => {
  let release, attempts = 0;
  const f = fixture(t, { trace: () => { attempts++; return new Promise(resolve => { release = resolve; }); } });
  const first = f.service.run(input);
  await new Promise(resolve => setImmediate(resolve));
  const duplicate = f.service.run(input);
  const flush = f.service.flush();
  release();
  const [a, b] = await Promise.all([first, duplicate, flush]);
  assert.equal(a.traceStatus, 'accepted'); assert.equal(b.traceStatus, 'accepted');
  assert.equal(attempts, 1); assert.equal(f.calls(), 1);
});

test('shutdown cancellation reaches the running provider and preserves an unknown result', async t => {
  const f = fixture(t, { provider: { generate: (_prompt, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new ProviderError('timeout', 'Cancelled')), { once: true });
  }) } });
  const running = f.service.run(input);
  f.service.cancel();
  assert.equal((await running).status, 'unknown');
  assert.equal(f.service.busy, false);
});
