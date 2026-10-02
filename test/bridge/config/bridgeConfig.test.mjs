import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loadBridgeConfig } from '../../../src/bridge/config/bridgeConfig.mjs';

function envFile(t, extra = '') {
  const directory = mkdtempSync(`${tmpdir()}/bridge-config-`);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = `${directory}/.env`;
  writeFileSync(
    file,
    `LANGFUSE_PUBLIC_KEY=test-public\nLANGFUSE_SECRET_KEY=test-private\nSECRET_BRIDGE_TOKEN=${Buffer.from('test-token-'.repeat(4)).toString('base64')}\n${extra}`,
  );
  return file;
}

test('configuration preserves host CLI environment without injecting .env secrets', (t) => {
  const environment = {
    HOME: '/host/home',
    PATH: '/host/bin',
    CODEX_HOME: '/host/codex',
    AI_MODEL: 'host-model',
  };
  const config = loadBridgeConfig({
    envFile: envFile(t, 'AI_MODEL=file-model\nPOSTGRES_PASSWORD=test-only\n'),
    environment,
    directory: '/host/work',
  });
  assert.deepEqual(config.providerOptions.environment, environment);
  assert.equal(config.model, 'host-model');
  assert.equal(config.providerOptions.directory, '/host/work');
  assert.equal(config.http.token, 'test-token-'.repeat(4));
  assert.equal(config.execution.enabled, false);
  assert.equal(config.execution.timeoutMs, 1800000);
});

test('configuration rejects invalid execution settings and missing API model', (t) => {
  for (const extra of ['BRIDGE_PORT=0', 'REQUEST_TIMEOUT_MS=1800001', 'AI_PROVIDER=openai-api']) {
    assert.throws(() => loadBridgeConfig({ envFile: envFile(t, extra), environment: {} }));
  }
  const config = loadBridgeConfig({ envFile: envFile(t), environment: {} });
  assert.equal(config.providerOptions.model, undefined);
});
