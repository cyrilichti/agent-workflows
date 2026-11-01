import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const program = resolve('commands/select-next-item.ts');

function fixture(tasks: unknown[], provider = 'clickup', remainingLabels?: unknown) {
  const root = mkdtempSync(join(tmpdir(), 'next-test-'));
  const bin = join(root, 'bin');
  mkdirSync(bin);
  const commands = join(root, 'commands');
  mkdirSync(commands);
  copyFileSync(program, join(commands, 'select-next-item.ts'));
  copyFileSync(resolve('commands/resolve-item-provider.ts'), join(commands, 'resolve-item-provider.ts'));
  for (const providerName of ['clickup', 'linear']) {
    const destination = join(root, 'providers', providerName);
    mkdirSync(destination, { recursive: true });
    copyFileSync(resolve(`providers/${providerName}/select-next-item.ts`), join(destination, 'select-next-item.ts'));
  }
  writeFileSync(join(root, 'agent-workflows.yaml'), `item:\n  provider: ${provider}\n`);
  writeFileSync(join(root, 'tasks.json'), JSON.stringify(tasks));
  writeFileSync(join(root, 'linear-1.json'), JSON.stringify({ data: { issues: { nodes: tasks } } }));
  if (remainingLabels) writeFileSync(join(root, 'linear-2.json'), JSON.stringify(remainingLabels));
  writeFileSync(join(bin, 'clickup-cli'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$NEXT_ARGS"\ncat "$NEXT_FIXTURE"\n', { mode: 0o755 });
  writeFileSync(join(bin, 'linear'),
    '#!/bin/sh\ncount=0\n[ -f "$NEXT_LINEAR_COUNT" ] && count=$(cat "$NEXT_LINEAR_COUNT")\ncount=$((count + 1))\nprintf "%s" "$count" > "$NEXT_LINEAR_COUNT"\nprintf "%s\\n" "$@" > "$NEXT_LINEAR_ROOT/linear-args-$count.txt"\ncat > "$NEXT_LINEAR_ROOT/linear-query-$count.txt"\ncat "$NEXT_LINEAR_ROOT/linear-$count.json"\n',
    { mode: 0o755 });
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    NEXT_FIXTURE: join(root, 'tasks.json'),
    NEXT_ARGS: join(root, 'args.txt'),
    NEXT_LINEAR_ROOT: root,
    NEXT_LINEAR_COUNT: join(root, 'linear-count.txt'),
  };
  return {
    root,
    env,
    run: (...args: string[]) => spawnSync(process.execPath, [join(commands, 'select-next-item.ts'), ...args], { cwd: root, env, encoding: 'utf8' }),
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
    task('first', 'to do', '2'),
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

test('unknown ClickUp statuses are skipped without another provider call', () => {
  const f = fixture([task('unknown', 'À valider', '1'), task('open', 'Open', '2')]);
  try {
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).id, 'open');
    assert.deepEqual(readFileSync(join(f.root, 'args.txt'), 'utf8').trim().split('\n'),
      ['task', 'search', '--tag', 'agent-planned', '--page', '0', '--output', 'json']);
  } finally { f.cleanup(); }
});

test('incomplete labels, invalid dates, and missing selected destinations fail', () => {
  for (const tasks of [
    [{ ...task('bad', 'Open', '1'), tags: null }],
    [task('bad', 'Open', 'not-a-date')],
    [{ ...task('bad', 'Open', '1'), list: null }],
  ]) {
    const f = fixture(tasks);
    try {
      const result = f.run();
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
    } finally { f.cleanup(); }
  }
});

function issue(id: string, status: string, updatedAt: string, labels = ['agent-planned']) {
  return {
    id, identifier: id, title: `Issue ${id}`, url: `https://linear.test/${id}`, updatedAt,
    state: { name: status, type: 'unstarted' }, project: { name: 'Project' },
    labels: { nodes: labels.map(name => ({ name })), pageInfo: { hasNextPage: false, endCursor: null as string | null } },
  };
}

test('Linear selection uses the first 250 filtered issues and returns the oldest eligible one', () => {
  const f = fixture([
    issue('reviewed', 'Review', '2026-01-01T00:00:00Z', ['agent-planned', 'agent-inspected']),
    issue('first', 'Backlog', '2026-01-02T00:00:00Z'),
    issue('newer', 'Todo', '2026-01-03T00:00:00Z'),
  ], 'linear');
  try {
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { name: 'Issue first', id: 'first', url: 'https://linear.test/first', list: 'Project' });
    assert.equal(readFileSync(join(f.root, 'linear-count.txt'), 'utf8'), '1');
    assert.match(readFileSync(join(f.root, 'linear-query-1.txt'), 'utf8'), /first: 250/);
    assert.match(readFileSync(join(f.root, 'linear-query-1.txt'), 'utf8'), /agent-planned/);
  } finally { f.cleanup(); }
});

test('Linear completes partial labels before deciding review eligibility', () => {
  const reviewed = issue('reviewed', 'Review', '2026-01-01T00:00:00Z');
  reviewed.labels.pageInfo = { hasNextPage: true, endCursor: 'cursor-1' };
  const f = fixture([reviewed, issue('selected', 'Todo', '2026-01-02T00:00:00Z')], 'linear', {
    data: { issue: { labels: {
      nodes: [{ name: 'agent-inspected' }], pageInfo: { hasNextPage: false, endCursor: null },
    } } },
  });
  try {
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).id, 'selected');
    assert.equal(readFileSync(join(f.root, 'linear-count.txt'), 'utf8'), '2');
    assert.match(readFileSync(join(f.root, 'linear-args-2.txt'), 'utf8'), /cursor-1/);
  } finally { f.cleanup(); }
});

test('unknown Linear statuses are skipped in one CLI query', () => {
  const f = fixture([issue('unknown', 'À valider', '2026-01-01T00:00:00Z')], 'linear');
  try {
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { status: 'no eligible item' });
    assert.equal(readFileSync(join(f.root, 'linear-count.txt'), 'utf8'), '1');
  } finally { f.cleanup(); }
});

test('the workflow command resolves its installed .agents path even when the project has a commands directory', () => {
  for (const configuredProvider of ['clickup', 'linear']) {
    const f = fixture([], configuredProvider);
    try {
      const workflow = join(f.root, '.agents', 'workflows', 'next.md');
      mkdirSync(dirname(workflow), { recursive: true });
      copyFileSync(resolve('workflows/next.md'), workflow);
      const installed = join(f.root, '.agents', 'commands');
      mkdirSync(installed, { recursive: true });
      copyFileSync(program, join(installed, 'select-next-item.ts'));
      copyFileSync(resolve('commands/resolve-item-provider.ts'), join(installed, 'resolve-item-provider.ts'));
      writeFileSync(join(f.root, 'commands', 'select-next-item.ts'), 'process.exit(42);\n');
      for (const provider of ['clickup', 'linear']) {
        const destination = join(f.root, '.agents', 'providers', provider);
        mkdirSync(destination, { recursive: true });
        copyFileSync(resolve(`providers/${provider}/select-next-item.ts`), join(destination, 'select-next-item.ts'));
      }
      const result = spawnSync(process.execPath, ['../commands/select-next-item.ts'],
        { cwd: dirname(workflow), env: f.env, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(JSON.parse(result.stdout), { status: 'no eligible item' });
    } finally { f.cleanup(); }
  }
});
