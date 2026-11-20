import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { cleanupWindow } from './cleanup-remote.ts';

const from = '2026-01-15T10:00:00Z';
const until = '2026-01-15T11:00:00Z';

test('clamps the first interval and rejects broad or unordered replays', () => {
  const activation = '2026-01-15T10:30:00Z';
  assert.deepEqual(cleanupWindow(from, until, activation), {
    start: Date.parse(activation), end: Date.parse(until),
  });
  assert.equal(cleanupWindow(from, until, '2026-01-15T11:10:00Z').start, Date.parse(until));
  assert.throws(() => cleanupWindow(until, from, activation));
  assert.throws(() => cleanupWindow('2026-01-15T09:00:00Z', until, activation));
});

test('selects completed tickets across pages with exclusive upper bounds for both providers', t => {
  const bin = mkdtempSync(join(tmpdir(), 'cleanup-window-'));
  t.after(() => rmSync(bin, { recursive: true, force: true }));
  writeFileSync(join(bin, 'linear'), `#!/usr/bin/env node
    const args = process.argv;
    const { after } = JSON.parse(args[args.indexOf('--variables-json') + 1]);
    const entry = (id, completedAt, type = 'completed') => ({ id, completedAt, state: { type } });
    const nodes = after ? [entry('second', '2026-01-15T10:13:00Z'), entry('upper', '${until}')]
      : [entry('first', '${from}'), entry('reopened', '${from}', 'started')];
    console.log(JSON.stringify({data: {issues: {nodes, pageInfo: {hasNextPage: !after, endCursor: after ? null : 'next'}}}}));
  `, { mode: 0o755 });
  writeFileSync(join(bin, 'clickup-cli'), `#!/usr/bin/env node
    const args = process.argv;
    const page = args[args.indexOf('--page') + 1];
    const entry = (id, when, type = 'done') => ({ id, date_done: String(Date.parse(when)), status: { type } });
    const tasks = page === '0'
      ? [entry('first', '${from}'), ...Array.from({length: 99}, (_, i) => entry('pending' + i, '${from}', 'custom'))]
      : [entry('second', '2026-01-15T10:13:00Z'), entry('upper', '${until}')];
    console.log(JSON.stringify(tasks));
  `, { mode: 0o755 });
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { cleanupWindow, completedTickets } from './commands/cleanup-remote.ts';
    const window = cleanupWindow('${from}', '${until}', '${from}');
    console.log(JSON.stringify(['linear', 'clickup'].map(provider => completedTickets(provider, window))));
  `], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
  assert.deepEqual(JSON.parse(output), [['first', 'second'], ['first', 'second']]);
});
