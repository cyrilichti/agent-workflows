import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exercise the flow's jq program with the toJson encoding applied to the
// HTTP response body. This checks routing without starting a Kestra instance.
const flow = readFileSync(new URL('../orchestration/work.yaml', import.meta.url), 'utf8');
const selection = flow.slice(flow.indexOf('          - id: has-item'), flow.indexOf('                - id: has-project'));
const filter = selection.match(/jq\('([\s\S]*?)'\)/)?.[1];
assert.ok(filter, 'Selection switch must contain its jq filter');
const projectSelection = flow.slice(flow.indexOf('                - id: has-project'), flow.indexOf('                  cases:', flow.indexOf('                - id: has-project')));
const projectFilter = projectSelection.match(/jq\('([\s\S]*?)'\)/)?.[1];
assert.ok(projectFilter, 'Project switch must contain its jq filter');
function selectionRoute(body: string): string {
  return execFileSync('jq', ['-r', filter!], {
    input: JSON.stringify(body), encoding: 'utf8',
  }).trim();
}
function projectRoute(body: string): string {
  return execFileSync('jq', ['-r', projectFilter!], {
    input: JSON.stringify(body), encoding: 'utf8',
  }).trim();
}

test('Kestra routes invalid selection responses and waits after failed attempts', () => {
  for (const body of ['invalid', 'null', '{}', '{"name":" "}',
    '{"status":"no eligible item","extra":true}', '{"text":"{}"}']) {
    assert.equal(selectionRoute(body), 'error', body);
  }
  assert.match(flow, /id: start\s+type: io\.kestra\.plugin\.core\.flow\.AllowFailure/);
  assert.match(flow, /uri: '\{\{ envs\.bridge_url \}\}\/next'/);
  assert.match(selection, /cases:\s+item:\s+- id: project/);
  assert.match(flow, /no-item:\s+- id: no-item\s+type: io\.kestra\.plugin\.core\.log\.Log/);
  assert.match(flow, /error:\s+- id: next-error\s+type: io\.kestra\.plugin\.core\.execution\.Fail/);
  assert.match(flow, /\n      - id: sleep\s+type: io\.kestra\.plugin\.core\.flow\.Sleep/);
});

test('Kestra routes direct project results and calls the dedicated endpoint', () => {
  assert.equal(projectRoute('{"path":"/projects/example"}'), 'project');
  assert.equal(projectRoute('{"status":"not found"}'), 'no-project');
  assert.equal(projectRoute('{"status":"search incomplete"}'), 'no-project');
  for (const body of ['invalid', '{}', '{"path":" "}', '{"status":"other"}',
    '{"path":"/projects/example","status":"not found"}', '{"text":"{\\"path\\":\\"/projects/example\\"}"}']) {
    assert.equal(projectRoute(body), 'error', body);
  }
  const projectTask = flow.slice(flow.indexOf('                - id: project\n'), flow.indexOf('                - id: has-project'));
  assert.match(projectTask, /uri: '\{\{ envs\.bridge_url \}\}\/project'/);
  assert.match(projectTask, /"list": fromJson\(outputs\.next\.body\)\.list/);
  assert.match(projectTask, /"id": fromJson\(outputs\.next\.body\)\.id/);
  assert.doesNotMatch(projectTask, /"prompt"|"requestId"/);
  assert.match(flow, /"directory": fromJson\(outputs\.project\.body\)\.path/);
  assert.doesNotMatch(flow, /fromJson\(fromJson\(outputs\.project\.body\)\.text\)/);
});

