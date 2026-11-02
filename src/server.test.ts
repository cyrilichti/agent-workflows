import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, copyFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  copyFileSync(fileURLToPath(new URL('../commands/resolve-item-provider.ts', import.meta.url)), join(commands, 'resolve-item-provider.ts'));
  copyFileSync(fileURLToPath(new URL('../providers/linear/select-next-item.ts', import.meta.url)), join(linearProvider, 'select-next-item.ts'));
  writeFileSync(join(directory, 'agent-workflows.yaml'), 'item:\n  provider: linear\n');
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
      NEXT_CLI_FIXTURE: fixture, CODEX_WORKING_DIRECTORY: directory },
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
  const selected = await fetch(`${url}/next`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3_000),
  });
  assert.equal(selected.status, 200);
  assert.deepEqual(await selected.json(), {
    name: 'Ready item', id: 'issue-1', url: 'https://linear.test/issue-1', list: 'Project',
  });
  writeFileSync(fixture, JSON.stringify({ data: { issues: { nodes: [] } } }));
  const empty = await fetch(`${url}/next`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3_000),
  });
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { status: 'no eligible item' });
  writeFileSync(fixture, 'invalid');
  const failed = await fetch(`${url}/next`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3_000),
  });
  assert.equal(failed.status, 502);
  assert.deepEqual(await failed.json(), { error: 'selection_failed' });
});
