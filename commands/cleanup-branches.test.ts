import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { cleanupBranches } from './cleanup-clone.ts';
import type { CleanupDelivery } from './cleanup-remote.ts';

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'cleanup-branches-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const remote = join(root, 'remote');
  const path = join(root, 'clone');
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '--bare', '-b', 'main', remote);
  git('clone', remote, path);
  const local = (...args: string[]) => git('-C', path, ...args);
  local('config', 'user.name', 'Cleanup Test');
  local('config', 'user.email', 'test@example.com');
  local('commit', '--allow-empty', '-m', 'Initial');
  local('push', '-u', 'origin', 'main');
  local('switch', '-c', 'ticket');
  writeFileSync(join(path, 'change'), 'content');
  local('add', 'change');
  local('commit', '-m', 'Delivery');
  local('push', '-u', 'origin', 'ticket');
  const sha = local('rev-parse', 'HEAD');
  local('switch', 'main');
  local('merge', '--squash', 'ticket');
  local('commit', '-m', 'Squashed');
  local('push', 'origin', 'main');
  local('switch', 'ticket');
  const clone = { path, remote: 'origin', pushUrl: remote };
  const delivery: CleanupDelivery = { provider: 'github', host: 'github.com', repository: 'example/repo',
    defaultBranch: 'main', target: 'main', branch: 'ticket', sha, request: '' };
  return { root, git, local, clone, delivery, run: () => cleanupBranches(clone, delivery, () => {}) };
}

test('switches the clean clone to the default branch, pulls and removes the local ref first', t => {
  const f = fixture(t);
  const latest = f.local('rev-parse', 'main');
  f.local('branch', '-f', 'main', 'main~1');
  f.git('clone', f.clone.pushUrl, join(f.root, 'workstation'));
  f.git('-C', 'workstation', 'switch', '--track', 'origin/ticket');
  const run = cleanupBranches(f.clone, f.delivery, (_delivery, exists) => {
    assert.ok(exists);
    if (f.local('branch', '--show-current') === 'main') {
      assert.equal(f.local('branch', '--list', 'ticket'), '');
    }
  });
  assert.deepEqual(run, { local: 'removed', remote: 'removed' });
  assert.equal(f.local('branch', '--show-current'), 'main');
  assert.equal(f.local('rev-parse', 'HEAD'), latest);
  assert.equal(f.git('-C', 'workstation', 'rev-parse', 'HEAD'), f.delivery.sha);
  assert.deepEqual(f.run(), { local: 'absent', remote: 'absent' });
});

test('preserves both refs when the clone is dirty or the branch is used by another worktree', t => {
  const f = fixture(t);
  writeFileSync(join(f.clone.path, 'temp'), 'untracked');
  assert.match(f.run().reason!, /uncommitted/);
  rmSync(join(f.clone.path, 'temp'));
  f.local('switch', 'main');
  f.local('worktree', 'add', join(f.root, 'linked'), 'ticket');
  assert.match(f.run().reason!, /another worktree/);
  assert.equal(f.local('rev-parse', 'ticket'), f.delivery.sha);
  assert.match(f.local('ls-remote', 'origin', 'refs/heads/ticket'), new RegExp(f.delivery.sha));
});

test('a last-minute new remote commit is rejected by the lease', t => {
  const f = fixture(t);
  let calls = 0;
  const run = cleanupBranches(f.clone, f.delivery, () => {
    if (++calls === 2) f.git('--git-dir', f.clone.pushUrl, 'update-ref', 'refs/heads/ticket', f.local('rev-parse', 'main'));
  });
  assert.equal(run.local, 'removed');
  assert.equal(run.remote, 'blocked');
  assert.match(f.local('ls-remote', 'origin', 'refs/heads/ticket'), new RegExp(f.local('rev-parse', 'main')));
});

test('preserves the delivery branch during a paused rebase with detached HEAD', t => {
  const f = fixture(t);
  f.local('switch', 'main');
  writeFileSync(join(f.clone.path, 'change'), 'conflicting content');
  f.local('commit', '-am', 'Conflicting change');
  f.local('switch', 'ticket');
  assert.throws(() => f.local('rebase', '--onto', 'main', 'ticket~1'));
  assert.equal(f.local('branch', '--show-current'), '');
  assert.match(f.run().reason!, /in-progress rebase or bisect/);
  assert.equal(f.local('rev-parse', 'ticket'), f.delivery.sha);
  assert.match(f.local('ls-remote', 'origin', 'refs/heads/ticket'), new RegExp(f.delivery.sha));
});

test('restores the delivery checkout when the default branch cannot fast-forward', t => {
  const f = fixture(t);
  f.local('branch', '-f', 'main', 'ticket');
  assert.match(f.run().reason!, /fast-forward/);
  assert.equal(f.local('branch', '--show-current'), 'ticket');
  assert.equal(f.local('rev-parse', 'ticket'), f.delivery.sha);
  assert.match(f.local('ls-remote', 'origin', 'refs/heads/ticket'), new RegExp(f.delivery.sha));
  f.local('branch', '-f', 'main', 'main~1');
  assert.deepEqual(f.run(), { local: 'removed', remote: 'removed' });
});
