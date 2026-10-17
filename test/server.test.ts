import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
  const token = 'test-only-token-'.repeat(4);
  writeFileSync(join(directory, '.env'), [
    'LANGFUSE_PUBLIC_KEY=test-public',
    'LANGFUSE_SECRET_KEY=test-secret',
    `SECRET_BRIDGE_TOKEN=${Buffer.from(token).toString('base64')}`,
    `BRIDGE_PORT=${port}`,
    'INFERENCE_ENABLED=false',
  ].join('\n'));

  const entry = fileURLToPath(new URL('../src/server.ts', import.meta.url));
  const child = spawn(process.execPath, [entry], {
    cwd: directory,
    env: { PATH: process.env.PATH, HOME: process.env.HOME },
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
});
