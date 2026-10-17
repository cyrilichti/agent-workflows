import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLangfuseTraceBatch, createLangfuseTraceClient } from '../../../src/bridge/observability/langfuse-trace-client.mjs';

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

test('in-memory JSONL summary becomes Langfuse metadata and child events without duplicated token usage', async () => {
  const traceId = 'abcdef0123456789abcdef0123456789';
  const codexSummary = {
    traceId,
    schemaVersion: 2,
    phase: 'next',
    threadId: 'thread-1',
    promptCharacters: 13,
    jsonlBytes: 900,
    usage: { input_tokens: 100, cached_input_tokens: 80, output_tokens: 10, reasoning_output_tokens: 2 },
    eventCounts: { 'item.completed': 3, 'turn.completed': 1 },
    malformedLines: 0,
    measurementNote: 'Only turn.completed.usage is a token count.',
    items: [
      { id: 'item-1', type: 'command_execution', commandName: 'cat', inputCharacters: 42, outputCharacters: 2500, exitCode: 0, completedAt: '2026-01-01T00:00:00.100Z' },
      { id: 'item-2', type: 'mcp_tool_call', tool: 'linear/list_issues', inputCharacters: 38, outputCharacters: 56, completedAt: '2026-01-01T00:00:00.200Z' },
      { id: 'item-3', type: 'command_execution', commandName: 'node', inputCharacters: 38, outputCharacters: 56, exitCode: 1, completedAt: '2026-01-01T00:00:00.300Z' },
    ],
  };
  let batch;
  const send = createLangfuseTraceClient({
    url: 'http://localhost:3001', publicKey: 'public', secretKey: 'secret',
    fetchImpl: async (_url, options) => {
      batch = JSON.parse(options.body);
      return { ok: true, json: async () => ({}) };
    },
  });
  await send({
    requestId: 'request-1', traceId, provider: 'codex', model: 'test',
    prompt: 'Execute /next', text: 'done', status: 'completed',
    startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-01T00:00:01Z',
    usage: { input: 100, cachedInput: 80, output: 10 },
    codexSummary,
  });
  const spans = batch.resourceSpans[0].scopeSpans[0].spans;
  assert.equal(spans.length, 4);
  assert.equal(spans[1].parentSpanId, spans[0].spanId);
  assert.equal(spans[2].parentSpanId, spans[0].spanId);
  assert.deepEqual(spans.slice(1).map((span) => span.name), [
    'command 1: cat (42 in, 2500 out chars)',
    'item 2: mcp_tool_call (38 in, 56 out chars)',
    'command 2: node (38 in, 56 out chars)',
  ]);
  assert.equal(spans[1].startTimeUnixNano, spans[1].endTimeUnixNano);
  assert.ok(BigInt(spans[1].startTimeUnixNano) < BigInt(spans[2].startTimeUnixNano));
  assert.ok(BigInt(spans[2].startTimeUnixNano) < BigInt(spans[3].startTimeUnixNano));
  const attributes = Object.fromEntries(spans[1].attributes.map(({ key, value }) => [key, value.stringValue]));
  assert.equal(attributes['langfuse.observation.type'], 'event');
  assert.equal(attributes['langfuse.observation.metadata.outputCharacters'], '2500');
  assert.equal(attributes['langfuse.observation.metadata.timeSource'], 'bridge received item completion');
  assert.equal(attributes['langfuse.observation.usage_details'], undefined);
  assert.equal(spans[3].status.code, 2);
  const rootAttributes = Object.fromEntries(spans[0].attributes.map(({ key, value }) => [key, value.stringValue]));
  assert.equal(rootAttributes['langfuse.observation.metadata.phase'], 'next');
  assert.deepEqual(JSON.parse(rootAttributes['langfuse.observation.metadata.codexUsage']), codexSummary.usage);
  assert.deepEqual(JSON.parse(rootAttributes['langfuse.observation.metadata.eventCounts']), codexSummary.eventCounts);
});
