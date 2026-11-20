import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { findCleanupClone } from './cleanup-clone.ts';
import type { CleanupDelivery } from './cleanup-delivery.ts';
import { discoverLocalRepositories } from './resolve-local-project-directory.ts';

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
  ]) {
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