test('bridge command starts and serves HTTP requests', { timeout: 15_000 }, async (t) => {
  const portReservation = createServer();
  portReservation.listen(0, '127.0.0.1');
  await once(portReservation, 'listening');
  const address = portReservation.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  portReservation.close();
  await once(portReservation, 'close');

  const directory = mkdtempSync(join(tmpdir(), 'bridge-start-'));
  const commands = join(directory, '.agents', 'commands');
  const linearProvider = join(directory, '.agents', 'providers', 'linear');
  mkdirSync(commands, { recursive: true });
  mkdirSync(linearProvider, { recursive: true });
  copyFileSync(fileURLToPath(new URL('../commands/select-next-item.ts', import.meta.url)), join(commands, 'select-next-item.ts'));
  copyFileSync(fileURLToPath(new URL('../commands/resolve-local-project-directory.ts', import.meta.url)),
    join(commands, 'resolve-local-project-directory.ts'));
  copyFileSync(fileURLToPath(new URL('../commands/resolve-item-provider.ts', import.meta.url)), join(commands, 'resolve-item-provider.ts'));
  copyFileSync(fileURLToPath(new URL('../providers/linear/select-next-item.ts', import.meta.url)), join(linearProvider, 'select-next-item.ts'));
  writeFileSync(join(directory, 'agent-workflows.yaml'), 'item:\n  provider: linear\n');
  const repository = join(directory, 'example-repo');
  mkdirSync(join(repository, '.git'), { recursive: true });
  const codexHome = join(directory, 'codex-home');
  mkdirSync(codexHome);
  writeFileSync(join(codexHome, 'config.toml'), `[projects.${JSON.stringify(repository)}]\ntrust_level = "trusted"\n`);
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  const fixture = join(directory, 'linear.json');
  writeFileSync(join(bin, 'linear'), '#!/bin/sh\ncat "$NEXT_CLI_FIXTURE"\n', { mode: 0o755 });
  writeFileSync(fixture, JSON.stringify({ data: { issues: { nodes: [{
    id: 'issue-1', title: 'Ready item', url: 'https://linear.test/issue-1',
    updatedAt: '2026-01-01T00:00:00Z', state: { name: 'Backlog' }, project: { name: 'Project' },
    labels: { nodes: [{ name: 'agent-planned' }], pageInfo: { hasNextPage: false, endCursor: null } },
  }] } } }));
  const token = 'test-only-token-'.repeat(4);
  writeFileSync(join(directory, '.env'), [
    'LANGFUSE_PUBLIC_KEY=test-public',
    'LANGFUSE_SECRET_KEY=test-secret',
    `SECRET_BRIDGE_TOKEN=${Buffer.from(token).toString('base64')}`,
    `BRIDGE_PORT=${port}`,
    'INFERENCE_ENABLED=false',
  ].join('\n'));

  const entry = fileURLToPath(new URL('./server.ts', import.meta.url));
  const child = spawn(process.execPath, [entry], {
    cwd: directory,
    env: { PATH: `${bin}:${process.env.PATH ?? ''}`, HOME: process.env.HOME,
      NEXT_CLI_FIXTURE: fixture, CODEX_WORKING_DIRECTORY: directory, CODEX_HOME: codexHome },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const closed = new Promise<void>((resolve) => child.once('close', () => resolve()));
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => { stderr += chunk; });
  t.after(async () => {
    if (child.exitCode === null) child.kill('SIGTERM');
    await closed;
    rmSync(directory, { recursive: true, force: true });
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Bridge did not start: ${stderr}`)), 10_000);
    let stdout = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      if (!stdout.includes('Local bridge ready on port')) return;
      clearTimeout(timeout);
      resolve();
    });
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Bridge exited (${code}): ${stderr}`));
    });
  });

  const url = `http://127.0.0.1:${port}`;
  const health = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3_000) });
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', provider: 'codex', inferenceEnabled: false });
  const unauthorized = await fetch(url, { method: 'POST', body: 'Hello', signal: AbortSignal.timeout(3_000) });
  assert.equal(unauthorized.status, 401);
  assert.equal((await fetch(`${url}/next`, { method: 'POST' })).status, 401);
  assert.equal((await fetch(`${url}/project`, { method: 'POST' })).status, 401);
  const invalidProject = await fetch(`${url}/project`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ list: ' ', id: 'issue-1' }),
  });
  assert.equal(invalidProject.status, 400);
  assert.deepEqual(await invalidProject.json(), { error: 'invalid_project_input' });
  const projectRequest = (list: string) => fetch(`${url}/project`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ list, id: 'issue-1' }), signal: AbortSignal.timeout(3_000),
  });
  const resolved = await projectRequest('example repo');
  assert.equal(resolved.status, 200);
  assert.deepEqual(await resolved.json(), { path: realpathSync(repository) });
  const missing = await projectRequest('unmatched');
  assert.equal(missing.status, 200);
  assert.deepEqual(await missing.json(), { status: 'not found' });
  const selected = await fetch(`${url}/next`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3_000),
  });
  assert.equal(selected.status, 200);
  const selectedBody = await selected.text();
  assert.equal(selectionRoute(selectedBody), 'item');
  assert.deepEqual(JSON.parse(selectedBody), {
    name: 'Ready item', id: 'issue-1', url: 'https://linear.test/issue-1', list: 'Project',
  });
  // These are the actual field expressions used by the project/work prompts.
  for (const field of ['id', 'list']) {
    const expression = new RegExp(`fromJson\\(outputs.next.body\\)\\.${field}`, 'g');
    assert.ok(flow.match(expression)?.length, `${field} must use the direct response`);
  }
  assert.doesNotMatch(flow, /fromJson\(fromJson\(outputs.next.body\).text\)/);
  writeFileSync(fixture, JSON.stringify({ data: { issues: { nodes: [] } } }));
  const empty = await fetch(`${url}/next`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3_000),
  });
  assert.equal(empty.status, 200);
  const emptyBody = await empty.text();
  assert.equal(selectionRoute(emptyBody), 'no-item');
  assert.deepEqual(JSON.parse(emptyBody), { status: 'no eligible item' });
  writeFileSync(fixture, 'invalid');
  const failed = await fetch(`${url}/next`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3_000),
  });
  assert.equal(failed.status, 502);
  assert.deepEqual(await failed.json(), { error: 'selection_failed' });
});
