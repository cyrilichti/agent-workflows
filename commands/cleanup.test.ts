import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('./cleanup.ts', import.meta.url));
const from = '2026-01-15T10:00:00Z';
const until = '2026-01-15T11:00:00Z';

function run(action: string, ...args: string[]) {
  return JSON.parse(execFileSync(process.execPath, [command, action, ...args], { encoding: 'utf8' }));
}

test('reports a selected interval with no tickets before activation', () => {
  const result = run('select', from, until, '2026-01-15T11:30:00Z');
  assert.equal(result.status, 'selected');
  assert.equal(result.from, from);
  assert.equal(result.until, until);
  assert.deepEqual(result.tickets, []);
});

test('reports invalid intervals through the script response', () => {
  const result = run('select', until, from, from);
  assert.equal(result.status, 'failed');
  assert.equal(result.from, until);
  assert.equal(result.until, from);
  assert.match(result.reason, /completed cleanup interval/);
});
