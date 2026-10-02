import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createProvider } from '../../src/bridge/providers/index.mjs';
import { createOpenAI, parseOpenAI } from '../../src/bridge/providers/openai.mjs';
import { codexArgs, parseCodex, createCodex } from '../../src/bridge/providers/codex.mjs';
test('Codex events map to common result and usage', () => {
  const events = [{ type: 'thread.started', thread_id: 'thread-1' }, { type: 'item.completed', item: { type: 'agent_message', text: 'OK' } },
    { type: 'turn.completed', usage: { input_tokens: 10, cached_input_tokens: 4, output_tokens: 2 } }];
  assert.deepEqual(parseCodex(events.map(JSON.stringify).join('\n'), 'test'), {
    text: 'OK', model: 'test', requestId: 'thread-1', usage: { input: 10, cachedInput: 4, output: 2 } });
  assert.throws(() => parseCodex('{"type":"turn.failed"}', 'test'), { code: 'codex_error' });
  assert.throws(() => parseCodex('bad json', 'test'), { code: 'invalid_output' });
});
test('Codex uses an ephemeral task with local configuration and a working directory', () => {
  const directory = '/projects/app with spaces';
  const args = codexArgs(undefined, '', directory);
  assert.equal(args[args.indexOf('-C') + 1], directory);
  assert.ok(args.includes('--ephemeral'));
  assert.ok(args.includes('approval_policy="never"'));
  for (const blocked of ['--disable', '--ignore-user-config', '--sandbox', '-m', '--dangerously-bypass-approvals-and-sandbox'])
    assert.ok(!args.includes(blocked));
  assert.equal(args.at(-1), '-');
  const overridden = codexArgs('selected', 'workspace', directory);
  assert.equal(overridden[overridden.indexOf('-m') + 1], 'selected');
  assert.ok(overridden.includes('forced_chatgpt_workspace_id="workspace"'));
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

test('API authentication failures do not retry or fall back', async t => {
  const dir = mkdtempSync(`${tmpdir()}/auth-test-`); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const opts = { signal: new AbortController().signal };
  const keyFile = `${dir}/key`;
  await assert.rejects(createOpenAI({ model: 'test', keyFile }).generate('Hello', opts), { code: 'authentication' });
  writeFileSync(keyFile, 'test-only');
  for (const status of [401, 403, 429]) {
    let calls = 0;
    const api = createOpenAI({ model: 'test', keyFile, fetchImpl: async () => { calls++; return { ok: false, status }; } });
    await assert.rejects(api.generate('Hello', opts)); assert.equal(calls, 1);
  }
});

test('API transport cancellation and malformed responses never retry', async t => {
  const dir = mkdtempSync(`${tmpdir()}/api-failure-test-`); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const keyFile = `${dir}/key`; writeFileSync(keyFile, 'test-only');
  let calls = 0;
  const controller = new AbortController(); controller.abort();
  const api = createOpenAI({ model: 'test', keyFile, fetchImpl: async () => { calls++; throw new Error('aborted'); } });
  await assert.rejects(api.generate('Hello', { signal: controller.signal }), { code: 'timeout' });
  assert.equal(calls, 1);
  const malformed = createOpenAI({ model: 'test', keyFile, fetchImpl: async () => ({ ok: true, json: async () => { throw new SyntaxError('malformed'); } }) });
  await assert.rejects(malformed.generate('Hello', { signal: new AbortController().signal }));
});

test('Codex cancellation terminates the subprocess group', async t => {
  const { spawn } = await import('node:child_process');
  const { existsSync } = await import('node:fs');
  const dir = mkdtempSync(`${tmpdir()}/codex-cancel-test-`); t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(`${dir}/auth.json`, JSON.stringify({ tokens: { access_token: 'test-only', account_id: 'wanted' } }));
  const marker = `${dir}/survived`;
  const controller = new AbortController();
  const grandchild = `setTimeout(()=>require('fs').writeFileSync(${JSON.stringify(marker)},'alive'),300)`;
  const script = `const c=require('child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'}); console.log('ready');setInterval(()=>{},1000)`;
  const provider = createCodex({ model: 'test', workspace: 'wanted', directory: dir,
    spawnImpl: (_file, _args, options) => {
      const child = spawn(process.execPath, ['-e', script], options);
      child.stdout.once('data', () => controller.abort());
      return child;
    } });
  await assert.rejects(provider.generate('Hello', { signal: controller.signal }), { code: 'timeout' });
  await new Promise(resolve => setTimeout(resolve, 400));
  assert.equal(existsSync(marker), false);
});

test('API mode accepts its configured environment token without requiring a key file', async () => {
  const provider = createOpenAI({ model: 'test', key: 'test-only-env-token', keyFile: '/nonexistent', fetchImpl: async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-only-env-token');
    return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'OK' }] }] });
  } });
  assert.equal((await provider.generate('Hello', { signal: new AbortController().signal })).text, 'OK');
});

test('local CLI receives host environment and cwd without a file-based auth prerequisite', async t => {
  const { spawn } = await import('node:child_process');
  const dir = mkdtempSync(`${tmpdir()}/codex-local-`); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const environment = { PATH: process.env.PATH, HOME: dir, CODEX_HOME: `${dir}/config`, SSH_AUTH_SOCK: '/host/agent' };
  const provider = createCodex({ environment, directory: dir, executable: '/custom/codex', spawnImpl: (file, args, options) => {
    assert.equal(file, '/custom/codex');
    assert.equal(options.cwd, dir);
    assert.deepEqual(options.env, environment);
    assert.ok(args.includes('--ephemeral'));
    return spawn(process.execPath, ['-e', `process.stdin.resume();process.stdin.on('end',()=>{
      console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'OK'}}));
      console.log(JSON.stringify({type:'turn.completed'}));
    })`], options);
  } });
  const result = await provider.generate('Hello', { signal: new AbortController().signal });
  assert.equal(result.text, 'OK');
  assert.equal(result.model, 'configured-default');
});
