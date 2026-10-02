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
