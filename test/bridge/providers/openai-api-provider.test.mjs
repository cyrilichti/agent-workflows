import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  createOpenAiApiProvider,
  parseOpenAiResponse,
} from '../../../src/bridge/providers/openai-api-provider.mjs';

test('API uses selected model, bounded output and supplied token without retries', async (t) => {
  const dir = mkdtempSync(`${tmpdir()}/api-test-`);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const keyFile = `${dir}/key`;
  writeFileSync(keyFile, 'test-only-key');
  let calls = 0;
  const provider = createOpenAiApiProvider({
    model: 'test',
    keyFile,
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, 'https://api.openai.com/v1/responses');
      assert.equal(options.headers.Authorization, 'Bearer test-only-key');
      assert.deepEqual(JSON.parse(options.body), {
        model: 'test',
        input: 'Hello',
        max_output_tokens: 1024,
        store: false,
        tools: [],
      });
      return {
        ok: true,
        json: async () => ({
          status: 'completed',
          id: 'resp-1',
          output: [{ type: 'message', content: [{ type: 'output_text', text: 'OK' }] }],
          usage: { input_tokens: 3, output_tokens: 1 },
        }),
      };
    },
  });
  assert.equal(
    (await provider.generate('Hello', { signal: new AbortController().signal })).text,
    'OK',
  );
  assert.equal(calls, 1);
  const failed = createOpenAiApiProvider({
    model: 'test',
    keyFile,
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  await assert.rejects(failed.generate('Hello', { signal: new AbortController().signal }), {
    code: 'quota_or_rate_limit',
  });
});

test('incomplete API responses fail closed', () => {
  assert.throws(() => parseOpenAiResponse({ status: 'incomplete' }, 'test'), {
    code: 'api_incomplete',
  });
});

test('API authentication failures do not retry or fall back', async (t) => {
  const dir = mkdtempSync(`${tmpdir()}/auth-test-`);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const opts = { signal: new AbortController().signal };
  const keyFile = `${dir}/key`;
  await assert.rejects(
    createOpenAiApiProvider({ model: 'test', keyFile }).generate('Hello', opts),
    { code: 'authentication' },
  );
  writeFileSync(keyFile, 'test-only');
  for (const status of [401, 403, 429]) {
    let calls = 0;
    const api = createOpenAiApiProvider({
      model: 'test',
      keyFile,
      fetchImpl: async () => {
        calls++;
        return { ok: false, status };
      },
    });
    await assert.rejects(api.generate('Hello', opts));
    assert.equal(calls, 1);
  }
});

test('API transport cancellation and malformed responses never retry', async (t) => {
  const dir = mkdtempSync(`${tmpdir()}/api-failure-test-`);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const keyFile = `${dir}/key`;
  writeFileSync(keyFile, 'test-only');
  let calls = 0;
  const controller = new AbortController();
  controller.abort();
  const api = createOpenAiApiProvider({
    model: 'test',
    keyFile,
    fetchImpl: async () => {
      calls++;
      throw new Error('aborted');
    },
  });
  await assert.rejects(api.generate('Hello', { signal: controller.signal }), { code: 'timeout' });
  assert.equal(calls, 1);
  const malformed = createOpenAiApiProvider({
    model: 'test',
    keyFile,
    fetchImpl: async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError('malformed');
      },
    }),
  });
  await assert.rejects(malformed.generate('Hello', { signal: new AbortController().signal }));
});

test('API mode accepts its configured environment token without requiring a key file', async () => {
  const provider = createOpenAiApiProvider({
    model: 'test',
    key: 'test-only-env-token',
    keyFile: '/nonexistent',
    fetchImpl: async (_url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer test-only-env-token');
      return Response.json({
        status: 'completed',
        output: [{ type: 'message', content: [{ type: 'output_text', text: 'OK' }] }],
      });
    },
  });
  assert.equal(
    (await provider.generate('Hello', { signal: new AbortController().signal })).text,
    'OK',
  );
});
