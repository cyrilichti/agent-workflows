import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const program = resolve('commands/next.ts');

function fixture(tasks: unknown[], provider = 'clickup') {
  const root = mkdtempSync(join(tmpdir(), 'next-test-'));
  const bin = join(root, 'bin');
  mkdirSync(bin);
  writeFileSync(join(root, 'agent-workflows.yaml'), `mcp:\n  item:\n    provider: ${provider}\n`);
  writeFileSync(join(root, 'tasks.json'), JSON.stringify(tasks));
  writeFileSync(join(bin, 'clickup-cli'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$NEXT_ARGS"\ncat "$NEXT_FIXTURE"\n', { mode: 0o755 });
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    NEXT_FIXTURE: join(root, 'tasks.json'),
    NEXT_ARGS: join(root, 'args.txt'),
  };
  return {
    root,
    run: (...args: string[]) => spawnSync(process.execPath, [program, ...args], { cwd: root, env, encoding: 'utf8' }),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function task(id: string, status: string, updated: string, tags = ['agent-planned']) {
  return {
    name: `Task ${id}`, id, url: `https://example.test/${id}`, list: { name: 'List' },
    status: { status }, tags: tags.map(name => ({ name })), date_updated: updated,
  };
}

test('ClickUp selection uses one filtered call, oldest eligible date, and provider order for ties', () => {
  const f = fixture([
    task('reviewed', 'Review', '1', ['agent-planned', 'agent-inspected']),
    task('first', 'Open', '2'),
    task('tied', 'Open', '2'),
    task('newer', 'Open', '3'),
  ]);
  try {
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { name: 'Task first', id: 'first', url: 'https://example.test/first', list: 'List' });
    assert.deepEqual(readFileSync(join(f.root, 'args.txt'), 'utf8').trim().split('\n'),
      ['task', 'search', '--tag', 'agent-planned', '--page', '0', '--output', 'json']);
  } finally { f.cleanup(); }
});

test('unknown statuses are classified from a local snapshot without another provider call', () => {
  const f = fixture([task('unknown', 'À valider', '1'), task('open', 'Open', '2')]);
  try {
    const first = f.run();
    assert.equal(first.status, 0, first.stderr);
    const request = JSON.parse(first.stdout);
    assert.equal(request.status, 'classify-statuses');
    assert.deepEqual(request.statuses, ['À valider']);
    const second = f.run('--resume', request.snapshot, 'review');
    assert.equal(second.status, 0, second.stderr);
    assert.equal(JSON.parse(second.stdout).id, 'unknown');
    assert.throws(() => readFileSync(request.snapshot));
    assert.deepEqual(readFileSync(join(f.root, 'args.txt'), 'utf8').trim().split('\n'),
      ['task', 'search', '--tag', 'agent-planned', '--page', '0', '--output', 'json']);
  } finally { f.cleanup(); }
});

test('incomplete labels and invalid eligible timestamps fail instead of selecting another item', () => {
  for (const tasks of [[{ ...task('bad', 'Open', '1'), tags: null }], [task('bad', 'Open', 'not-a-date')]]) {
    const f = fixture(tasks);
    try {
      const result = f.run();
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
    } finally { f.cleanup(); }
  }
});

test('Linear remains on the MCP workflow', () => {
  const f = fixture([], 'linear');
  try {
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { status: 'use-linear-mcp' });
  } finally { f.cleanup(); }
});

test('the workflow command resolves an installed .agents layout', () => {
  const f = fixture([], 'linear');
  try {
    const installed = join(f.root, '.agents', 'commands');
    mkdirSync(installed, { recursive: true });
    copyFileSync(program, join(installed, 'next.ts'));
    copyFileSync(resolve('commands/next-selection.ts'), join(installed, 'next-selection.ts'));
    const result = spawnSync('sh', ['-c',
      'if [ -f commands/next.ts ]; then node commands/next.ts; else node .agents/commands/next.ts; fi'],
      { cwd: f.root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { status: 'use-linear-mcp' });
  } finally { f.cleanup(); }
});
