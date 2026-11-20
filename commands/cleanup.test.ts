import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
  return spawnSync(process.execPath, [join(root, 'commands', 'cleanup.ts'), ...args], {
    encoding: 'utf8',
  });
}

test('succeeds with an empty result before activation', t => {
  const runResult = run(t, 'select', from, until, '2026-01-15T11:30:00Z');
  assert.equal(runResult.status, 0, runResult.stderr);
  assert.deepEqual(JSON.parse(runResult.stdout), { provider: 'linear', items: [] });
});

test('returns a JSON error for an invalid interval', t => {
  const result = run(t, 'select', until, from, from);
  assert.equal(result.status, 0, result.stderr);
  assert.match(JSON.parse(result.stdout).error, /completed cleanup interval/);
});

test('returns the same JSON error shape if the item provider changed before cleanup', t => {
  const result = run(t, 'clean', JSON.stringify({ provider: 'clickup', items: ['item-1'] }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { error: 'The item provider changed after selection.' });
});
