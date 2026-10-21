import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fetchCandidates } from './select-next-item.ts';

test('Linear adapter requests planned issues and fetches remaining labels', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'linear-adapter-'));
  const previousPath = process.env.PATH;
  const previousRoot = process.env.LINEAR_TEST_ROOT;
  t.after(() => {
    process.env.PATH = previousPath;
    if (previousRoot === undefined) delete process.env.LINEAR_TEST_ROOT;
    else process.env.LINEAR_TEST_ROOT = previousRoot;
    rmSync(directory, { recursive: true, force: true });
  });
  writeFileSync(join(directory, 'linear'), `#!/bin/sh
count=0
[ -f "$LINEAR_TEST_ROOT/count" ] && count=$(cat "$LINEAR_TEST_ROOT/count")
count=$((count + 1))
printf "%s" "$count" > "$LINEAR_TEST_ROOT/count"
printf "%s\\n" "$@" > "$LINEAR_TEST_ROOT/args-$count"
cat > "$LINEAR_TEST_ROOT/query-$count"
cat "$LINEAR_TEST_ROOT/response-$count.json"
`, { mode: 0o755 });
  writeFileSync(join(directory, 'response-1.json'), JSON.stringify({ data: { issues: { nodes: [
    { id: 'issue-1', title: 'Review me', url: 'https://linear.test/issue-1',
      updatedAt: '2026-01-02T00:00:00Z', state: { name: ' In Review ' }, project: { name: 'Project' },
      labels: { nodes: [{ name: 'agent-planned' }], pageInfo: { hasNextPage: true, endCursor: 'cursor-1' } } },
    { id: 'issue-2', title: 'Unmapped', url: 'https://linear.test/issue-2',
      updatedAt: 'invalid', state: { name: 'unknown' }, project: null,
      labels: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } },
  ] } } }));
  writeFileSync(join(directory, 'response-2.json'), JSON.stringify({ data: { issue: { labels: {
    nodes: [{ name: 'agent-inspected' }], pageInfo: { hasNextPage: false, endCursor: null },
  } } } }));
  process.env.PATH = `${directory}:${previousPath ?? ''}`;
  process.env.LINEAR_TEST_ROOT = directory;

  assert.deepEqual(fetchCandidates(), [
    { name: 'Review me', id: 'issue-1', url: 'https://linear.test/issue-1', list: 'Project',
      category: 'review', labels: ['agent-planned', 'agent-inspected'], updatedAt: Date.parse('2026-01-02T00:00:00Z') },
    { name: 'Unmapped', id: 'issue-2', url: 'https://linear.test/issue-2', list: null,
      category: null, labels: [], updatedAt: NaN },
  ]);
  assert.equal(readFileSync(join(directory, 'count'), 'utf8'), '2');
  assert.deepEqual(readFileSync(join(directory, 'args-1'), 'utf8').trim().split('\n'), ['--no-input', 'api']);
  assert.match(readFileSync(join(directory, 'query-1'), 'utf8'), /first: 250/);
  assert.match(readFileSync(join(directory, 'query-1'), 'utf8'), /agent-planned/);
  assert.deepEqual(readFileSync(join(directory, 'args-2'), 'utf8').trim().split('\n'),
    ['--no-input', 'api', '--variables-json', JSON.stringify({ id: 'issue-1', after: 'cursor-1' })]);
  assert.match(readFileSync(join(directory, 'query-2'), 'utf8'), /NextIssueLabels/);
});
