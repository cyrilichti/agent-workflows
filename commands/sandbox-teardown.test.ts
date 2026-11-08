import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import type { SandboxContext } from './sandbox-context.ts';
import { recordOwnership } from './sandbox-lifecycle.ts';
import { teardown } from './sandbox-teardown.ts';
import type { Run } from './sandbox-runtime.ts';

function fixture() {
  const source = realpathSync(mkdtempSync(join(tmpdir(), 'sandbox-source-')));
  execFileSync('git', ['init', '-q', source]);
  execFileSync('git', ['-C', source, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-qm', 'init']);
  const context: SandboxContext = { version: 1, id: `aw-${randomUUID()}`, item_id: 'item',
    root: realpathSync(mkdtempSync(join(tmpdir(), 'aw-sandbox-'))), repositories: [], docker: null, ports: [] };
  recordOwnership(context);
  return { source, context, cleanup: () => { rmSync(context.root, { recursive: true, force: true }); rmSync(source, { recursive: true, force: true }); } };
}

test('teardown handles empty partial preparation and repeated no-Docker worktree cleanup', () => {
  const f = fixture();
  try {
    assert.equal(teardown({ sandbox_context: f.context }).status, 'completed');
    assert.equal(teardown({ sandbox_context: f.context }).status, 'completed');
    const other = fixture();
    try {
      const path = join(other.context.root, '0-app');
      other.context.repositories.push({ source: other.source, worktree: path });
      recordOwnership(other.context);
      execFileSync('git', ['-C', other.source, 'worktree', 'add', '--detach', path, 'HEAD'], { stdio: 'pipe' });
      writeFileSync(join(path, 'ignored.env'), 'secret');
      assert.equal(teardown({ sandbox_context: other.context }).status, 'completed');
      assert.equal(teardown({ sandbox_context: other.context }).status, 'completed');
      assert.ok(existsSync(join(other.source, '.git')));
      assert.equal(existsSync(path), false);
      assert.equal(execFileSync('git', ['-C', other.source, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' }).split('worktree ').length, 2);
    } finally { other.cleanup(); }
  } finally { f.cleanup(); }
});

test('Docker failure keeps the context retryable and removes only the recorded sandbox', () => {
  const f = fixture();
  try {
    f.context.docker = { name: f.context.id };
    recordOwnership(f.context);
    const inventory = new Set([f.context.id, 'unrelated']);
    let fail = true;
    const runner: Run = (_program, args) => {
      if (args[0] === 'rm') {
        if (fail) throw new Error('removal failed');
        inventory.delete(args.at(-1)!);
      }
      return { stdout: args[0] === 'ls' ? JSON.stringify([...inventory].map(name => ({ name, workspaces: [f.context.root] }))) : '', stderr: '' };
    };
    const failed = teardown({ sandbox_context: f.context }, runner);
    assert.equal(failed.status, 'failed');
    assert.deepEqual(failed.sandbox_context, f.context);
    assert.ok(existsSync(f.context.root));
    fail = false;
    assert.equal(teardown({ sandbox_context: f.context }, runner).status, 'completed');
    assert.equal(teardown({ sandbox_context: f.context }, runner).status, 'completed');
    assert.deepEqual([...inventory], ['unrelated']);
  } finally { f.cleanup(); }
});

test('teardown rejects malformed or tampered ownership before mutation', () => {
  const f = fixture();
  try {
    for (const value of [{}, { sandbox_context: {} }, { sandbox_context: { ...f.context, root: f.source } },
      { sandbox_context: { ...f.context, repositories: [{ source: f.source, worktree: f.source }] } },
      { sandbox_context: { ...f.context, docker: { name: f.context.id } } }]) {
      const result = teardown(value);
      assert.equal(result.status, 'failed');
      assert.ok(existsSync(f.source));
      assert.ok(existsSync(f.context.root));
    }
    const cli = spawnSync(process.execPath, [resolve('commands/sandbox-teardown.ts')], { input: 'not json', encoding: 'utf8' });
    assert.equal(cli.status, 1);
    assert.equal(JSON.parse(cli.stdout).stage, 'input');
  } finally { f.cleanup(); }
});

test('teardown removes recorded partial worktree files even without Git registration', () => {
  const f = fixture();
  try {
    const path = join(f.context.root, '0-app');
    f.context.repositories.push({ source: f.source, worktree: path });
    recordOwnership(f.context);
    mkdirSync(path);
    writeFileSync(join(path, 'partial.env'), 'fixture');
    assert.equal(teardown({ sandbox_context: f.context }).status, 'completed');
    assert.equal(teardown({ sandbox_context: f.context }).status, 'completed');
    assert.ok(existsSync(join(f.source, '.git')));
  } finally { f.cleanup(); }
});
