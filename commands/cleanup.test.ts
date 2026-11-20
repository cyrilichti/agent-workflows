import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test, type TestContext } from 'node:test';

const from = '2026-01-15T10:00:00Z';
const until = '2026-01-15T11:00:00Z';

function run(t: TestContext, ...args: string[]) {
  const root = mkdtempSync(join(tmpdir(), 'cleanup-command-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of [
    'commands/cleanup.ts', 'commands/cleanup-clone.ts', 'commands/cleanup-remote.ts',
    'commands/read-item.ts', 'commands/resolve-item-provider.ts',
    'providers/clickup/read-item.ts', 'providers/linear/read-item.ts',
  ]) {
    const destination = join(root, file);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(import.meta.dirname, '..', file), destination);
  }
  writeFileSync(join(root, 'agent-workflows.yaml'), 'item:\n  provider: linear\n');
  return JSON.parse(execFileSync(process.execPath, [join(root, 'commands', 'cleanup.ts'), ...args], {
    encoding: 'utf8',
  }));
}

test('reports a selected interval with no tickets before activation', t => {
  const result = run(t, 'select', from, until, '2026-01-15T11:30:00Z');
  assert.equal(result.status, 'selected');
  assert.equal(result.from, from);
  assert.equal(result.until, until);
  assert.deepEqual(result.tickets, []);
});

test('reports invalid intervals through the script response', t => {
  const result = run(t, 'select', until, from, from);
  assert.equal(result.status, 'failed');
  assert.equal(result.from, until);
  assert.equal(result.until, from);
  assert.match(result.reason, /completed cleanup interval/);
});
