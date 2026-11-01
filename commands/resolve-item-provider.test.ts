import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { resolveConfiguredProvider, resolveItemProvider } from './resolve-item-provider.ts';

function withConfig(content: string, check: (path: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'provider-config-'));
  try {
    const path = join(root, 'agent-workflows.yaml');
    writeFileSync(path, content);
    check(path);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('resolves root-level item and version providers independently', () => {
  for (const item of ['clickup', 'linear']) {
    for (const version of ['github', 'gitlab']) {
      withConfig(`item:\n  provider: ${item}\nversion:\n  provider: ${version}\n`, path => {
        assert.equal(resolveItemProvider(path), item);
        assert.equal(resolveConfiguredProvider(path, 'version'), version);
      });
    }
  }
});

test('preserves quoted values, comments, and CRLF configuration', () => {
  withConfig('# Providers\r\nversion:\r\n  provider: "gitlab" # requests\r\n\r\nitem:\r\n  # Issues\r\n  provider: \'linear\'\r\n', path => {
    assert.equal(resolveItemProvider(path), 'linear');
    assert.equal(resolveConfiguredProvider(path, 'version'), 'gitlab');
  });
});

test('does not resolve providers from the obsolete mcp hierarchy or other nested blocks', () => {
  for (const parent of ['mcp', 'other']) {
    withConfig(`${parent}:\n  item:\n    provider: linear\n  version:\n    provider: github\n`, path => {
      assert.equal(resolveItemProvider(path), undefined);
      assert.equal(resolveConfiguredProvider(path, 'version'), undefined);
    });
  }
});

test('a missing provider does not fall back to the other kind', () => {
  withConfig('version:\n  provider: github\n', path => {
    assert.equal(resolveItemProvider(path), undefined);
  });
  withConfig('item:\n  provider: linear\n', path => {
    assert.equal(resolveConfiguredProvider(path, 'version'), undefined);
  });
});
