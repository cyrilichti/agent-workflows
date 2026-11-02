import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createBridgeServer } from './server.ts';
import { routes } from './routes.ts';
import type { RouteContext } from './routes.ts';
import { TaskController } from './controllers/task.controller.ts';
import { HttpError } from './core/errors/http.error.ts';

const token = 'test-only-token-'.repeat(4);
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

// Importing the table and starting the server must not resolve a controller.
test('declared routes resolve only the selected controller after authorization and parsing', async (t) => {
  assert.deepEqual(routes.map(({ method, path }) => [method, path]), [
    ['GET', '/health'], ['POST', '/'], ['POST', '/next'], ['POST', '/project'],
  ]);
  const calls: string[] = [];
  const inputs: unknown[] = [];
  const context: RouteContext = {
    health: () => {
      calls.push('health');
      return { status: 'ok', provider: 'codex', inferenceEnabled: false };
    },
    task: () => {
      calls.push('task');
      return new TaskController({ taskExecution: {
        getHealth: () => assert.fail('Unexpected task health call'),
        executeTask: async () => { throw new Error('private failure'); },
      } });
    },
    next: () => {
      calls.push('next');
      return { select: async () => ({ status: 'no eligible item' }) };
    },
    project: () => {
      calls.push('project');
      return { resolve: async (input) => {
        inputs.push(input);
        throw new HttpError(400, 'invalid_project_input');
      } };
    },
  };
  const server = createBridgeServer(token, context);
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  assert.deepEqual(calls, []);
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;

  for (const [method, path] of [
    ['GET', '/missing'], ['POST', '/'], ['POST', '/next'], ['POST', '/project'],
    ['POST', '/health'], ['GET', '/health?probe=1'],
  ]) {
    const response = await fetch(`${url}${path}`, { method });
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: 'unauthorized' });
  }
  for (const [method, path] of [
    ['GET', '/'], ['GET', '/next'], ['GET', '/project'], ['POST', '/health'],
    ['POST', '/missing'], ['GET', '/health?probe=1'], ['POST', '/next/'],
  ]) {
    const response = await fetch(`${url}${path}`, { method, headers });
    assert.equal(response.status, 404, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: 'not_found' });
  }
  assert.deepEqual(calls, []);

  const health = await fetch(`${url}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', provider: 'codex', inferenceEnabled: false });
  assert.deepEqual(calls, ['health']);

  // Selection ignores the body; task and project routes parse it before resolving dependencies.
  const next = await fetch(`${url}/next`, { method: 'POST', headers, body: '{' });
  assert.equal(next.status, 200);
  assert.deepEqual(await next.json(), { status: 'no eligible item' });
  assert.deepEqual(calls, ['health', 'next']);
  for (const path of ['/', '/project']) {
    const invalid = await fetch(`${url}${path}`, { method: 'POST', headers, body: '{' });
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { error: 'invalid_json' });
  }
  assert.deepEqual(calls, ['health', 'next']);

  const project = await fetch(`${url}/project`, {
    method: 'POST', headers, body: JSON.stringify({ list: 'Project', id: 'issue-1' }),
  });
  assert.equal(project.status, 400);
  assert.deepEqual(await project.json(), { error: 'invalid_project_input' });
  assert.deepEqual(inputs, [{ list: 'Project', id: 'issue-1' }]);
  assert.deepEqual(calls, ['health', 'next', 'project']);

  const task = await fetch(url, { method: 'POST', headers, body: '{}' });
  assert.equal(task.status, 500);
  assert.deepEqual(await task.json(), { error: 'internal_error', message: 'Local service failed.' });
  assert.deepEqual(calls, ['health', 'next', 'project', 'task']);
});
