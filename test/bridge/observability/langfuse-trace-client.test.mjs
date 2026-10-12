import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLangfuseTraceBatch } from '../../../src/bridge/observability/langfuse-trace-client.mjs';

test('trace usage subtracts cached input and leaves unavailable usage absent', () => {
  const r = {
    requestId: 'trace-test-001',
    traceId: '0123456789abcdef0123456789abcdef',
    provider: 'codex',
    model: 'test',
    prompt: 'Say OK',
    text: 'OK',
    status: 'completed',
    startedAt: '2026-01-01T00:00:00Z',
    endedAt: '2026-01-01T00:00:01Z',
    usage: { input: 10, cachedInput: 4, output: 2 },
  };
  const usage = (r) =>
    buildLangfuseTraceBatch(r).resourceSpans[0].scopeSpans[0].spans[0].attributes.find(
      (a) => a.key === 'langfuse.observation.usage_details',
    )?.value.stringValue;
  assert.deepEqual(JSON.parse(usage(r)), { input: 6, output: 2, input_cached: 4 });
  delete r.usage;
  assert.equal(usage(r), undefined);
});

test('caller labels determine observation name, trace name and tags', () => {
  const batch = buildLangfuseTraceBatch({
    requestId: 'trace-test-002',
    traceId: '0123456789abcdef0123456789abcdef',
    provider: 'codex',
    model: 'test',
    prompt: 'Execute /next',
    text: 'OK',
    status: 'completed',
    trace: { name: 'agent-workflows.work.next', observationName: 'next', tags: ['next'] },
    startedAt: '2026-01-01T00:00:00Z',
    endedAt: '2026-01-01T00:00:01Z',
  }, { environment: 'staging' });
  const span = batch.resourceSpans[0].scopeSpans[0].spans[0];
  const attributes = Object.fromEntries(
    span.attributes.map(({ key, value }) => [key, value]),
  );
  assert.equal(span.name, 'next');
  assert.equal(attributes['langfuse.trace.name'].stringValue, 'agent-workflows.work.next');
  assert.deepEqual(attributes['langfuse.trace.tags'].arrayValue.values, [{ stringValue: 'next' }]);
  assert.equal(attributes['langfuse.environment'].stringValue, 'staging');
  assert.equal(attributes['langfuse.observation.level'].stringValue, 'DEFAULT');
});

test('failed operation is an error even when its configured level is debug', () => {
  const batch = buildLangfuseTraceBatch({
    requestId: 'trace-test-003',
    traceId: '0123456789abcdef0123456789abcdef',
    provider: 'codex',
    model: 'test',
    prompt: 'Execute /next',
    status: 'failed',
    error: { code: 'provider_error', message: 'Provider failed' },
    trace: { name: 'agent-workflows.work.next', observationName: 'next', tags: ['next'], level: 'DEBUG' },
    startedAt: '2026-01-01T00:00:00Z',
    endedAt: '2026-01-01T00:00:01Z',
  });
  const level = batch.resourceSpans[0].scopeSpans[0].spans[0].attributes.find(
    ({ key }) => key === 'langfuse.observation.level',
  );
  assert.equal(level.value.stringValue, 'ERROR');
});
