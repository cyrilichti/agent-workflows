import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readLocalReviewSnapshot } from './read-local-review-snapshot.ts';

function repo(t: test.TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'local-review-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args: string[]) => execFileSync('git', args,
    { cwd: root, encoding: 'utf8' }).trim();
  git('init', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  writeFileSync(join(root, 'file.txt'), 'base\n');
  git('add', 'file.txt');
  git('commit', '-m', 'base');
  const base = git('rev-parse', 'HEAD');
  git('switch', '-c', 'feature');
  writeFileSync(join(root, 'file.txt'), 'base\nfeature\n');
  git('add', 'file.txt');
  git('commit', '-m', 'feature');
  const head = git('rev-parse', 'HEAD');
  git('switch', 'main');
  writeFileSync(join(root, 'other.txt'), 'target\n');
  git('add', 'other.txt');
  git('commit', '-m', 'target');
  const target = git('rev-parse', 'HEAD');
  git('switch', 'feature');
  return { root, git, base, head, target };
}

test('GitHub local snapshot compares from merge base, not advanced target tip', (t) => {
  const { root, base, head, target } = repo(t);
  const request = {
    request_id: 7, kind: 'pull_request' as const, title: 'Feature', state: 'open',
    draft: false, source_branch: 'feature', target_branch: 'main', head_sha: head,
    body: '', url: 'https://github.com/acme/repo/pull/7',
    comparison: { base_sha: target, head_sha: head },
    review_activity: { comments: [], reviews: [], issue_comments: [] },
  };
  const result = readLocalReviewSnapshot(root, request);
  assert.equal(result.comparison.diff_base_sha, base);
  assert.deepEqual(result.changed_files, ['file.txt']);
  assert.deepEqual(result.anchors['file.txt']?.new_lines, [2]);
  assert.match(result.diff, /\+feature/);
  assert.equal(existsSync(join(root, 'other.txt')), false);
});

test('GitLab local snapshot validates its version base and source branch', (t) => {
  const { root, base, head, target, git } = repo(t);
  const request = {
    request_id: 8, kind: 'merge_request' as const, title: 'Feature', state: 'open',
    draft: false, source_branch: 'feature', target_branch: 'main', head_sha: head,
    body: '', url: 'https://gitlab.example/acme/repo/-/merge_requests/8',
    comparison: { base_sha: base, start_sha: target, head_sha: head },
    review_activity: { discussions: [], approvals: {}, reviewers: [] },
  };
  const result = readLocalReviewSnapshot(root, request, (...args) => {
    assert.notEqual(args[0], 'fetch', 'Complete local history must not trigger a fetch');
    return git(...args);
  });
  assert.deepEqual(result.changed_files, ['file.txt']);
  assert.throws(() => readLocalReviewSnapshot(root, {
    ...request, comparison: { ...request.comparison, base_sha: target },
  }), /base does not match/);
  git('switch', 'main');
  assert.throws(() => readLocalReviewSnapshot(root, request), /Local branch or HEAD/);
});

function clonedRepo(t: test.TestContext) {
  const remote = repo(t);
  const root = mkdtempSync(join(tmpdir(), 'local-review-clone-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['clone', '--no-local', '--single-branch', '--branch', 'feature',
    remote.root, root]);
  const git = (...args: string[]) => execFileSync('git', args,
    { cwd: root, encoding: 'utf8' }).trim();
  const request = {
    request_id: 8, kind: 'merge_request' as const, title: 'Feature', state: 'open',
    draft: false, source_branch: 'feature', target_branch: 'main', head_sha: remote.head,
    body: '', url: 'https://gitlab.example/acme/repo/-/merge_requests/8',
    comparison: { base_sha: remote.base, start_sha: remote.target, head_sha: remote.head },
    review_activity: { discussions: [], approvals: {}, reviewers: [] },
  };
  return { root, git, remote, request };
}

test('GitLab snapshot recovers a missing comparison commit without changing local work', (t) => {
  const { root, git, remote, request } = clonedRepo(t);
  assert.notEqual(spawnSync('git', ['cat-file', '-e', `${remote.target}^{commit}`],
    { cwd: root }).status, 0);
  writeFileSync(join(root, 'file.txt'), 'uncommitted work\n');
  writeFileSync(join(root, 'notes.txt'), 'local notes\n');
  const status = git('status', '--porcelain');

  const result = readLocalReviewSnapshot(root, request);

  assert.deepEqual(result.changed_files, ['file.txt']);
  assert.deepEqual(result.anchors['file.txt']?.new_lines, [2]);
  assert.match(result.diff, /\+feature/);
  assert.equal(result.comparison.diff_base_sha, remote.base);
  assert.equal(git('cat-file', '-t', remote.target), 'commit');
  assert.equal(git('branch', '--show-current'), 'feature');
  assert.equal(git('rev-parse', 'HEAD'), remote.head);
  assert.equal(git('status', '--porcelain'), status);
  assert.equal(readFileSync(join(root, 'file.txt'), 'utf8'), 'uncommitted work\n');
  assert.equal(readFileSync(join(root, 'notes.txt'), 'utf8'), 'local notes\n');
});

