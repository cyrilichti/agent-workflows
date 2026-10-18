import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const program = resolve('commands/resolve-item-provider.ts');

function fixture(provider: string | null) {
  const root = mkdtempSync(join(tmpdir(), 'item-provider-test-'));
  const commands = join(root, '.agents', 'commands');
  mkdirSync(commands, { recursive: true });
  copyFileSync(program, join(commands, 'resolve-item-provider.ts'));
  if (provider !== null) {
    writeFileSync(join(root, 'agent-workflows.yaml'), `mcp:\n  item:\n    provider: ${provider}\n`);
  }
  return {
    root,
    commands,
    run: () => spawnSync(process.execPath, ['../commands/resolve-item-provider.ts'], {
      cwd: join(root, '.agents', 'workflows'),
      encoding: 'utf8',
    }),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test('project resolves configured providers from an installed workflow', () => {
  for (const provider of ['clickup', 'linear']) {
    const f = fixture(provider);
    try {
      mkdirSync(join(f.root, '.agents', 'workflows'));
      mkdirSync(join(f.root, '.agents', 'providers', provider), { recursive: true });
      const result = f.run();
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, `${provider}\n`);
    } finally { f.cleanup(); }
  }
});

test('project provider command stops for missing, unsupported, or uninstalled providers', () => {
  for (const [provider, message] of [
    [null, 'agent-workflows.yaml'],
    ['github', 'Supported values: clickup, linear'],
    ['linear', 'Missing provider directory: linear'],
  ] as const) {
    const f = fixture(provider);
    try {
      mkdirSync(join(f.root, '.agents', 'workflows'));
      const result = f.run();
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, new RegExp(message));
    } finally { f.cleanup(); }
  }
});
