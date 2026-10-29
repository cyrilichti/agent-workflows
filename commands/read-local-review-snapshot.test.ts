import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
  assert.deepEqual(readLocalReviewSnapshot(root, request).changed_files, ['file.txt']);
  assert.throws(() => readLocalReviewSnapshot(root, {
    ...request, comparison: { ...request.comparison, base_sha: target },
  }), /base does not match/);
  git('switch', 'main');
  assert.throws(() => readLocalReviewSnapshot(root, request), /Local branch or HEAD/);
});
