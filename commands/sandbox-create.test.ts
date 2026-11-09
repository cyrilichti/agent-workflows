import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, realpathSync, readdirSync, chmodSync, statSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import test, { after } from 'node:test';
import { parseCreationInput, validateRepositories, createSandbox as create } from './sandbox-create.ts';
import { removeResources } from './sandbox-teardown.ts';
import type { Run } from './sandbox-teardown.ts';

const sandboxDirectory = realpathSync(mkdtempSync(join(tmpdir(), 'sandbox-test-roots-')));
const createSandbox: typeof create = (value, execute) => create(value, execute, sandboxDirectory);
after(() => rmSync(sandboxDirectory, { recursive: true, force: true }));

export function repository(path: string) {
  mkdirSync(path, { recursive: true });
  execFileSync('git', ['init', '-q', path]);
  execFileSync('git', ['-C', path, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-qm', 'init']);
  return realpathSync(path);
}

function commitCompose(path: string, content = 'services: {}\n') {
  writeFileSync(join(path, 'compose.yaml'), content);
  execFileSync('git', ['-C', path, 'add', 'compose.yaml']);
  execFileSync('git', ['-C', path, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'compose']);
}

test('preparation validates its single JSON input and emits a staged JSON failure', () => {
  for (const input of [{}, { item_id: 'x', project_directory: 'relative', dependency_directories: [], is_docker_enabled: false },
    { item_id: 'x', project_directory: '/tmp', dependency_directories: [], is_docker_enabled: 'false' },
    { item_id: 'x', project_directory: '/tmp', dependency_directories: ['relative'], is_docker_enabled: false }]) {
    assert.throws(() => parseCreationInput(input));
  }
  const result = spawnSync(process.execPath, [resolve('commands/sandbox-create.ts')], { input: '{}', encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).stage, 'input');
});

test('preparation CLI returns readable, parseable sandbox context', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-cli-output-'));
  let context: ReturnType<typeof createSandbox>['sandbox_context'];
  try {
    const app = repository(join(root, 'app'));
    const result = spawnSync(process.execPath, [resolve('commands/sandbox-create.ts')], {
      input: JSON.stringify({ item_id: 'item', project_directory: app, dependency_directories: [], is_docker_enabled: false }),
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /\n  "sandbox_context": \{\n    "version": 1,/);
    const output = JSON.parse(result.stdout);
    assert.equal(output.status, 'prepared');
    assert.equal(output.sandbox_context.repositories[0].source, app);
    context = output.sandbox_context;
  } finally {
    if (context) removeResources(context);
    rmSync(root, { recursive: true, force: true });
  }
});

test('preflight rejects unresolved Compose variables and secrets without resources', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-preflight-'));
  try {
    const app = repository(join(root, 'app'));
    writeFileSync(join(app, 'compose.yaml'), 'services: {}');
    for (const failure of ['variables', 'secret']) {
      const runner: Run = (_program, args) => {
        if (args.includes('config')) return { stdout: JSON.stringify({ services: { web: { image: 'nginx' } }, secrets:
          failure === 'secret' ? { key: { file: join(root, 'missing') } } : {} }),
          stderr: failure === 'variables' ? 'The "PASSWORD" variable is not set.' : '' };
        return { stdout: '', stderr: '' };
      };
      const result = createSandbox({ item_id: 'x', project_directory: app, dependency_directories: [], is_docker_enabled: true }, runner);
      assert.equal(result.status, 'failed', failure);
      assert.equal(result.sandbox_context, undefined, failure);
      assert.deepEqual(readdirSync(root), ['app']);
      assert.equal(gitWorktrees(app).length, 1);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('missing Compose falls back to a project worktree', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-no-compose-'));
  try {
    const app = repository(join(root, 'app'));
    const dependency = repository(join(root, 'dependency'));
    const input = { item_id: 'item', project_directory: app, dependency_directories: [dependency], is_docker_enabled: true };
    const noCompose = createSandbox(input, () => { throw new Error('Unexpected container command.'); });
    assert.equal(noCompose.status, 'prepared');
    assert.deepEqual(noCompose.sandbox_context?.repositories.map(entry => entry.source), [app]);
    removeResources(noCompose.sandbox_context!);
    assert.equal(gitWorktrees(app).length, 1);
    assert.equal(gitWorktrees(dependency).length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

function gitWorktrees(path: string): string[] {
  return execFileSync('git', ['-C', path, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' }).split('\n').filter(line => line.startsWith('worktree '));
}

function sandboxRunner(options: { fail?: string; model?: any; models?: Record<string, any> } = {}) {
  const sandboxes = new Set<string>();
  const executions: { worktree: string; project: string; compose: string }[] = [];
  const launches: string[][] = [];
  const bindings: { host_ip: string; host_port: number; sandbox_port: number; protocol: string }[] = [];
  let workspace = '';
  const runner: Run = (_program, args, cwd) => {
    if (args[0] === options.fail) throw new Error('simulated startup failure');
    let value: any = '';
    if (args.includes('config')) value = options.models?.[cwd!] ?? options.model ?? { services: { web: { image: 'nginx', ports: [{ target: 80, published: '80' }] } } };
    if (args[0] === 'run') {
      launches.push(args);
      sandboxes.add(args[args.indexOf('--name') + 1]!);
      workspace = args.at(-1)!;
    }
    if (args[0] === 'ls') value = [...sandboxes].map(name => ({ name, workspaces: [workspace] }));
    if (args[0] === 'rm') sandboxes.delete(args.at(-1)!);
    if (args[0] === 'ports') {
      if (args.includes('--publish')) {
        bindings.push({ host_ip: '127.0.0.1', host_port: 49123 + bindings.length,
          sandbox_port: Number(args[args.indexOf('--publish') + 1]!.split('/')[0]), protocol: 'tcp4' });
      }
      value = bindings;
    }
    if (args[0] === 'exec') {
      const worktree = args[args.indexOf('--workdir') + 1]!;
      const file = args.includes('-f') ? args[args.indexOf('-f') + 1]! : 'compose.yaml';
      const compose = readFileSync(join(worktree, file), 'utf8');
      const source = Object.keys(options.models ?? {}).find(path => basename(worktree) === basename(path));
      const model = (source && options.models?.[source]) ?? options.model ?? { services: { web: { image: 'nginx', ports: [{ target: 80, published: '80' }] } } };
      if (args.includes('up')) executions.push({ worktree, project: args[args.indexOf('-p') + 1]!, compose });
      if (args.includes('ps')) {
        value = Object.entries<any>(model.services).map(([name, service]) => JSON.stringify({ Service: name,
          Publishers: (service.ports ?? []).map((port: any) => ({ URL: port.host_ip ?? '0.0.0.0',
            TargetPort: port.target, PublishedPort: Number(port.published ?? 40000), Protocol: port.protocol ?? 'tcp' })) })).join('\n');
      }
    }
    return { stdout: typeof value === 'string' ? value : JSON.stringify(value), stderr: '' };
  };
  return { runner, sandboxes, executions, bindings, launches };
}

test('separate preparations copy current tracked, untracked, and ignored files without Docker', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-worktree-'));
  const contexts: any[] = [];
  try {
    const app = repository(join(root, 'app'));
    writeFileSync(join(app, '.gitignore'), '.env\nnested/\n');
    writeFileSync(join(app, 'compose.yaml'), 'services: {}');
    execFileSync('git', ['-C', app, 'add', '.gitignore', 'compose.yaml']);
    execFileSync('git', ['-C', app, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'ignore']);
    writeFileSync(join(app, 'compose.yaml'), 'services:\n  changed: {}\n');
    writeFileSync(join(app, 'notes.txt'), 'local test');
    mkdirSync(join(app, 'nested'));
    writeFileSync(join(app, 'nested', '.env'), 'SECRET=private', { mode: 0o600 });
    chmodSync(join(app, 'nested'), 0o500);
    const noContainerRunner: Run = () => { throw new Error('Unexpected container command.'); };
    for (let index = 0; index < 5; index++) {
      const result = createSandbox({ item_id: 'item', project_directory: app, dependency_directories: [], is_docker_enabled: false }, noContainerRunner);
      assert.equal(result.status, 'prepared', JSON.stringify(result));
      if (!result.sandbox_context) throw new Error('Missing context');
      contexts.push(result.sandbox_context);
      const worktree = result.sandbox_context.repositories[0]!.worktree;
      assert.equal(readFileSync(join(worktree, 'compose.yaml'), 'utf8'), 'services:\n  changed: {}\n');
      assert.equal(readFileSync(join(worktree, 'notes.txt'), 'utf8'), 'local test');
      assert.equal(readFileSync(join(worktree, 'nested', '.env'), 'utf8'), 'SECRET=private');
      assert.equal(statSync(join(worktree, 'nested', '.env')).mode & 0o777, 0o600);
      assert.equal(statSync(join(worktree, 'nested')).mode & 0o777, 0o500);
      const status = execFileSync('git', ['-C', worktree, 'status', '--porcelain'], { encoding: 'utf8' });
      assert.match(status, / M compose\.yaml/);
      assert.match(status, /\?\? notes\.txt/);
      assert.equal(result.sandbox_context.docker, null);
    }
    assert.equal(new Set(contexts.map(context => context.root)).size, 5);
  } finally {
    for (const context of contexts) removeResources(context);
    chmodSync(join(root, 'app', 'nested'), 0o700);
    rmSync(root, { recursive: true, force: true });
  }
});

test('container preparation runs the unchanged worktree Compose and publishes its ports; later failure rolls back', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-docker-'));
  try {
    const app = repository(join(root, 'app'));
    commitCompose(app, 'services:\n  web:\n    image: nginx\n    ports: ["3001:80"]\n');
    const compose = 'services:\n  web:\n    image: nginx\n    ports: ["3003:80"]\n';
    writeFileSync(join(app, 'compose.yaml'), compose);
    const fake = sandboxRunner({ model: { services: { web: { image: 'nginx', ports: [{ target: 80, published: '3003' }] } } } });
    const result = createSandbox({ item_id: 'item', project_directory: app, dependency_directories: [], is_docker_enabled: true }, fake.runner);
    assert.equal(result.status, 'prepared', JSON.stringify(result));
    assert.ok(result.sandbox_context?.docker);
    assert.equal(fake.launches.length, 1);
    assert.ok(fake.launches[0]?.includes('--detach'));
    assert.equal(dirname(result.sandbox_context!.root), sandboxDirectory);
    assert.equal(fake.executions[0]?.compose, compose);
    assert.equal(result.sandbox_context?.ports[0]?.sandbox, 3003);
    assert.equal(result.sandbox_context?.ports[0]?.host, 49123);
    assert.deepEqual(readdirSync(result.sandbox_context!.root).filter(name => name.startsWith('compose-')), []);
    removeResources(result.sandbox_context!, fake.runner);
    assert.equal(fake.sandboxes.size, 0);
    const failing = sandboxRunner({ fail: 'exec' });
    const failed = createSandbox({ item_id: 'item', project_directory: app, dependency_directories: [], is_docker_enabled: true }, failing.runner);
    assert.equal(failed.status, 'failed');
    assert.equal(failing.sandboxes.size, 0);
    assert.equal(gitWorktrees(app).length, 1);
    assert.ok(failed.sandbox_context && !existsSync(failed.sandbox_context.root));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('starts dependency Compose services before the main project in one sandbox', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-multi-compose-'));
  try {
    const app = repository(join(root, 'acme-project'));
    const api = repository(join(root, 'acme-api-project'));
    for (const path of [app, api]) commitCompose(path);
    const networks = { shared: { name: 'acme-shared', external: true } };
    const fake = sandboxRunner({ models: {
      [app]: { services: { web: { build: { context: app }, ports: [{ target: 3001, published: '3003' }] } }, networks },
      [api]: { services: { api: { build: { context: '.' }, ports: [{ target: 8080, published: '8080' }] } }, networks },
    } });
    const result = createSandbox({ item_id: 'item', project_directory: app,
      dependency_directories: [api], is_docker_enabled: true }, fake.runner);
    assert.equal(result.status, 'prepared', JSON.stringify(result));
    assert.deepEqual(fake.executions.map(entry => entry.worktree), [
      result.sandbox_context?.repositories[1]?.worktree, result.sandbox_context?.repositories[0]?.worktree,
    ]);
    assert.equal(new Set(fake.executions.map(entry => entry.project)).size, 2);
    assert.deepEqual(result.sandbox_context?.ports.map(port => port.service), [
      'acme-api-project/api', 'acme-project/web',
    ]);
    assert.deepEqual(result.sandbox_context?.ports.map(port => port.sandbox), [8080, 3003]);
    assert.deepEqual(result.sandbox_context?.ports.map(port => port.host), [49123, 49124]);
    removeResources(result.sandbox_context!, fake.runner);
    assert.equal(fake.sandboxes.size, 0);
    const failing = sandboxRunner({ models: {
      [app]: { services: { web: { image: 'nginx' } } },
      [api]: { services: { api: { image: 'nginx' } } },
    } });
    let executions = 0;
    const runner: Run = (program, args, cwd) => {
      if (args[0] === 'exec' && ++executions === 2) throw new Error('main Compose failed');
      return failing.runner(program, args, cwd);
    };
    const failed = createSandbox({ item_id: 'item', project_directory: app,
      dependency_directories: [api], is_docker_enabled: true }, runner);
    assert.equal(failed.status, 'failed');
    assert.equal(failing.sandboxes.size, 0);
    assert.equal(gitWorktrees(app).length, 1);
    assert.equal(gitWorktrees(api).length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('environment-backed Compose secrets stop before sandbox allocation', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-env-secret-'));
  const previous = process.env.SANDBOX_TEST_SECRET;
  process.env.SANDBOX_TEST_SECRET = 'private-secret';
  try {
    const app = repository(join(root, 'app'));
    commitCompose(app);
    const fake = sandboxRunner({ model: { services: { web: { image: 'nginx', ports: [{ target: 80 }] } },
      secrets: { password: { environment: 'SANDBOX_TEST_SECRET' } } } });
    const result = createSandbox({ item_id: 'item', project_directory: app, dependency_directories: [], is_docker_enabled: true }, fake.runner);
    assert.equal(result.status, 'failed');
    assert.equal(result.stage, 'preflight');
    assert.equal(result.sandbox_context, undefined);
    assert.ok(!JSON.stringify(result).includes('private-secret'));
  } finally {
    if (previous === undefined) delete process.env.SANDBOX_TEST_SECRET;
    else process.env.SANDBOX_TEST_SECRET = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test('container preparation uses explicit dependency repositories without parsing README prose', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-resolve-'));
  let context: any;
  const fake = sandboxRunner();
  try {
    const app = repository(join(root, 'app'));
    const api = repository(join(root, 'api'));
    const shared = repository(join(root, 'shared'));
    writeFileSync(join(app, 'README.md'), 'The API and shared repositories support this app.\n');
    commitCompose(app);
    assert.deepEqual(validateRepositories(app, [api, shared], { services: { api: { build: { context: api } } } }), [app, api, shared]);
    const result = createSandbox({ item_id: 'item', project_directory: app, dependency_directories: [api, shared], is_docker_enabled: true }, fake.runner);
    assert.equal(result.status, 'prepared', JSON.stringify(result));
    context = result.sandbox_context;
    assert.deepEqual(context.repositories.map((entry: any) => entry.source), [app, api, shared]);
  } finally {
    if (context) removeResources(context, fake.runner);
    rmSync(root, { recursive: true, force: true });
  }
});

test('undeclared Compose repositories and invalid explicit dependencies fail before allocation', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-tie-'));
  try {
    const app = repository(join(root, 'app'));
    const api = repository(join(root, 'api'));
    writeFileSync(join(app, 'compose.yaml'), 'services: {}');
    const model = { services: { api: { build: { context: api } } } };
    assert.throws(() => validateRepositories(app, [], model), /undeclared dependency/);
    assert.throws(() => validateRepositories(app, [app]), /Duplicate dependency/);
    assert.throws(() => validateRepositories(app, [join(api, '.git')]), /repository roots/);
    const result = createSandbox({ item_id: 'item', project_directory: app, dependency_directories: [], is_docker_enabled: true }, sandboxRunner({ model }).runner);
    assert.equal(result.status, 'failed');
    assert.equal(result.sandbox_context, undefined);
    assert.equal(gitWorktrees(app).length, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('Compose files remain unchanged when a sibling repository is supplied', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-dockerfile-'));
  let context: any;
  const fake = sandboxRunner({ model: {} });
  try {
    const app = repository(join(root, 'app'));
    const api = repository(join(root, 'api'));
    writeFileSync(join(api, 'Dockerfile'), 'FROM nginx:alpine\n');
    execFileSync('git', ['-C', api, 'add', 'Dockerfile']);
    execFileSync('git', ['-C', api, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'Dockerfile']);
    const compose = 'services:\n  web:\n    build:\n      context: .\n      dockerfile: ../api/Dockerfile\n    ports: ["8080:80"]\n';
    commitCompose(app, compose);
    const model = { services: { web: { build: { context: app, dockerfile: '../api/Dockerfile' }, ports: [{ target: 80, published: '8080' }] } } };
    assert.deepEqual(validateRepositories(app, [api], model), [app, api]);
    const base = sandboxRunner({ model });
    const runner: Run = (program, args, cwd) => {
      if (args[0] === 'exec' && args.includes('up')) {
        const worktree = args[args.indexOf('--workdir') + 1]!;
        assert.equal(readFileSync(join(worktree, 'compose.yaml'), 'utf8'), compose);
        assert.equal(readFileSync(join(worktree, '../api/Dockerfile'), 'utf8'), 'FROM nginx:alpine\n');
      }
      return base.runner(program, args, cwd);
    };
    const result = createSandbox({ item_id: 'item', project_directory: app, dependency_directories: [api], is_docker_enabled: true }, runner);
    context = result.sandbox_context;
    assert.equal(result.status, 'prepared', JSON.stringify(result));
    assert.equal(context.repositories.length, 2);
    removeResources(context, base.runner);
    context = undefined;
  } finally {
    if (context) removeResources(context, fake.runner);
    rmSync(root, { recursive: true, force: true });
  }
});
