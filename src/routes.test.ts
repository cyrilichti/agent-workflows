import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { routes } from './routes.ts';
import { HealthController } from './controllers/health.controller.ts';
import { TaskController } from './controllers/task.controller.ts';
import { ScriptController } from './controllers/script.controller.ts';
import { tokenGuard } from './guards/token.guard.ts';
import { startBridge, headers } from './fixtures/start-bridge.ts';

// Importing the table and starting the server must not resolve a controller.
test('declared routes resolve only the selected controller after authorization and parsing', async (t) => {
  assert.deepEqual(routes.map(({ method, path, controller, action, guard }) =>
    [method, path, controller, action, guard]), [
    ['GET', '/health', HealthController, 'handle', undefined],
    ['POST', '/', TaskController, 'handle', tokenGuard],
    ['POST', '/scripts', ScriptController, 'handle', tokenGuard],
  ]);
  const { url, events, stop } = await startBridge(t, 'throw', false);
  assert.deepEqual(events, []);
  for (const [method, path] of [
    ['GET', '/missing'], ['POST', '/'], ['POST', '/scripts'],
    ['POST', '/health'], ['GET', '/health?probe=1'],
  ] as const) {
    const response = await fetch(`${url}${path}`, { method });
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: 'unauthorized' });
  }
  for (const [method, path] of [
    ['GET', '/'], ['GET', '/scripts'], ['POST', '/next'], ['POST', '/project'], ['POST', '/health'],
    ['POST', '/missing'], ['GET', '/health?probe=1'], ['POST', '/scripts/'],
  ] as const) {
    const response = await fetch(`${url}${path}`, { method, headers });
    assert.equal(response.status, 404, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: 'not_found' });
  }
  assert.deepEqual(events, []);

  const health = await fetch(`${url}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', provider: 'codex', inferenceEnabled: false });
  assert.deepEqual(events.splice(0), [{ event: 'controller', name: 'HealthController' }]);

  for (const path of ['/', '/scripts']) {
    const invalid = await fetch(`${url}${path}`, { method: 'POST', headers, body: '{' });
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { error: 'invalid_json' });
  }
  assert.deepEqual(events, []);

  const scripts = await fetch(`${url}/scripts`, {
    method: 'POST', headers, body: JSON.stringify({ path: 'custom.ts', args: ['value'] }),
  });
  assert.equal(scripts.status, 400);
  assert.deepEqual(await scripts.json(), { error: 'invalid_script_input' });
  assert.deepEqual(events.splice(0), [
    { event: 'controller', name: 'ScriptController' },
    { event: 'scripts', input: { path: 'custom.ts', args: ['value'] }, reused: false },
  ]);
  await fetch(`${url}/scripts`, { method: 'POST', headers, body: '{}' });
  assert.equal(events.at(-1)?.reused, true);
  events.length = 0;

  const task = await fetch(url, { method: 'POST', headers, body: '{}' });
  assert.equal(task.status, 500);
  assert.deepEqual(await task.json(), { error: 'internal_error', message: 'Local service failed.' });
  assert.deepEqual(events, [
    { event: 'provider' }, { event: 'controller', name: 'TaskController' }, { event: 'task', input: {} },
  ]);
  const repeated = await fetch(url, { method: 'POST', headers, body: '{}' });
  assert.equal(repeated.status, 500);
  assert.equal(events.filter(({ event }) => event === 'provider').length, 1, 'Task dependencies are reused');
  await stop();
  assert.equal(events.filter(({ event }) => event === 'cancel').length, 1, 'Shutdown cancels the initialized task service');
});

test('imports create no controller, service, server, or configuration dependency', () => {
  const source = `
    import { registerHooks } from 'node:module';
    import assert from 'node:assert/strict';
    registerHooks({ load(url, context, next) {
      if (url.endsWith('/app.config.ts')) throw new Error('Unexpected configuration load');
      const result = next(url, context);
      if (/\\/(controllers|services)\\/.*\\.ts$/.test(url) && result.source) {
        return { ...result, source: String(result.source).replace(/constructor\\s*\\([^)]*\\)\\s*{/g,
          'constructor(...args) { throw new Error("Unexpected construction");') };
      }
      return result;
    }});
    const before = process.getActiveResourcesInfo();
    const { routes } = await import('./src/routes.ts');
    await import('./src/server.ts');
    assert.equal(routes.length, 3);
    assert.deepEqual(process.getActiveResourcesInfo(), before);
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: new URL('..', import.meta.url), timeout: 5_000,
  });
});

test('shutdown without a task does not create a task service', async (t) => {
  const { events, stop } = await startBridge(t);
  await stop();
  assert.deepEqual(events, []);
});
