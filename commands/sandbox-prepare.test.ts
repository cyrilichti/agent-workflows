import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { parsePreparationInput, resolveDependencies } from './sandbox-prepare.ts';

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
