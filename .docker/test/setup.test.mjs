import test from 'node:test';
import assert from 'node:assert/strict';
import { installWorkflow } from '../kestra.mjs';
const config = { url: 'http://kestra:8080', email: 'local@example.test', password: 'test-only', workflow: 'id: local_ai\nnamespace: local.ai\n' };
test('first initialization imports the YAML with local authentication', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.headers.Authorization, 'Basic ' + Buffer.from('local@example.test:test-only').toString('base64'));
    return new Response('{}', { status: calls.length === 1 ? 404 : 200 });
  };
  assert.equal(await installWorkflow({ ...config, fetchImpl }), 'created');
  assert.equal(calls[0].url, 'http://kestra:8080/api/v1/main/flows/local.ai/local_ai');
  assert.equal(calls[1].url, 'http://kestra:8080/api/v1/main/flows');
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(calls[1].options.headers['Content-Type'], 'application/x-yaml');
  assert.equal(calls[1].options.body, config.workflow);
});
test('restarting retains the existing workflow without overwriting edits', async () => {
  let calls = 0;
  assert.equal(await installWorkflow({ ...config, fetchImpl: async () => {
    calls++; return Response.json({ id: 'local_ai', description: 'User edits', revision: 7 });
  } }), 'retained');
  assert.equal(calls, 1);
});
test('authentication and server failures do not trigger creation', async () => {
  for (const status of [401, 403, 500, 503]) {
    let calls = 0;
    await assert.rejects(installWorkflow({ ...config, fetchImpl: async () => {
      calls++; return new Response('private server detail', { status });
    } }), new RegExp(`lookup failed \\(HTTP ${status}\\)`));
    assert.equal(calls, 1);
  }
});
test('invalid workflows fail without exposing server details or credentials', async () => {
  let calls = 0;
  await assert.rejects(installWorkflow({ ...config, fetchImpl: async () => {
    calls++; return new Response('private server detail', { status: calls === 1 ? 404 : 422 });
  } }), error => error.message.includes('HTTP 422') && !error.message.includes('private') && !error.message.includes(config.password));
});
test('missing credentials fail before any HTTP call', async () => {
  await assert.rejects(installWorkflow({ ...config, password: '', fetchImpl: () => assert.fail('Unexpected request') }), /Configure KESTRA/);
});
