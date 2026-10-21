import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fetchCandidates } from './select-next-item.ts';

test('ClickUp adapter requests planned tasks and normalizes statuses, labels, and dates', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'clickup-adapter-'));
  const previousPath = process.env.PATH;
  const previousFixture = process.env.CLICKUP_TEST_FIXTURE;
  const previousArgs = process.env.CLICKUP_TEST_ARGS;
  t.after(() => {
    process.env.PATH = previousPath;
    if (previousFixture === undefined) delete process.env.CLICKUP_TEST_FIXTURE;
    else process.env.CLICKUP_TEST_FIXTURE = previousFixture;
    if (previousArgs === undefined) delete process.env.CLICKUP_TEST_ARGS;
    else process.env.CLICKUP_TEST_ARGS = previousArgs;
    rmSync(directory, { recursive: true, force: true });
  });
  const fixture = join(directory, 'tasks.json');
  const args = join(directory, 'args.txt');
  writeFileSync(join(directory, 'clickup-cli'),
    '#!/bin/sh\nprintf "%s\\n" "$@" > "$CLICKUP_TEST_ARGS"\ncat "$CLICKUP_TEST_FIXTURE"\n', { mode: 0o755 });
  writeFileSync(fixture, JSON.stringify([
    { name: 'First', id: '1', url: 'https://example.test/1', list: { name: 'Queue' },
      status: { status: ' To Do ' }, tags: [{ name: 'agent-planned' }], date_updated: '123' },
    { name: 'Second', id: '2', url: 'https://example.test/2', list: null,
      status: { status: 'unknown' }, tags: [], date_updated: 'invalid' },
  ]));
  process.env.PATH = `${directory}:${previousPath ?? ''}`;
  process.env.CLICKUP_TEST_FIXTURE = fixture;
  process.env.CLICKUP_TEST_ARGS = args;

  assert.deepEqual(fetchCandidates(), [
    { name: 'First', id: '1', url: 'https://example.test/1', list: 'Queue',
      category: 'waiting', labels: ['agent-planned'], updatedAt: 123 },
    { name: 'Second', id: '2', url: 'https://example.test/2', list: null,
      category: null, labels: [], updatedAt: NaN },
  ]);
  assert.deepEqual(readFileSync(args, 'utf8').trim().split('\n'),
    ['task', 'search', '--tag', 'agent-planned', '--page', '0', '--output', 'json']);
});
