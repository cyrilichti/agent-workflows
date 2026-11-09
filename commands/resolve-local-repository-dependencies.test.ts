import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const program = resolve('commands/resolve-local-repository-dependencies.ts');

test('resolves several README repository names in one local-only invocation', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-dependencies-'));
  try {
    const codexHome = join(root, 'codex');
    const app = join(root, 'app');
    const api = join(root, 'service-api');
    const shared = join(root, 'shared-lib');
    mkdirSync(codexHome);
    for (const path of [app, api, shared]) mkdirSync(join(path, '.git'), { recursive: true });
    writeFileSync(join(codexHome, 'config.toml'), `[projects.${JSON.stringify(app)}]\n[projects.${JSON.stringify(api)}]\n`);
    const run = (names: unknown) => spawnSync(process.execPath, [program, '--repository-names', JSON.stringify(names)], {
      encoding: 'utf8',
      env: { ...process.env, CODEX_HOME: codexHome, PATH: '/nonexistent' },
    });
    const result = run(['service-api', 'shared-lib', 'missing']);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { results: [
      { name: 'service-api', path: realpathSync(api) },
      { name: 'shared-lib', path: realpathSync(shared) },
      { name: 'missing', status: 'not found' },
    ] });
    assert.equal(run([]).status, 1);
    assert.equal(run([' ']).status, 1);
    assert.equal(spawnSync(process.execPath, [program], { encoding: 'utf8' }).status, 1);
    assert.equal(spawnSync(process.execPath, [program, '--unknown', '["api"]'], { encoding: 'utf8' }).status, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('reports ambiguous repository names without item or board tie breaking', () => {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-dependencies-tie-'));
  try {
    const codexHome = join(root, 'codex');
    const first = join(root, 'one', 'api');
    const second = join(root, 'two', 'api');
    mkdirSync(codexHome);
    for (const path of [first, second]) mkdirSync(join(path, '.git'), { recursive: true });
    writeFileSync(join(codexHome, 'config.toml'), `[projects.${JSON.stringify(first)}]\n[projects.${JSON.stringify(second)}]\n`);
    const result = spawnSync(process.execPath, [program, '--repository-names', '["api"]'], {
      encoding: 'utf8', env: { ...process.env, CODEX_HOME: codexHome, PATH: '/nonexistent' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { results: [{ name: 'api', status: 'ambiguous' }] });
  } finally { rmSync(root, { recursive: true, force: true }); }
});
