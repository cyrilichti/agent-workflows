import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { TaskRouteService } from '../services/task-route.service.ts';
import { TaskController } from './task.controller.ts';
import { SecurityService } from '../core/services/security.service.ts';
import { TaskService } from '../services/task.service.ts';
import { TaskResponseEntity } from '../entities/task-response.entity.ts';
import { TaskResultEntity } from '../entities/task-result.entity.ts';
import { MAX_HTTP_BODY_BYTES } from '../config/keys.ts';
import type { TaskResponse } from '../types/task.types.ts';
import type { Server } from 'node:http';

function createTaskServer(token: string, taskExecution: Pick<TaskService, 'getHealth' | 'executeTask'>) {
  const routes = new TaskRouteService(new TaskController({ taskExecution }), new SecurityService(token));
  return createServer((request, response) => void routes.dispatch(request, response));
}

function serverUrl(server: Server): string {
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return `http://127.0.0.1:${address.port}/`;
}

function taskResponse(status: TaskResponse['status'], traceUrl = '', error: TaskResponse['error'] = null) {
  return new TaskResponseEntity({
    requestId: 'request-001', provider: 'codex', model: 'test', status,
    text: null, error, usage: null, durationMs: null, providerRequestId: null,
    traceId: '0123456789abcdef0123456789abcdef', traceStatus: 'accepted', traceUrl,
  });
}

test('HTTP bridge authenticates before executing and accepts a task without a project', async (t) => {
  const token = 'test-only-token-'.repeat(4);
  const calls: unknown[] = [];
  const server = createTaskServer(token, {
    getHealth() { return { status: 'ok', provider: 'codex', inferenceEnabled: true }; },
    async executeTask(body) {
      calls.push(body);
      return taskResponse('completed');
    },
  });
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = serverUrl(server);
  const health = await fetch(`${url}health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', provider: 'codex', inferenceEnabled: true });
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
  const tooLarge = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: 'é'.repeat(Math.floor(MAX_HTTP_BODY_BYTES / 2) + 1),
  });
  assert.equal(tooLarge.status, 413);
  assert.equal(calls.length, 1);
});

test('HTTP bridge returns 429 for a concurrent call with the same request ID', async (t) => {
  const token = 'test-only-token-'.repeat(4);
  let release: () => void = () => assert.fail('Provider did not start');
  let started: () => void;
  const providerStarted = new Promise<void>((resolve) => { started = resolve; });
  const taskExecution = new TaskService({
    provider: {
      generate: () => new Promise((resolve) => {
        release = () => resolve(new TaskResultEntity({ text: 'OK', model: 'test' }));
        started();
      }),
    },
    providerName: 'codex',
    model: 'test',
    trace: async () => {},
    publicUrl: 'http://localhost:3001',
    projectId: 'agent-workflows',
    enabled: true,
  });
  const server = createTaskServer(token, taskExecution);
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = serverUrl(server);
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

test('HTTP bridge reports inference failures through HTTP while preserving the trace', async (t) => {
  const token = 'test-only-token-'.repeat(4);
  const server = createTaskServer(token, {
      getHealth: () => ({ status: 'ok', provider: 'codex', inferenceEnabled: true }),
      async executeTask() {
        return taskResponse('failed', 'http://localhost:3001/project/agent-workflows/traces/123');
      },
  });
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const response = await fetch(serverUrl(server), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain', 'X-Request-Id': 'request-001' },
    body: 'Hello',
  });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).traceUrl, 'http://localhost:3001/project/agent-workflows/traces/123');
});

test('HTTP bridge distinguishes an unknown inference outcome from a failure', async (t) => {
  const token = 'test-only-token-'.repeat(4);
  const server = createTaskServer(token, {
      getHealth: () => ({ status: 'ok', provider: 'codex', inferenceEnabled: true }),
      async executeTask() {
        return taskResponse('unknown', 'http://localhost:3001/trace', { code: 'timeout', message: 'Timed out' });
      },
  });
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const response = await fetch(serverUrl(server), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain', 'X-Request-Id': 'request-001' },
    body: 'Hello',
  });
  assert.equal(response.status, 504);
  assert.equal((await response.json()).error.code, 'timeout');
});
