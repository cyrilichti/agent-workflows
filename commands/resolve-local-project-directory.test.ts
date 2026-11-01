import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const program = resolve('commands/resolve-local-project-directory.ts');
const itemCli = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'api') {
  process.stdout.write(JSON.stringify({ data: { issue: { id: 'item-id',
    identifier: 'ICY-1', state: { id: 'open', name: 'Open', type: 'started' },
    team: { id: 'team-1' }, project: null } } }));
} else if (args[0] === 'issue' && args[1] === 'view') {
  process.stdout.write(JSON.stringify({ title: 'Task',
    description: process.env.TEST_PROJECT_ITEM_DESCRIPTION ?? '',
    url: 'https://linear.app/acme/issue/ICY-1', labels: [], comments: [] }));
} else process.exit(2);
`;

function fixture(paths: string[]) {
  const root = mkdtempSync(join(tmpdir(), 'project-test-'));
  const bin = join(root, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'linear'), itemCli, { mode: 0o755 });
  mkdirSync(join(root, 'commands'));
  mkdirSync(join(root, 'providers', 'linear'), { recursive: true });
  mkdirSync(join(root, 'providers', 'clickup'), { recursive: true });
  for (const file of ['resolve-local-project-directory.ts', 'resolve-item-provider.ts',
    'read-item.ts']) {
    copyFileSync(resolve('commands', file), join(root, 'commands', file));
  }
  for (const provider of ['linear', 'clickup']) {
    copyFileSync(resolve('providers', provider, 'read-item.ts'),
      join(root, 'providers', provider, 'read-item.ts'));
  }
  writeFileSync(join(root, 'agent-workflows.yaml'), 'item:\n  provider: linear\n');
  return {
    root,
    run: (list: string, configured = paths, description = '') => spawnSync(process.execPath,
      [join(root, 'commands', 'resolve-local-project-directory.ts'),
        list, 'item-id', JSON.stringify(configured)], {
      encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`,
        TEST_PROJECT_ITEM_DESCRIPTION: description },
    }),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function repository(path: string, gitFile = false) {
  mkdirSync(path, { recursive: true });
  if (gitFile) writeFileSync(join(path, '.git'), 'gitdir: elsewhere\n');
  else mkdirSync(join(path, '.git'));
}

test('configured tier preserves full basename priority and chooses the first family tie', () => {
  const root = mkdtempSync(join(tmpdir(), 'project-repos-'));
  const fooBar = join(root, 'foo-bar');
  const fooBaz = join(root, 'foo-baz');
  const bar = join(root, 'bar');
  for (const path of [fooBar, fooBaz, bar]) repository(path);
  const f = fixture([fooBaz, bar, fooBar]);
  try {
    assert.deepEqual(JSON.parse(f.run('baz foo bar').stdout), { path: realpathSync(fooBar) });
    assert.deepEqual(JSON.parse(f.run('baz foo').stdout), { path: realpathSync(fooBar) });
  } finally {
    f.cleanup();
    rmSync(root, { recursive: true, force: true });
  }
});

test('family ties prefer names without api or back, then lexical paths', () => {
  const root = mkdtempSync(join(tmpdir(), 'project-family-'));
  const api = join(root, 'foo-api');
  const back = join(root, 'foo-backend');
  const front = join(root, 'foo-web');
  for (const path of [api, back, front]) repository(path);
  const f = fixture([back, front, api]);
  try {
    assert.deepEqual(JSON.parse(f.run('foo').stdout), { path: realpathSync(front) });
    assert.deepEqual(JSON.parse(f.run('foo', [back, api]).stdout), { path: realpathSync(api) });
  } finally {
    f.cleanup();
    rmSync(root, { recursive: true, force: true });
  }
});

test('repository ties use an explicit reference from the official item', () => {
  const root = mkdtempSync(join(tmpdir(), 'project-item-tie-'));
  const api = join(root, 'foo-api');
  const web = join(root, 'foo-web');
  repository(api);
  repository(web);
  const f = fixture([web, api]);
  try {
    const output = f.run('foo', [web, api], 'Primary repository: foo-api');
    assert.equal(output.status, 0, output.stderr);
    assert.deepEqual(JSON.parse(output.stdout), { path: realpathSync(api) });
  } finally {
    f.cleanup();
    rmSync(root, { recursive: true, force: true });
  }
});

test('parent tier inspects direct neighbors and accepts a .git file', () => {
  const root = mkdtempSync(join(tmpdir(), 'project-neighbors-'));
  const configured = join(root, 'configured');
  const neighbor = join(root, 'my-app');
  const nested = join(configured, 'nested-app');
  mkdirSync(configured);
  repository(neighbor, true);
  repository(nested);
  const f = fixture([configured]);
  try {
    assert.deepEqual(JSON.parse(f.run('my app').stdout), { path: realpathSync(neighbor) });
    assert.deepEqual(JSON.parse(f.run('nested app').stdout), { status: 'not found' });
  } finally {
    f.cleanup();
    rmSync(root, { recursive: true, force: true });
  }
});

test('incomplete inspection overrides a match and empty configuration yields not found', () => {
  const root = mkdtempSync(join(tmpdir(), 'project-incomplete-'));
  const match = join(root, 'matching-project');
  const loop = join(root, 'loop');
  repository(match);
  symlinkSync(loop, loop);
  const f = fixture([match, loop]);
  try {
    assert.deepEqual(JSON.parse(f.run('matching project').stdout), { status: 'search incomplete' });
    assert.deepEqual(JSON.parse(f.run('matching project', []).stdout), { status: 'not found' });
    const invalid = f.run(' ');
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, '');
    assert.equal(spawnSync(process.execPath, [program, 'matching project', 'item-id', 'not json']).status, 1);
  } finally {
    f.cleanup();
    rmSync(root, { recursive: true, force: true });
  }
});

test('default invocation reads configured Codex projects without a paths argument', () => {
  const root = mkdtempSync(join(tmpdir(), 'project-config-'));
  const codexHome = join(root, 'codex');
  const repo = join(root, 'example');
  mkdirSync(codexHome);
  repository(repo);
  writeFileSync(join(codexHome, 'config.toml'), `[projects.${JSON.stringify(repo)}]\ntrust_level = "trusted"\n`);
  try {
    const result = spawnSync(process.execPath, [program, 'example', 'item-id'], {
      encoding: 'utf8', env: { ...process.env, CODEX_HOME: codexHome, AI_PROVIDER: 'codex' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { path: realpathSync(repo) });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('installed workflow can invoke its adjacent resolver', () => {
  const root = mkdtempSync(join(tmpdir(), 'project-installed-'));
  const commands = join(root, '.agents', 'commands');
  const workflows = join(root, '.agents', 'workflows');
  mkdirSync(commands, { recursive: true });
  mkdirSync(workflows);
  copyFileSync(program, join(commands, 'resolve-local-project-directory.ts'));
  const repo = join(root, 'example');
  repository(repo);
  const f = fixture([repo]);
  try {
    const result = spawnSync(process.execPath,
      ['../commands/resolve-local-project-directory.ts', 'example', 'item-id', JSON.stringify([repo])], {
      cwd: workflows,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { path: realpathSync(repo) });
  } finally {
    f.cleanup();
    rmSync(root, { recursive: true, force: true });
  }
});
