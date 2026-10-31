import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { parseDoneInput } from './done.ts';

test('done CLI accepts an exact reference or an explicit title query', () => {
  assert.deepEqual(parseDoneInput(['ICY-1']), { reference: 'ICY-1' });
  assert.deepEqual(parseDoneInput(['--query', 'Refondre /done']),
    { query: 'Refondre /done' });
  assert.throws(() => parseDoneInput(['--query']), /Supply an item ID/);
  assert.throws(() => parseDoneInput([]), /Supply an item ID/);
});

const cli = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.TEST_DONE_ROOT;
const name = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const statePath = path.join(root, 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const save = () => fs.writeFileSync(statePath, JSON.stringify(state));
const output = value => process.stdout.write(JSON.stringify(value) + '\\n');
if (name === 'linear') {
  if (args.includes('api')) {
    output({ data: { issue: { id: 'uuid-1', identifier: 'ICY-1',
      state: { id: state.done ? 'done' : 'review', name: state.done ? 'Done' : 'Review',
        type: state.done ? 'completed' : 'started' },
      team: { id: 'team-1', key: 'ICY' }, project: null } } });
  } else if (args[0] === 'issue' && args[1] === 'view') {
    output({ title: 'A task', description: '', url: 'https://linear.app/acme/issue/ICY-1',
      labels: state.label ? [{ name: 'agent-inspected' }] : [],
      comments: (state.links ?? [state.versionProvider === 'gitlab'
        ? 'https://gitlab.example/acme/repo/-/merge_requests/7'
        : 'https://github.com/acme/repo/pull/7']).map((url, index) => ({
        id: 'comment-' + index, body: 'Draft ' + (state.versionProvider === 'gitlab' ? 'MR' : 'PR')
          + ': ' + url,
      })) });
  } else if (args[0] === 'team' && args[1] === 'states') {
    const statuses = [
      { id: 'review', name: 'Review', type: 'started' },
      { id: 'done', name: 'Done', type: 'completed' },
    ];
    if (state.ambiguous) statuses.push({ id: 'also-done', name: 'Finished', type: 'completed' });
    output(statuses);
  } else if (args[0] === 'issue' && args[1] === 'update') {
    state.itemUpdates++;
    if (state.failItem) { save(); process.exit(2); }
    state.done = true;
    save();
  } else process.exit(3);
} else if (name === 'gh') {
  if (args[0] !== 'api') process.exit(3);
  if (args.includes('PUT')) {
    state.mergeCalls++;
    state.merged = true;
    state.mergeInput = fs.readFileSync(0, 'utf8');
    save();
    output({ merged: true });
  } else {
    state.readCalls++;
    const sha = state.stale && state.readCalls > 1 ? 'changed' : 'head-1';
    save();
      output({ number: 7, title: 'A task', state: state.merged ? 'closed' : 'open',
      merged: state.merged, draft: false, mergeable: !state.blocked, head: { ref: 'feature', sha },
      base: { ref: 'main' }, body: '', html_url: 'https://github.com/acme/repo/pull/7' });
  }
} else if (name === 'glab') {
  if (args[0] === 'mr' && args[1] === 'merge') {
    state.mergeCalls++;
    state.mergeArgs = args;
    state.merged = true;
    save();
  } else if (args[0] === 'api') {
    state.readCalls++;
    const sha = state.stale && state.readCalls > 1 ? 'changed' : 'head-1';
    save();
    output({ iid: 7, title: 'A task', state: state.merged ? 'merged' : 'opened',
      draft: false, source_branch: 'feature', sha, target_branch: 'main',
      description: '', web_url: 'https://gitlab.example/acme/repo/-/merge_requests/7',
      detailed_merge_status: state.blocked ? 'conflict' : 'mergeable' });
  } else process.exit(3);
} else process.exit(3);
`;

function fixture(overrides: Record<string, unknown> = {}, versionProvider: 'github' | 'gitlab' =
  'github') {
  const root = mkdtempSync(join(tmpdir(), 'done-command-'));
  const bin = join(root, 'bin');
  mkdirSync(bin);
  writeFileSync(join(root, 'agent-workflows.yaml'),
    `mcp:\n  item:\n    provider: linear\n  version:\n    provider: ${versionProvider}\n`);
  execFileSync('git', ['init', '-q', root]);
  execFileSync('git', ['-C', root, 'remote', 'add', 'origin', versionProvider === 'github'
    ? 'https://github.com/acme/repo.git' : 'https://gitlab.example/acme/repo.git']);
  const initial = { label: true, merged: false, done: false, ambiguous: false, blocked: false,
    stale: false, failItem: false, mergeCalls: 0, itemUpdates: 0, readCalls: 0,
    versionProvider,
    ...overrides };
  writeFileSync(join(root, 'state.json'), JSON.stringify(initial));
  for (const name of ['linear', 'gh', 'glab'])
    writeFileSync(join(bin, name), cli, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, TEST_DONE_ROOT: root };
  return {
    run(input: unknown = { reference: 'ICY-1' }) {
      const code = `import { readFileSync } from 'node:fs';
import { completeDone } from '${resolve('commands/done.ts')}';
const input = JSON.parse(readFileSync(0, 'utf8'));
const result = completeDone(process.argv[1], input.reference, input.query);
process.stdout.write(JSON.stringify(result));
process.exitCode = result.status === 'complete' ? 0 : 1;`;
      const proc = spawnSync(process.execPath, ['--input-type=module', '-e', code, root], {
        cwd: root, env, input: JSON.stringify(input), encoding: 'utf8',
      });
      return { code: proc.status, value: JSON.parse(proc.stdout), stderr: proc.stderr };
    },
    state() { return JSON.parse(readFileSync(join(root, 'state.json'), 'utf8')); },
    cleanup() { rmSync(root, { recursive: true, force: true }); },
  };
}

test('done squash merges an unchanged request and completes its item', () => {
  const f = fixture();
  try {
    const result = f.run();
    assert.equal(result.code, 0, JSON.stringify(result));
    assert.equal(result.value.status, 'complete');
    assert.equal(result.value.request.state, 'merged');
    assert.equal(result.value.item.status, 'Done');
    assert.equal(f.state().mergeCalls, 1);
    assert.equal(f.state().itemUpdates, 1);
    assert.deepEqual(JSON.parse(f.state().mergeInput),
      { sha: 'head-1', merge_method: 'squash' });
  } finally { f.cleanup(); }
});

test('done uses GitLab squash merge with the frozen head SHA', () => {
  const f = fixture({}, 'gitlab');
  try {
    const result = f.run();
    assert.equal(result.value.status, 'complete', JSON.stringify(result));
    assert.deepEqual(f.state().mergeArgs, ['mr', 'merge', '7', '--repo',
      'https://gitlab.example/acme/repo', '--squash', '--sha', 'head-1',
      '--auto-merge=false', '--yes']);
  } finally { f.cleanup(); }
});

test('done skips merge for an already merged request', () => {
  const f = fixture({ merged: true });
  try {
    const result = f.run();
    assert.equal(result.value.status, 'complete', JSON.stringify(result));
    assert.equal(f.state().mergeCalls, 0);
    assert.equal(f.state().itemUpdates, 1);
  } finally { f.cleanup(); }
});

test('done performs no mutation when request and item are already complete', () => {
  const f = fixture({ merged: true, done: true });
  try {
    const result = f.run();
    assert.equal(result.value.status, 'complete', JSON.stringify(result));
    assert.equal(f.state().mergeCalls, 0);
    assert.equal(f.state().itemUpdates, 0);
  } finally { f.cleanup(); }
});

test('done stops before mutation on missing label, stale head, or ambiguous status', () => {
  for (const [scenario, stage] of [
    [{ label: false }, 'read_item'], [{ stale: true }, 'recheck_request'],
    [{ ambiguous: true }, 'resolve_item_status'], [{ blocked: true }, 'resolve_request'],
  ] as const) {
    const f = fixture(scenario);
    try {
      const result = f.run();
      assert.equal(result.value.status, 'stopped');
      assert.equal(result.value.stage, stage);
      assert.equal(f.state().mergeCalls, 0);
      assert.equal(f.state().itemUpdates, 0);
    } finally { f.cleanup(); }
  }
});

test('done stops before mutation on absent, ambiguous, or foreign request links', () => {
  for (const links of [[], ['https://github.com/acme/repo/pull/7',
    'https://github.com/acme/repo/pull/8'],
  ['https://github.com/other/repo/pull/7']]) {
    const f = fixture({ links });
    try {
      const result = f.run();
      assert.equal(result.value.status, 'stopped');
      assert.equal(f.state().mergeCalls, 0);
      assert.equal(f.state().itemUpdates, 0);
    } finally { f.cleanup(); }
  }
});

test('done reports only the item transition after an observed merge', () => {
  const f = fixture({ failItem: true });
  try {
    const result = f.run();
    assert.equal(result.value.status, 'partial', JSON.stringify(result));
    assert.equal(result.value.stage, 'complete_item');
    assert.equal(result.value.request.state, 'merged');
    assert.match(result.value.remaining, /item ICY-1.*done/);
    assert.equal(f.state().mergeCalls, 1);
  } finally { f.cleanup(); }
});
