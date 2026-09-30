import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createProvider } from '../providers/index.mjs';
import { createOpenAI, parseOpenAI } from '../providers/openai.mjs';
import { codexArgs, parseCodex, createCodex } from '../providers/codex.mjs';
test('Codex events map to common result and usage', () => {
  const events = [{ type: 'thread.started', thread_id: 'thread-1' }, { type: 'item.completed', item: { type: 'agent_message', text: 'OK' } },
    { type: 'turn.completed', usage: { input_tokens: 10, cached_input_tokens: 4, output_tokens: 2 } }];
  assert.deepEqual(parseCodex(events.map(JSON.stringify).join('\n'), 'test'), {
    text: 'OK', model: 'test', requestId: 'thread-1', usage: { input: 10, cachedInput: 4, output: 2 } });
  assert.throws(() => parseCodex('{"type":"turn.failed"}', 'test'), { code: 'codex_error' });
  assert.throws(() => parseCodex('bad json', 'test'), { code: 'invalid_output' });
});
test('Codex runtime disables tools and excludes project and personal configuration', () => {
  const args = codexArgs('test', 'workspace');
  for (const required of ['--ignore-user-config', 'read-only', 'forced_login_method="chatgpt"', 'web_search="disabled"', 'shell_tool', 'unified_exec', 'apps', 'plugins']) assert.ok(args.includes(required));
  assert.equal(args.at(-1), '-'); assert.ok(!args.includes('--dangerously-bypass-approvals-and-sandbox'));
});
test('API uses selected model, bounded output and supplied token without retries', async t => {
  const dir = mkdtempSync(`${tmpdir()}/api-test-`); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const keyFile = `${dir}/key`; writeFileSync(keyFile, 'test-only-key'); let calls = 0;
  const provider = createOpenAI({ model: 'test', keyFile, fetchImpl: async (url, options) => {
    calls++; assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer test-only-key');
    assert.deepEqual(JSON.parse(options.body), { model: 'test', input: 'Hello', max_output_tokens: 1024, store: false, tools: [] });
    return { ok: true, json: async () => ({ status: 'completed', id: 'resp-1', output: [{ type: 'message', content: [{ type: 'output_text', text: 'OK' }] }], usage: { input_tokens: 3, output_tokens: 1 } }) };
  } });
  assert.equal((await provider.generate('Hello', { signal: new AbortController().signal })).text, 'OK'); assert.equal(calls, 1);
  const failed = createOpenAI({ model: 'test', keyFile, fetchImpl: async () => ({ ok: false, status: 429 }) });
  await assert.rejects(failed.generate('Hello', { signal: new AbortController().signal }), { code: 'quota_or_rate_limit' });
});
test('provider selection and API completeness fail closed', () => {
  assert.throws(() => createProvider('invalid', {}), /Unknown AI_PROVIDER/);
  assert.throws(() => parseOpenAI({ status: 'incomplete' }, 'test'), { code: 'api_incomplete' });
});

test('missing, revoked or wrong-workspace authentication fails without fallback', async t => {
  const dir = mkdtempSync(`${tmpdir()}/auth-test-`); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const opts = { signal: new AbortController().signal };
  const codex = createCodex({ model: 'test', workspace: 'wanted', authDir: dir,
    spawnImpl: () => { throw new Error('must not spawn'); } });
  await assert.rejects(codex.generate('Hello', opts), { code: 'authentication' });
  writeFileSync(`${dir}/auth.json`, JSON.stringify({ tokens: { access_token: 'test-only', account_id: 'other' } }));
  await assert.rejects(codex.generate('Hello', opts), { code: 'authentication' });
  const keyFile = `${dir}/key`;
  await assert.rejects(createOpenAI({ model: 'test', keyFile }).generate('Hello', opts), { code: 'authentication' });
  writeFileSync(keyFile, 'test-only');
  for (const status of [401, 403, 429]) {
    let calls = 0;
    const api = createOpenAI({ model: 'test', keyFile, fetchImpl: async () => { calls++; return { ok: false, status }; } });
    await assert.rejects(api.generate('Hello', opts)); assert.equal(calls, 1);
  }
});
