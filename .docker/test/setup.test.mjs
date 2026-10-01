import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { prepare, readConfig, writeConfig } from '../config.mjs';
import { installFlowise } from '../flowise.mjs';
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'ai-setup-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
test('first start generates private secrets once and leaves inference disabled', t => {
  const root = fixture(t), first = prepare(root, ['127.0.0.0/8']);
  assert.equal(first.COMPOSE_PROFILES, 'codex'); assert.equal(first.INFERENCE_ENABLED, 'false');
  assert.equal(statSync(join(root, '.env')).mode & 0o777, 0o600);
  assert.equal(first.POSTGRES_PASSWORD.length, 64);
  assert.deepEqual(prepare(root, ['127.0.0.0/8']), first);
});
test('migration retains old secrets, enabled state and imported workflow identity', t => {
  const root = fixture(t);
  mkdirSync(join(root, 'local-ai/.local'), { recursive: true });
  writeFileSync(join(root, 'local-ai/.env'), 'AI_PROVIDER=codex\nPOSTGRES_PASSWORD=existing-secret\nINFERENCE_ENABLED=true\n');
  writeFileSync(join(root, 'local-ai/.local/flowise-id'), 'existing-flow');
  const config = prepare(root, []);
  assert.equal(config.POSTGRES_PASSWORD, 'existing-secret'); assert.equal(config.INFERENCE_ENABLED, 'true');
  assert.equal(config.COMPOSE_PROFILES, 'codex'); assert.equal(config.AI_PROVIDER, undefined);
  assert.equal(readFileSync(join(root, '.local/flowise-id'), 'utf8'), 'existing-flow');
});
test('API migration retains token and provider without enabling inference', t => {
  const root = fixture(t);
  mkdirSync(join(root, 'local-ai/.local'), { recursive: true });
  writeFileSync(join(root, 'local-ai/.env'), 'AI_PROVIDER=openai-api\n');
  writeFileSync(join(root, 'local-ai/.local/openai-api-key'), 'test-only-key\n');
  const config = prepare(root, []);
  assert.equal(config.OPENAI_API_KEY, 'test-only-key'); assert.equal(config.COMPOSE_PROFILES, 'openai-api');
  assert.equal(config.INFERENCE_ENABLED, 'false');
});
test('configuration accepts quoted values and rejects ambiguous provider selection', t => {
  const root = fixture(t); prepare(root, []);
  writeFileSync(join(root, '.env'), 'COMPOSE_PROFILES="openai-api"\nOPENAI_API_KEY="test-only-key"\n');
  assert.equal(readConfig(root).OPENAI_API_KEY, 'test-only-key');
  const config = prepare(root, []); config.COMPOSE_PROFILES = 'codex,openai-api'; writeConfig(root, config);
  assert.throws(() => prepare(root, []), /COMPOSE_PROFILES/);
});
test('Flowise initial import and repeated startup retain user edits and use session cookies', async t => {
  const root = fixture(t); prepare(root, []);
  mkdirSync(join(root, '.docker')); writeFileSync(join(root, '.docker/workflow.json'), '{"nodes":[]}');
  let registered = false, imports = 0;
  const fetchImpl = async (url, options) => {
    const path = new URL(url).pathname;
    if (path.endsWith('/auth/login')) return new Response('{}', { status: registered ? 200 : 401, headers: { 'Set-Cookie': 'session=test-only; HttpOnly' } });
    if (path.endsWith('/account/register')) { registered = true; return new Response('{}'); }
    assert.equal(options.headers.Cookie, 'session=test-only');
    assert.equal(options.headers['x-request-from'], 'internal');
    if (path.endsWith('/chatflows')) { imports++; return Response.json({ id: 'existing-flow' }); }
    assert.ok(path.endsWith('/chatflows/existing-flow')); assert.equal(options.method, 'GET');
    return Response.json({ id: 'existing-flow', flowData: 'user edits' });
  };
  const first = await installFlowise(root, { fetchImpl });
  const second = await installFlowise(root, { fetchImpl });
  assert.equal(imports, 1); assert.deepEqual(second, first);
});

test('migration refuses conflicting local workflow identities', t => {
  const root = fixture(t); prepare(root, []);
  mkdirSync(join(root, 'local-ai/.local'), { recursive: true });
  writeFileSync(join(root, 'local-ai/.local/flowise-id'), 'old-flow');
  writeFileSync(join(root, '.local/flowise-id'), 'different-flow');
  assert.throws(() => prepare(root, []), /Conflicting installation/);
  assert.equal(readFileSync(join(root, '.local/flowise-id'), 'utf8'), 'different-flow');
});