test('GitHub snapshot recovers an advanced target and still compares from the merge base', (t) => {
  const { root, remote, request } = clonedRepo(t);
  const result = readLocalReviewSnapshot(root, {
    ...request, kind: 'pull_request',
    comparison: { base_sha: remote.target, head_sha: remote.head },
    review_activity: { comments: [], reviews: [], issue_comments: [] },
  });
  assert.equal(result.comparison.diff_base_sha, remote.base);
  assert.deepEqual(result.changed_files, ['file.txt']);
  assert.match(result.diff, /\+feature/);
});

test('Recovery uses the selected request remote push URL rather than the default fetch URL', (t) => {
  const { root, git, remote, request } = clonedRepo(t);
  git('remote', 'set-url', 'origin', join(root, 'unavailable-origin'));
  git('remote', 'add', 'reviews', join(root, 'unavailable-fetch-url'));
  git('remote', 'set-url', '--push', 'reviews', remote.root);
  git('config', 'branch.feature.pushRemote', 'reviews');

  assert.deepEqual(readLocalReviewSnapshot(root, request).changed_files, ['file.txt']);
  assert.equal(git('cat-file', '-t', remote.target), 'commit');
});

test('An unavailable comparison commit reports its SHA and recovery failure', (t) => {
  const { root, git, remote, request } = clonedRepo(t);
  const missing = 'f'.repeat(40);
  assert.throws(() => readLocalReviewSnapshot(root, {
    ...request, comparison: { ...request.comparison, start_sha: missing },
  }), new RegExp(`Cannot recover review comparison commit ${missing}:`));
  assert.equal(git('rev-parse', 'HEAD'), remote.head);
  assert.equal(git('status', '--porcelain'), '');
});

test('An inaccessible request remote produces an explicit recovery failure', (t) => {
  const { root, git, remote, request } = clonedRepo(t);
  git('remote', 'set-url', '--push', 'origin', join(root, 'unavailable-remote'));
  assert.throws(() => readLocalReviewSnapshot(root, request),
    new RegExp(`Cannot recover review comparison commit ${remote.target}:`));
  assert.equal(git('branch', '--show-current'), 'feature');
  assert.equal(git('rev-parse', 'HEAD'), remote.head);
});

test('Recovered history must still match the exact GitLab comparison base', (t) => {
  const { root, git, remote, request } = clonedRepo(t);
  assert.throws(() => readLocalReviewSnapshot(root, {
    ...request, comparison: { ...request.comparison, base_sha: remote.target },
  }), /GitLab diff base does not match local history/);
  assert.equal(git('cat-file', '-t', remote.target), 'commit');
});

test('Invalid comparison SHAs and a mismatched local head are rejected before recovery', (t) => {
  const { root, request } = clonedRepo(t);
  assert.throws(() => readLocalReviewSnapshot(root, {
    ...request, comparison: { ...request.comparison, base_sha: 'invalid' },
  }), /Invalid review comparison SHAs/);
  assert.throws(() => readLocalReviewSnapshot(root, {
    ...request, comparison: { ...request.comparison, start_sha: 'invalid' },
  }), /GitLab diff start SHA is unavailable/);
  const head = 'e'.repeat(40);
  assert.throws(() => readLocalReviewSnapshot(root, {
    ...request, head_sha: head, comparison: { ...request.comparison, head_sha: head },
  }), /Local branch or HEAD differs/);
});

test('a pinned published head can be reviewed without switching to that commit', (t) => {
  const { root, git, remote, request } = clonedRepo(t);
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.com',
    'commit', '--allow-empty', '-m', 'local-only commit');
  const localHead = git('rev-parse', 'HEAD');

  const result = readLocalReviewSnapshot(root, request, git, remote.head);

  assert.equal(result.head_sha, remote.head);
  assert.deepEqual(result.changed_files, ['file.txt']);
  assert.equal(git('rev-parse', 'HEAD'), localHead);
  assert.throws(() => readLocalReviewSnapshot(root, request, git, localHead),
    /request head changed/i);
});
