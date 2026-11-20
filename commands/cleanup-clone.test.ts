import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { cleanupBranches, discoverLocalRepositories, findCleanupClone } from './cleanup-clone.ts';
import type { CleanupDelivery } from './cleanup-remote.ts';

const delivery: CleanupDelivery = { provider: 'gitlab', host: 'gitlab.example.com',
  repository: 'equipe/facturation', request: '', branch: 'ticket', target: 'main',
  defaultBranch: 'main', sha: 'f'.repeat(40) };

test('finds a neighboring clone by its remote and groups linked worktrees', t => {
  const root = mkdtempSync(join(tmpdir(), 'cleanup-clone-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  for (const [name, url] of [
    ['starter', 'https://gitlab.example.com/autre/facturation'],
    ['billing', 'git@gitlab.example.com:equipe/facturation.git'],
  ] as const) {
    git('init', '-q', '-b', 'main', name);
    git('-C', name, 'remote', 'add', 'origin', url);
  }
  git('-C', 'billing', '-c', 'user.name=Test', '-c', 'user.email=test@example.com',
    'commit', '--allow-empty', '-qm', 'initial');
  git('-C', 'billing', 'worktree', 'add', '--detach', join(root, 'linked'));
  const paths = () => discoverLocalRepositories([join(root, 'starter')]);
  assert.equal(findCleanupClone(delivery, paths()).path, paths().find(path => path.endsWith('/billing')));
  git('-C', 'starter', 'remote', 'set-url', 'origin', 'https://gitlab.example.com/equipe/facturation');
  assert.throws(() => findCleanupClone(delivery, paths()), /Multiple local clones/);
  git('-C', 'starter', 'remote', 'set-url', '--push', 'origin', 'https://gitlab.example.com/ailleurs/facturation');
  assert.throws(() => findCleanupClone(delivery, paths()), /single matching fetch and push/);
});

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
  return { root, git, local, clone, delivery, run: () => cleanupBranches(clone, delivery) };
}

test('switches the clean clone to the default branch, pulls and removes the local ref first', t => {
  const f = fixture(t);
  const latest = f.local('rev-parse', 'main');
  f.local('branch', '-f', 'main', 'main~1');
  f.git('clone', f.clone.pushUrl, join(f.root, 'workstation'));
  f.git('-C', 'workstation', 'switch', '--track', 'origin/ticket');
  writeFileSync(join(f.clone.path, '.git/hooks/pre-push'),
    '#!/bin/sh\n! git show-ref --verify --quiet refs/heads/ticket\n', { mode: 0o755 });
  assert.deepEqual(f.run(), { local: 'removed', remote: 'removed' });
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
  writeFileSync(join(f.clone.path, '.git/hooks/pre-push'),
    `#!/bin/sh\ngit --git-dir="$2" update-ref refs/heads/ticket ${f.local('rev-parse', 'main')}\n`,
    { mode: 0o755 });
  const run = f.run();
  assert.equal(run.local, 'removed');
  assert.equal(run.remote, 'blocked');
  assert.match(f.local('ls-remote', 'origin', 'refs/heads/ticket'), new RegExp(f.local('rev-parse', 'main')));
});

test('removes the remote branch when the local branch is already absent', t => {
  const f = fixture(t);
  f.local('switch', 'main');
  f.local('branch', '-D', 'ticket');
  assert.deepEqual(f.run(), { local: 'absent', remote: 'removed' });
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
