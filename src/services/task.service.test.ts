import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskService } from './task.service.ts';
import { ProviderError } from '../errors/provider.error.ts';
import { TraceDeliveryError } from '../errors/trace-delivery.error.ts';
import { TaskResultEntity } from '../entities/task-result.entity.ts';
import type { TaskEntity } from '../entities/task.entity.ts';
import type { TaskServiceOptions } from '../types/task-service.types.ts';
import type { CodexSummary } from '../types/trace.types.ts';

function fixture(options: Partial<TaskServiceOptions> = {}) {
  let calls = 0;
  const settings = {
    provider: {
      async generate() {
        calls++;
        return new TaskResultEntity({ text: 'OK', model: 'test', usage: { input: 10, cachedInput: 4, output: 2 } });
      },
    },
    providerName: 'codex',
    model: 'test',
    trace: async () => {},
    publicUrl: 'http://localhost:3001',
    projectId: 'agent-workflows',
    enabled: true,
    ...options,
  };
  return { service: new TaskService(settings), calls: () => calls };
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

test('caller trace labels are validated and forwarded to tracing', async () => {
  let traced: TaskEntity | undefined;
  const f = fixture({ trace: async (outcome) => { traced = outcome; } });
  const trace = { name: 'agent-workflows.work.next', observationName: 'next', tags: ['next'], sessionId: 'kestra-execution-1', level: 'DEBUG' };
  await f.service.executeTask({ ...input, directory: '/projects/example-repo', trace: { ...trace, unexpected: 'not forwarded' } });
  assert.ok(traced);
  assert.deepEqual(traced.trace, trace);
  assert.equal(traced.directory, '/projects/example-repo');
  await assert.rejects(f.service.executeTask({ ...input, trace: { ...trace, tags: 'next' } }), {
    code: 'invalid_input',
  });
  await assert.rejects(f.service.executeTask({ ...input, trace: { ...trace, level: 'IMPORTANT' } }), {
    code: 'invalid_input',
  });
  await assert.rejects(f.service.executeTask({ ...input, trace: { ...trace, sessionId: '' } }), {
    code: 'invalid_input',
  });
  assert.equal(f.calls(), 1);
});

test('Codex summary reaches tracing without being exposed in the HTTP result', async () => {
  let traced: TaskEntity | undefined;
  const summary: CodexSummary = {
    schemaVersion: 2, traceId: 'provider-trace', phase: null, requestId: null,
    threadId: null, model: 'test', promptCharacters: 0, jsonlBytes: 0,
    usage: null, eventCounts: {}, malformedLines: 0, measurementNote: '',
    items: [{ type: 'command_execution', commandName: 'cat', inputCharacters: 0, outputCharacters: 0 }],
  };
  const f = fixture({
    provider: { async generate() { return new TaskResultEntity({ text: 'OK', model: 'test', codexSummary: summary }); } },
    trace: async (outcome) => { traced = outcome; },
  });
  const result = await f.service.executeTask(input);
  assert.ok(traced);
  assert.equal(traced.codexSummary, summary);
  assert.equal(Object.hasOwn(result, 'codexSummary'), false);
  assert.equal(Object.hasOwn(result, 'usageReportPath'), false);
});

test('a failed Codex result still traces observed usage and events', async () => {
  let traced: TaskEntity | undefined;
  const f = fixture({
    provider: { async generate(_prompt, { traceId }) {
      const error = new ProviderError('invalid_output', 'No final answer');
      error.codexSummary = {
        schemaVersion: 2, traceId, phase: null, requestId: null,
        threadId: null, model: 'test', promptCharacters: 0, jsonlBytes: 0,
        usage: { input_tokens: 20, cached_input_tokens: 12, output_tokens: 3 },
        eventCounts: {}, malformedLines: 0, measurementNote: '',
        items: [{ type: 'command_execution', commandName: 'cat', inputCharacters: 0, outputCharacters: 0 }],
      };
      throw error;
    } },
    trace: async (outcome) => { traced = outcome; },
  });
  const result = await f.service.executeTask(input);
  assert.ok(traced);
  assert.equal(result.status, 'failed');
  assert.deepEqual(traced.usage, { input: 20, cachedInput: 12, output: 3 });
  assert.ok(traced.codexSummary);
  assert.equal(traced.codexSummary.items.length, 1);
});

test('trace failure preserves response and reports a safe reason once', async (t) => {
  const logs: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { logs.push(args); });
  let attempts = 0;
  const f = fixture({
    trace: async () => {
      attempts++;
      throw new TraceDeliveryError('http', 503);
    },
  });
  const result = await f.service.executeTask(input);
  assert.equal(result.status, 'completed');
  assert.equal(result.text, 'OK');
  assert.equal(result.traceStatus, 'failed');
  assert.equal(attempts, 1);
  assert.equal(f.calls(), 1);
  assert.deepEqual(logs, [['Trace delivery failed', {
    traceId: result.traceId, reason: 'http', status: 503,
  }]]);
});

test('unexpected trace errors do not expose their message', async (t) => {
  const logs: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { logs.push(args); });
  const f = fixture({ trace: async () => { throw new Error('secret detail'); } });
  const result = await f.service.executeTask(input);
  assert.equal(result.traceStatus, 'failed');
  assert.deepEqual(logs, [['Trace delivery failed', {
    traceId: result.traceId, reason: 'unexpected_error',
  }]]);
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
  assert.ok(result.error);
  assert.equal(result.error.code, 'timeout');
});

test('concurrent requests receive busy even with the same request ID', async () => {
  let release: () => void = () => assert.fail('Provider did not start');
  let calls = 0;
  const f = fixture({
    provider: {
      generate: () => {
        calls++;
        return new Promise<TaskResultEntity>((resolve) => {
          release = () => resolve(new TaskResultEntity({ text: 'OK', model: 'test' }));
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
        new Promise<TaskResultEntity>((_resolve, reject) => {
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
  const next = f.service.executeTask(input);
  f.service.cancelActiveTask();
  assert.equal((await next).status, 'unknown');
});
