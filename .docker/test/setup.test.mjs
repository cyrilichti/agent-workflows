import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installFlowise } from '../flowise.mjs';
function fixture(t, options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ai-init-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { url: 'http://flowise:3000', email: 'local@example.test', password: 'test-only',
    workflow: '{"nodes":[]}', idPath: join(root, 'flow-id'), ...options };
}
test('initial import uses configured credentials, session cookies and retains renamed/edited workflow on restart', async t => {
  const options = fixture(t);
  let registered = false, imports = 0;
  options.fetchImpl = async (url, init) => {
    const path = new URL(url).pathname;
    assert.equal(new URL(url).hostname, 'flowise');
    if (path.endsWith('/auth/login')) {
      assert.deepEqual(JSON.parse(init.body), { email: options.email, password: options.password });
      return new Response('{}', { status: registered ? 200 : 401, headers: { 'Set-Cookie': 'session=test-only; HttpOnly' } });
    }
    if (path.endsWith('/account/register')) { registered = true; return new Response('{}'); }
    assert.equal(init.headers.Cookie, 'session=test-only');
    assert.equal(init.headers['x-request-from'], 'internal');
    if (path.endsWith('/chatflows')) {
      if (init.method === 'GET') return Response.json([]);
      imports++; return Response.json({ id: 'saved-flow' });
    }
    assert.ok(path.endsWith('/chatflows/saved-flow')); assert.equal(init.method, 'GET');
    return Response.json({ id: 'saved-flow', name: 'Renamed', flowData: 'user edits' });
  };
  assert.equal(await installFlowise(options), 'saved-flow');
  assert.equal(await installFlowise(options), 'saved-flow');
  assert.equal(imports, 1);
});
test('adopts a previous example without importing or overwriting it', async t => {
  const options = fixture(t, { fetchImpl: async (url, init) => {
    if (url.endsWith('/auth/login')) return new Response('{}');
    assert.equal(init.method, 'GET');
    return Response.json([{ id: 'old-id', name: 'Local AI — Codex or API', type: 'AGENTFLOW', flowData: 'edited' }]);
  }});
  assert.equal(await installFlowise(options), 'old-id');
  assert.equal(readFileSync(options.idPath, 'utf8'), 'old-id');
});
test('missing configured password fails without generating credentials or contacting Flowise', async t => {
  await assert.rejects(installFlowise(fixture(t, { password: '', fetchImpl: () => assert.fail('Unexpected HTTP call') })), /FLOWISE_ADMIN_PASSWORD/);
});
test('missing persisted workflow fails instead of silently replacing it', async t => {
  const options = fixture(t, { fetchImpl: async url => new Response('{}', { status: url.endsWith('/auth/login') ? 200 : 404 }) });
  writeFileSync(options.idPath, 'deleted-id');
  await assert.rejects(installFlowise(options), /HTTP 404/);
  assert.equal(readFileSync(options.idPath, 'utf8'), 'deleted-id');
});
test('ambiguous existing examples fail rather than choosing a workflow arbitrarily', async t => {
  const options = fixture(t, { fetchImpl: async url => url.endsWith('/auth/login') ? new Response('{}') : Response.json(
    ['one', 'two'].map(id => ({ id, name: 'Local AI — Codex or API', type: 'AGENTFLOW' }))) });
  await assert.rejects(installFlowise(options), /Multiple example workflows/);
});
