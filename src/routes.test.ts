import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, rmSync, realpathSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes } from './routes.ts';
import { HealthController } from './controllers/health.controller.ts';
import { TaskController } from './controllers/task.controller.ts';
import { ScriptController } from './controllers/script.controller.ts';
import { tokenGuard } from './guards/token.guard.ts';
import { MAX_HTTP_BODY_BYTES } from './config/keys.ts';

test('route declarations and imports have no startup effects', () => {
  assert.deepEqual(routes.map(({ method, path, controller, action, guard }) =>
    [method, path, controller, action, guard]), [
    ['GET', '/health', HealthController, 'reportHealth', undefined],
    ['POST', '/', TaskController, 'executeTask', tokenGuard],
    ['POST', '/scripts', ScriptController, 'executeScript', tokenGuard],
  ]);
  for (const { controller, action } of routes) {
    assert.equal(typeof controller.prototype[action], 'function');
    assert.equal('handle' in controller.prototype, false);
  }
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const before = process.getActiveResourcesInfo();
    await import(${JSON.stringify(new URL('./routes.ts', import.meta.url).href)});
    await import(${JSON.stringify(new URL('./server.ts', import.meta.url).href)});
    assert.deepEqual(process.getActiveResourcesInfo(), before);
  `], { cwd: tmpdir(), env: { PATH: process.env.PATH }, timeout: 5_000 });
});

test('procedural bridge preserves HTTP contracts and shutdown', { timeout: 30_000 }, async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'bridge-http-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const token = 'test-only-token-'.repeat(4);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Connection: 'close' };
  // Exercise the real task service through a local executable, without inference credentials.
  const executable = join(root, 'provider.cjs');
  writeFileSync(executable, `#!${process.execPath}
    const fs = require('node:fs');
    let prompt = '';
    process.stdin.setEncoding('utf8').on('data', chunk => prompt += chunk).on('end', () => {
      if (prompt === 'wait') {
        fs.writeFileSync('running', 'ready');
        setInterval(() => {}, 1000);
      } else if (prompt === 'failed') {
        console.log(JSON.stringify({ type: 'turn.failed' }));
      } else {
        console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: prompt } }));
        console.log(JSON.stringify({ type: 'turn.completed' }));
      }
    });
  `, { mode: 0o700 });
  const traces = createServer((request, response) => {
    request.resume();
    response.setHeader('Content-Type', 'application/json');
    response.end('{}');
  }).listen(0, '127.0.0.1');
  t.after(() => { traces.closeAllConnections(); traces.close(); });
  await once(traces, 'listening');
  const traceAddress = traces.address();
  assert.ok(traceAddress && typeof traceAddress !== 'string');
  const reservation = createServer().listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  reservation.close();
  await once(reservation, 'close');
  writeFileSync(join(root, '.env'), [
    'LANGFUSE_PUBLIC_KEY=test-public', 'LANGFUSE_SECRET_KEY=test-secret',
    `LANGFUSE_URL=http://127.0.0.1:${traceAddress.port}`,
    `SECRET_BRIDGE_TOKEN=${Buffer.from(token).toString('base64')}`,
    `BRIDGE_PORT=${address.port}`, 'INFERENCE_ENABLED=true', 'REQUEST_TIMEOUT_MS=2000',
    `CODEX_BIN=${executable}`, `CODEX_WORKING_DIRECTORY=${root}`,
  ].join('\n'));
  // Extend only the table to check dynamic dispatch and guard-before-constructor ordering.
  const declaration = `
    import { routes } from ${JSON.stringify(new URL('./routes.ts', import.meta.url).href)};
    import { TaskRequestService } from ${JSON.stringify(new URL('./services/task-request.service.ts', import.meta.url).href)};
    import { JsonHttpResponseService } from ${JSON.stringify(new URL('./core/services/json-http-response.service.ts', import.meta.url).href)};
    class DeclaredController {
      constructor(request, response) { this.request = request; this.response = response; }
      async executeDeclared() {
        const input = await new TaskRequestService().parseTaskInput(this.request);
        new JsonHttpResponseService().send(this.response, 201, { declared: input });
      }
    }
    routes.push({ method: 'POST', path: '/declared', controller: DeclaredController,
      action: 'executeDeclared', guard: routes[1].guard });
    class BrokenController { constructor() { throw new Error('private failure'); } }
    routes.push({ method: 'POST', path: '/broken', controller: BrokenController,
      action: 'executeBroken', guard: routes[1].guard });
  `;
  const child = spawn(process.execPath, [
    '--import', `data:text/javascript,${encodeURIComponent(declaration)}`,
    fileURLToPath(new URL('./server.ts', import.meta.url)),
  ], { cwd: root, env: { PATH: process.env.PATH }, stdio: ['ignore', 'pipe', 'pipe'] });
  const closed = once(child, 'close');
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); await closed; });
  let stderr = '';
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
  let output = '';
  for await (const chunk of child.stdout) {
    output += chunk;
    if (output.includes('Local bridge ready on port')) break;
  }
  assert.match(output, /Local bridge ready on port/, stderr);
  const url = `http://127.0.0.1:${address.port}`;
  const post = (prompt: string, timeoutMs?: number) => fetch(url, { method: 'POST', headers,
    signal: AbortSignal.timeout(5_000),
    body: JSON.stringify({ requestId: 'request-001', prompt, timeoutMs }) });

  await t.test('health is public and protected or unknown routes authorize first', async () => {
    const health = await fetch(`${url}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok', provider: 'codex', inferenceEnabled: true });
    for (const path of ['/', '/scripts', '/missing', '/declared', '/broken', '/health?probe=1']) {
      const denied = await fetch(`${url}${path}`, { method: 'POST', body: '{' });
      assert.equal(denied.status, 401, path);
      assert.deepEqual(await denied.json(), { error: 'unauthorized' });
    }
    for (const [method, path] of [
      ['GET', '/'], ['GET', '/scripts'], ['POST', '/health'], ['POST', '/missing'],
      ['GET', '/health?probe=1'], ['POST', '/scripts/'],
    ] as const) {
      const response = await fetch(`${url}${path}`, { method, headers });
      assert.equal(response.status, 404, `${method} ${path}`);
      assert.deepEqual(await response.json(), { error: 'not_found' });
    }
    const declared = await fetch(`${url}/declared`, { method: 'POST', headers, body: '{"value":"from route"}' });
    assert.equal(declared.status, 201);
    assert.deepEqual(await declared.json(), { declared: { value: 'from route' } });
    const broken = await fetch(`${url}/broken`, { method: 'POST', headers, body: '{}' });
    assert.equal(broken.status, 500);
    assert.deepEqual(await broken.json(), { error: 'internal_error', message: 'Local service failed.' });
  });

  await t.test('tasks preserve text, parsing errors, body limits and trace outcomes', async () => {
    const response = await fetch(url, { method: 'POST', headers: {
      Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain', 'X-Request-Id': 'request-001',
    }, body: 'Hello\n"world"' });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.text, 'Hello\n"world"');
    assert.equal(result.requestId, 'request-001');
    assert.equal(result.traceStatus, 'accepted');
    for (const path of ['/', '/scripts']) {
      const invalid = await fetch(`${url}${path}`, { method: 'POST', headers, body: '{' });
      assert.equal(invalid.status, 400);
      assert.deepEqual(await invalid.json(), { error: 'invalid_json' });
    }
    const tooLarge = await fetch(url, { method: 'POST', headers,
      body: 'é'.repeat(Math.floor(MAX_HTTP_BODY_BYTES / 2) + 1) });
    assert.equal(tooLarge.status, 413);
    assert.deepEqual(await tooLarge.json(), { error: 'body_too_large' });
    for (const [prompt, status] of [['failed', 502], ['wait', 504]] as const) {
      const outcome = await post(prompt);
      assert.equal(outcome.status, status);
      const body = await outcome.json();
      assert.equal(body.traceStatus, 'accepted');
      assert.equal(body.traceUrl, `http://localhost:3001/project/agent-workflows/traces/${body.traceId}`);
      if (prompt === 'wait') assert.equal(body.error.code, 'timeout');
    }
  });

  await t.test('scripts execute project files and reject invalid entrypoints', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'bridge-outside-'));
    t.after(() => rmSync(outside, { recursive: true, force: true }));
    const directory = root;
    mkdirSync(join(directory, 'folder.ts'));
    writeFileSync(join(directory, 'custom.ts'), `process.stdout.write(JSON.stringify({args:process.argv.slice(2),cwd:process.cwd()})); process.stderr.write('diagnostic');`);
    writeFileSync(join(directory, 'plain.ts'), `process.stdout.write('not JSON');`);
    writeFileSync(join(directory, 'fail.ts'), 'process.exit(2);');
    writeFileSync(join(outside, 'outside.ts'), 'process.stdout.write("outside");');
    writeFileSync(join(directory, 'other.js'), '');
    symlinkSync(join(outside, 'outside.ts'), join(directory, 'escape.ts'));
    symlinkSync(outside, join(directory, 'escape-dir'));
    symlinkSync(join(directory, 'other.js'), join(directory, 'wrong.ts'));
    symlinkSync(join(directory, 'custom.ts'), join(directory, 'alias.ts'));
    const scriptUrl = `${url}/scripts`;
    const post = (input: unknown) => fetch(scriptUrl, { method: 'POST', headers, body: JSON.stringify(input) });
    assert.equal((await fetch(scriptUrl, { method: 'POST', body: '{}' })).status, 401);
    const malformed = await fetch(scriptUrl, { method: 'POST', headers, body: '{' });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: 'invalid_json' });
    const args = ['spaces here', '$(touch nope); echo hello', '--eval', 'é', ''];
    for (const path of ['custom.ts', 'alias.ts']) {
      const response = await post({ path, args });
      assert.equal(response.status, 200);
      const output = await response.json();
      assert.deepEqual(JSON.parse(output.stdout), { args, cwd: realpathSync(directory) });
      assert.equal(output.stderr, 'diagnostic');
    }
    const plain = await post({ path: 'plain.ts' });
    assert.deepEqual(await plain.json(), { stdout: 'not JSON', stderr: '' });
    for (const input of [null, [], {}, { path: '' }, { path: '/absolute.ts' },
      { path: 'custom.ts', args: null }, { path: 'custom.ts', args: [1] },
      { path: 'custom.ts', args: ['\0'] }, { path: 'bad\0.ts' }, { path: 'other.js' }]) {
      const response = await post(input);
      assert.equal(response.status, 400, JSON.stringify(input));
      assert.deepEqual(await response.json(), { error: 'invalid_script_input' });
    }
    for (const path of ['../outside.ts', 'escape.ts', 'escape-dir/outside.ts', 'folder.ts', 'missing.ts', 'wrong.ts']) {
      const response = await post({ path });
      assert.equal(response.status, 400, path);
      assert.deepEqual(await response.json(), { error: 'invalid_script_path' });
    }
    const failed = await post({ path: 'fail.ts' });
    assert.equal(failed.status, 502);
    assert.deepEqual(await failed.json(), { error: 'script_failed' });
  });

  await t.test('busy requests reuse the task service and shutdown cancels active inference', async () => {
    rmSync(join(root, 'running'), { force: true });
    const running = post('wait', 15_000);
    const started = AbortSignal.timeout(3_000);
    while (!existsSync(join(root, 'running'))) {
      started.throwIfAborted();
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    const busy = await post('second');
    assert.equal(busy.status, 429);
    assert.equal((await busy.json()).error, 'busy');
    child.kill('SIGTERM');
    const cancelled = await running;
    assert.equal(cancelled.status, 504);
    assert.equal((await cancelled.json()).error.code, 'timeout');
    assert.deepEqual(await closed, [0, null]);
  });
});
