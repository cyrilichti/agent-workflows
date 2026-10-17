import test from 'node:test';
import assert from 'node:assert/strict';
import { TraceBuilder } from '../../src/builders/trace.builder.ts';
import { TraceService } from '../../src/services/trace.service.ts';
import type { TaskOutcome } from '../../src/types/task.types.ts';
import type { TraceEntity } from '../../src/entities/trace.entity.ts';

test('trace usage subtracts cached input and leaves unavailable usage absent', () => {
  const r: TaskOutcome = {
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
  const usage = (record: TaskOutcome) =>
    new TraceBuilder().build(record).resourceSpans[0]?.scopeSpans[0]?.spans[0]?.attributes.find(
      (a) => a.key === 'langfuse.observation.usage_details',
    )?.value.stringValue;
  const usageValue = usage(r);
  assert.ok(usageValue);
  assert.deepEqual(JSON.parse(usageValue), { input: 6, output: 2, input_cached: 4 });
  delete r.usage;
  assert.equal(usage(r), undefined);
});

test('caller labels determine observation name, trace name and tags', () => {
  const batch = new TraceBuilder().build({
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
  const span = batch.resourceSpans[0]?.scopeSpans[0]?.spans[0];
  assert.ok(span);
  const attributes = Object.fromEntries(
    span.attributes.map(({ key, value }) => [key, value]),
  );
  assert.equal(span.name, 'next');
  assert.equal(attributes['langfuse.trace.name']?.stringValue, 'agent-workflows.work.next');
  assert.deepEqual(attributes['langfuse.trace.tags']?.arrayValue?.values, [{ stringValue: 'next' }]);
  assert.equal(attributes['langfuse.environment']?.stringValue, 'staging');
  assert.equal(attributes['langfuse.observation.level']?.stringValue, 'DEFAULT');
});

test('failed operation is an error even when its configured level is debug', () => {
  const batch = new TraceBuilder().build({
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
  const level = batch.resourceSpans[0]?.scopeSpans[0]?.spans[0]?.attributes.find(
    ({ key }) => key === 'langfuse.observation.level',
  );
  assert.equal(level?.value.stringValue, 'ERROR');
});

test('in-memory JSONL summary becomes Langfuse metadata and child events without duplicated token usage', async () => {
  const traceId = 'abcdef0123456789abcdef0123456789';
  const codexSummary = {
    traceId,
    schemaVersion: 2,
    phase: 'next',
    requestId: null,
    threadId: 'thread-1',
    model: 'test',
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
  let batch: TraceEntity | undefined;
  const traceService = new TraceService({
    url: 'http://localhost:3001', publicKey: 'public', secretKey: 'secret',
    fetchImpl: async (_url, options) => {
      assert.ok(options);
      batch = JSON.parse(String(options.body)) as TraceEntity;
      return Response.json({});
    },
  });
  await traceService.send({
    requestId: 'request-1', traceId, provider: 'codex', model: 'test',
    prompt: 'Execute /next', text: 'done', status: 'completed',
    startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-01T00:00:01Z',
    usage: { input: 100, cachedInput: 80, output: 10 },
    codexSummary,
  });
  assert.ok(batch);
  const spans = batch.resourceSpans[0]?.scopeSpans[0]?.spans;
  assert.ok(spans);
  const [root, first, second, third] = spans;
  assert.ok(root && first && second && third);
  assert.equal(spans.length, 4);
  assert.equal(first.parentSpanId, root.spanId);
  assert.equal(second.parentSpanId, root.spanId);
  assert.deepEqual(spans.slice(1).map((span) => span.name), [
    'command 1: cat (42 in, 2500 out chars)',
    'item 2: mcp_tool_call (38 in, 56 out chars)',
    'command 2: node (38 in, 56 out chars)',
  ]);
  assert.equal(first.startTimeUnixNano, first.endTimeUnixNano);
  assert.ok(BigInt(first.startTimeUnixNano) < BigInt(second.startTimeUnixNano));
  assert.ok(BigInt(second.startTimeUnixNano) < BigInt(third.startTimeUnixNano));
  const attributes = Object.fromEntries(first.attributes.map(({ key, value }) => [key, value.stringValue]));
  assert.equal(attributes['langfuse.observation.type'], 'event');
  assert.equal(attributes['langfuse.observation.metadata.outputCharacters'], '2500');
  assert.equal(attributes['langfuse.observation.metadata.timeSource'], 'bridge received item completion');
  assert.equal(attributes['langfuse.observation.usage_details'], undefined);
  assert.equal(third.status.code, 2);
  const rootAttributes = Object.fromEntries(root.attributes.map(({ key, value }) => [key, value.stringValue]));
  assert.equal(rootAttributes['langfuse.observation.metadata.phase'], 'next');
  const codexUsage = rootAttributes['langfuse.observation.metadata.codexUsage'];
  const eventCounts = rootAttributes['langfuse.observation.metadata.eventCounts'];
  assert.ok(codexUsage);
  assert.ok(eventCounts);
  assert.deepEqual(JSON.parse(codexUsage), codexSummary.usage);
  assert.deepEqual(JSON.parse(eventCounts), codexSummary.eventCounts);
});
