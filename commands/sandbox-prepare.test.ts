import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, realpathSync, readdirSync, chmodSync, statSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { parsePreparationInput, resolveDependencies, prepare } from './sandbox-prepare.ts';
import { removeResources } from './sandbox-lifecycle.ts';
import type { Run } from './sandbox-runtime.ts';

export function repository(path: string) {
  mkdirSync(path, { recursive: true });
  execFileSync('git', ['init', '-q', path]);
  execFileSync('git', ['-C', path, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-qm', 'init']);
  return realpathSync(path);
}

test('preparation validates its single JSON input and emits a staged JSON failure', () => {
  for (const input of [{}, { item_id: 'x', project_directory: 'relative', browser_validation: false },
    { item_id: 'x', project_directory: '/tmp', browser_validation: 'false' }]) {
    assert.throws(() => parsePreparationInput(input));
  }
  const result = spawnSync(process.execPath, [resolve('commands/sandbox-prepare.ts')], { input: '{}', encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).stage, 'input');
});

test('preflight rejects missing tools, auth, startup support, variables and secrets without resources', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-preflight-'));
  try {
    const app = repository(join(root, 'app'));
    writeFileSync(join(app, 'compose.yaml'), 'services: {}');
    for (const failure of ['sbx', 'compose', 'auth', 'virtualization', 'variables', 'secret', 'docker']) {
      const runner: Run = (program, args) => {
        if ((failure === 'sbx' && program === 'sbx') ||
          (failure === 'compose' && args[0] === 'compose') ||
          (failure === 'docker' && args[0] === 'info')) throw new Error('tool unavailable');
        if (args[0] === 'diagnose') return { stdout: JSON.stringify({ checks: [
          { name: 'Authentication', status: failure === 'auth' ? 'fail' : 'pass' },
          { name: 'Virtualization', status: failure === 'virtualization' ? 'fail' : 'pass' },
          { name: 'Daemon', status: 'pass' }], summary: { fail: 0 } }), stderr: '' };
        if (args.includes('config')) return { stdout: JSON.stringify({ services: { web: { image: 'nginx' } }, secrets:
          failure === 'secret' ? { key: { file: join(root, 'missing') } } : {} }),
          stderr: failure === 'variables' ? 'The "PASSWORD" variable is not set.' : '' };
        return { stdout: '', stderr: '' };
      };
      const result = prepare({ item_id: 'x', project_directory: app, browser_validation: true }, runner);
      assert.equal(result.status, 'failed', failure);
      assert.equal(result.sandbox_context, undefined, failure);
      assert.deepEqual(readdirSync(root), ['app']);
      assert.equal(gitWorktrees(app).length, 1);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('browser preparation requires Compose and stops before allocation when it is absent', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-no-compose-'));
  try {
    const app = repository(join(root, 'app'));
    const result = prepare({ item_id: 'item', project_directory: app, browser_validation: true }, sandboxRunner().runner);
    assert.equal(result.status, 'failed');
    assert.equal(result.sandbox_context, undefined);
    assert.equal(gitWorktrees(app).length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

function gitWorktrees(path: string): string[] {
  return execFileSync('git', ['-C', path, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' }).split('\n').filter(line => line.startsWith('worktree '));
}

function sandboxRunner(options: { fail?: string; model?: any } = {}) {
  const sandboxes = new Set<string>();
  let workspace = '';
  const runner: Run = (program, args) => {
    if (args[0] === options.fail) throw new Error('simulated startup failure');
    let value: any = '';
    if (args[0] === 'diagnose') value = { checks: ['Authentication', 'Daemon', 'Virtualization'].map(name => ({ name, status: 'pass' })) };
    if (args.includes('config')) value = options.model ?? { services: { web: { image: 'nginx', ports: [{ target: 80, published: '80' }] } } };
    if (args[0] === 'create') { sandboxes.add(args[args.indexOf('--name') + 1]!); workspace = args.at(-1)!; }
    if (args[0] === 'ls') value = [...sandboxes].map(name => ({ name, workspaces: [workspace] }));
    if (args[0] === 'rm') sandboxes.delete(args.at(-1)!);
    if (args[0] === 'ports') value = [{ host_ip: '127.0.0.1', host_port: 49123, sandbox_port: 20000, protocol: 'tcp4' }];
    if (args[0] === 'exec') {
      const file = args[args.indexOf('-f') + 1]!;
      const model = JSON.parse(readFileSync(file, 'utf8'));
      assert.equal(model.services.web.ports[0].published, '20000');
      assert.ok(model.services.web.volumes?.every((volume: any) => !volume.source.includes('/app/')) ?? true);
      for (const secret of Object.values<any>(model.secrets ?? {})) {
        assert.equal(secret.environment, undefined);
        assert.equal(readFileSync(secret.file, 'utf8'), 'private-secret');
        assert.equal(statSync(secret.file).mode & 0o777, 0o600);
      }
    }
    return { stdout: typeof value === 'string' ? value : JSON.stringify(value), stderr: '' };
  };
  return { runner, sandboxes };
}

test('separate preparations preserve ignored nested files, modes and untracked state without Docker', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-worktree-'));
  const contexts: any[] = [];
  try {
    const app = repository(join(root, 'app'));
    writeFileSync(join(app, '.gitignore'), '.env\nnested/\n');
    execFileSync('git', ['-C', app, 'add', '.gitignore']);
    execFileSync('git', ['-C', app, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'ignore']);
    mkdirSync(join(app, 'nested'));
    writeFileSync(join(app, 'nested', '.env'), 'SECRET=private', { mode: 0o600 });
    chmodSync(join(app, 'nested'), 0o500);
    const fake = sandboxRunner();
    for (let index = 0; index < 2; index++) {
      const result = prepare({ item_id: 'item', project_directory: app, browser_validation: false }, fake.runner);
      assert.equal(result.status, 'prepared', JSON.stringify(result));
      if (!result.sandbox_context) throw new Error('Missing context');
      contexts.push(result.sandbox_context);
      const worktree = result.sandbox_context.repositories[0]!.worktree;
      assert.equal(readFileSync(join(worktree, 'nested', '.env'), 'utf8'), 'SECRET=private');
      assert.equal(statSync(join(worktree, 'nested', '.env')).mode & 0o777, 0o600);
      assert.equal(statSync(join(worktree, 'nested')).mode & 0o777, 0o500);
      assert.equal(execFileSync('git', ['-C', worktree, 'status', '--porcelain'], { encoding: 'utf8' }), '');
      assert.equal(result.sandbox_context.docker, null);
    }
    assert.notEqual(contexts[0].root, contexts[1].root);
    assert.equal(fake.sandboxes.size, 0);
  } finally {
    for (const context of contexts) removeResources(context);
    chmodSync(join(root, 'app', 'nested'), 0o700);
    rmSync(root, { recursive: true, force: true });
  }
});

test('browser preparation remaps Compose paths and returns allocated ports; later failure rolls back', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-docker-'));
  try {
    const app = repository(join(root, 'app'));
    writeFileSync(join(app, 'compose.yaml'), 'services: {}');
    const fake = sandboxRunner({ model: { services: { web: { image: 'nginx',
      volumes: [{ type: 'bind', source: app, target: '/app' }], ports: [{ target: 80, published: '80' }] } } } });
    const result = prepare({ item_id: 'item', project_directory: app, browser_validation: true }, fake.runner);
    assert.equal(result.status, 'prepared', JSON.stringify(result));
    assert.ok(result.sandbox_context?.docker);
    assert.equal(result.sandbox_context?.ports[0]?.host, 49123);
    removeResources(result.sandbox_context!, fake.runner);
    assert.equal(fake.sandboxes.size, 0);
    const failing = sandboxRunner({ fail: 'exec' });
    const failed = prepare({ item_id: 'item', project_directory: app, browser_validation: true }, failing.runner);
    assert.equal(failed.status, 'failed');
    assert.equal(failing.sandboxes.size, 0);
    assert.equal(gitWorktrees(app).length, 1);
    assert.ok(failed.sandbox_context && !existsSync(failed.sandbox_context.root));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('browser preparation materializes environment-backed secrets without exposing their values in the context', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-env-secret-'));
  const previous = process.env.SANDBOX_TEST_SECRET;
  process.env.SANDBOX_TEST_SECRET = 'private-secret';
  try {
    const app = repository(join(root, 'app'));
    writeFileSync(join(app, 'compose.yaml'), 'services: {}');
    const fake = sandboxRunner({ model: { services: { web: { image: 'nginx', ports: [{ target: 80 }] } },
      secrets: { password: { environment: 'SANDBOX_TEST_SECRET' } } } });
    const result = prepare({ item_id: 'item', project_directory: app, browser_validation: true }, fake.runner);
    try {
      assert.equal(result.status, 'prepared', JSON.stringify(result));
      assert.ok(!JSON.stringify(result).includes('private-secret'));
    } finally { if (result.sandbox_context) removeResources(result.sandbox_context, fake.runner); }
  } finally {
    if (previous === undefined) delete process.env.SANDBOX_TEST_SECRET;
    else process.env.SANDBOX_TEST_SECRET = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test('README and Compose dependencies resolve transitively through the project resolver', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-resolve-'));
  try {
    const app = repository(join(root, 'app'));
    const api = repository(join(root, 'api'));
    const shared = repository(join(root, 'shared'));
    writeFileSync(join(app, 'README.md'), 'Dependency: https://github.com/example/api.git\n');
    writeFileSync(join(api, 'README.md'), '[Shared](../shared)\n');
    assert.deepEqual(resolveDependencies(app, { services: { api: { build: { context: api } } } }), [app, api, shared]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('ambiguous or missing dependencies fail without creating resources', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-tie-'));
  try {
    const app = repository(join(root, 'app'));
    repository(join(root, 'family-api'));
    repository(join(root, 'family-web'));
    for (const name of ['family', 'missing']) {
      writeFileSync(join(app, 'README.md'), `Dependency: ${name}\n`);
      assert.throws(() => resolveDependencies(app), /ambiguous|not found/);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
