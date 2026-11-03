import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const token = 'test-only-token-'.repeat(4);
export const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

export async function startBridge(t: TestContext, mode = 'completed', enabled = true, workingDirectory?: string) {
  const reservation = createServer().listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  reservation.close();
  await once(reservation, 'close');
  const directory = mkdtempSync(join(tmpdir(), 'bridge-http-'));
  writeFileSync(join(directory, '.env'), [
    'LANGFUSE_PUBLIC_KEY=test-public', 'LANGFUSE_SECRET_KEY=test-secret',
    `SECRET_BRIDGE_TOKEN=${Buffer.from(token).toString('base64')}`,
    `BRIDGE_PORT=${address.port}`, `INFERENCE_ENABLED=${enabled}`,
  ].join('\n'));
  const child = spawn(process.execPath, [
    ...(mode === 'real' ? [] : ['--import', fileURLToPath(new URL('./bridge-preload.ts', import.meta.url))]),
    fileURLToPath(new URL('../server.ts', import.meta.url)),
  ], {
    cwd: directory,
    env: { PATH: process.env.PATH, BRIDGE_TEST_MODE: mode, CODEX_WORKING_DIRECTORY: workingDirectory },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  const events: Array<{ event: string; name?: string; input?: unknown; reused?: boolean }> = [];
  child.on('message', (message) => events.push(message as typeof events[number]));
  const closed = once(child, 'close');
  let stopped = false;
  const stop = async () => {
    if (!stopped) {
      stopped = true;
      child.kill('SIGTERM');
      await closed;
    }
  };
  t.after(async () => {
    await stop();
    rmSync(directory, { recursive: true, force: true });
  });
  let stderr = '';
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Bridge did not start: ${stderr}`)), 10_000);
    let stdout = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      stdout += chunk;
      if (stdout.includes('Local bridge ready on port')) { clearTimeout(timeout); resolve(); }
    });
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
    child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Bridge exited (${code}): ${stderr}`)); });
  });
  return { url: `http://127.0.0.1:${address.port}`, events, child, stop };
}
