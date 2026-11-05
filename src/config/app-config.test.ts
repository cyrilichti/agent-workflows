import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const configUrl = new URL('./app.config.ts', import.meta.url).href;
const validatorUrl = new URL('../validators/config.validator.ts', import.meta.url).href;

function envFile(t: TestContext, extra = '') {
  const directory = mkdtempSync(`${tmpdir()}/bridge-config-`);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = `${directory}/.env`;
  writeFileSync(file,
    `LANGFUSE_PUBLIC_KEY=test-public\nLANGFUSE_SECRET_KEY=test-private\nSECRET_BRIDGE_TOKEN=${Buffer.from('test-token-'.repeat(4)).toString('base64')}\n${extra}`);
  return file;
}

function readConfig(file: string, environment: NodeJS.ProcessEnv = {}) {
  const script = `import { appConfig } from '${configUrl}';
    import { ConfigValidator } from '${validatorUrl}';
    new ConfigValidator().validate(appConfig);
    console.log(JSON.stringify(appConfig));`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: dirname(file), env: environment, encoding: 'utf8',
  });
  return result;
}

test('configuration preserves host CLI environment without injecting .env secrets', (t) => {
  const environment = { HOME: '/host/home', PATH: '/host/bin', CODEX_HOME: '/host/codex', AI_MODEL: 'host-model' };
  const result = readConfig(envFile(t, 'AI_MODEL=file-model\nPOSTGRES_PASSWORD=test-only\n'), environment);
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  for (const [key, value] of Object.entries(environment)) {
    assert.equal(config.providerOptions.environment[key], value);
  }
  assert.equal(config.providerOptions.environment.POSTGRES_PASSWORD, undefined);
  assert.equal(config.model, 'host-model');
  assert.equal(config.providerOptions.directory, projectRoot);
  assert.equal(config.http.token, 'test-token-'.repeat(4));
  assert.equal(config.execution.enabled, false);
  assert.equal(config.execution.timeoutMs, 1_800_000);
  assert.equal(config.langfuse.projectId, 'agent-workflows');
});

test('configuration rejects invalid execution settings', (t) => {
  for (const extra of ['BRIDGE_PORT=0', 'REQUEST_TIMEOUT_MS=3600001']) {
    assert.notEqual(readConfig(envFile(t, extra)).status, 0);
  }
  const result = readConfig(envFile(t));
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.equal(config.providerOptions.directory, projectRoot);
  const projectConfig = readConfig(envFile(t, 'CODEX_WORKING_DIRECTORY=/host/project with spaces\n'));
  assert.equal(JSON.parse(projectConfig.stdout).providerOptions.directory, '/host/project with spaces');
});

test('empty working directory defaults to the project root outside the launch directory', (t) => {
  const result = readConfig(envFile(t, 'CODEX_WORKING_DIRECTORY=\n'));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).providerOptions.directory, projectRoot);
});

test('deployment environment is passed to tracing configuration', (t) => {
  const result = readConfig(envFile(t, 'DEPLOYMENT_ENVIRONMENT=staging\n'));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).langfuse.environment, 'staging');
});

test('configuration rejects a bridge token shorter than 32 bytes before serving requests', (t) => {
  const result = readConfig(envFile(t, `SECRET_BRIDGE_TOKEN=${Buffer.from('short').toString('base64')}\n`));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Configure a bridge token of at least 32 bytes/);
});

test('AI_PROVIDER defaults to Codex and preserves explicit selection', (t) => {
  for (const extra of ['', 'AI_PROVIDER=codex\nAI_MODEL=test-model\n']) {
    const result = readConfig(envFile(t, extra));
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).providerName, 'codex');
  }
});

test('configuration rejects unsupported providers before serving requests', (t) => {
  for (const provider of ['openai-api', 'invalid']) {
    for (const model of ['', 'AI_MODEL=test-model\n']) {
      const result = readConfig(envFile(t, `AI_PROVIDER=${provider}\n${model}`));
      assert.notEqual(result.status, 0);
      assert.ok(result.stderr.includes(`Unknown AI_PROVIDER: ${provider}`), result.stderr);
    }
  }
});
