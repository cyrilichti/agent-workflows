import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCodexArguments,
  parseCodexEvents,
  createCodexCliProvider,
} from '../../../src/bridge/providers/codex-cli-provider.mjs';

const projectRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));

test('Codex events map to common result and usage', () => {
  const events = [
    { type: 'thread.started', thread_id: 'thread-1' },
    { type: 'item.completed', item: { type: 'agent_message', text: 'OK' } },
    {
      type: 'turn.completed',
      usage: { input_tokens: 10, cached_input_tokens: 4, output_tokens: 2 },
    },
  ];
  assert.deepEqual(parseCodexEvents(events.map(JSON.stringify).join('\n'), 'test'), {
    text: 'OK',
    model: 'test',
    requestId: 'thread-1',
    usage: { input: 10, cachedInput: 4, output: 2 },
  });
  assert.throws(() => parseCodexEvents('{"type":"turn.failed"}', 'test'), { code: 'codex_error' });
  assert.throws(() => parseCodexEvents('bad json', 'test'), { code: 'invalid_output' });
});

test('Codex uses an ephemeral task with local configuration and a working directory', () => {
  const directory = '/projects/app with spaces';
  const args = buildCodexArguments(undefined, '', directory);
  assert.equal(args[args.indexOf('-C') + 1], directory);
  assert.ok(args.includes('--ephemeral'));
  assert.ok(args.includes('approval_policy="never"'));
  for (const blocked of [
    '--disable',
    '--ignore-user-config',
    '--sandbox',
    '-m',
    '--dangerously-bypass-approvals-and-sandbox',
  ])
    assert.ok(!args.includes(blocked));
  assert.equal(args.at(-1), '-');
  const defaultArgs = buildCodexArguments(undefined, '');
  assert.equal(defaultArgs[defaultArgs.indexOf('-C') + 1], projectRoot);
  const overridden = buildCodexArguments('selected', 'workspace', directory);
  assert.equal(overridden[overridden.indexOf('-m') + 1], 'selected');
  assert.ok(overridden.includes('forced_chatgpt_workspace_id="workspace"'));
});

test('Codex cancellation terminates the subprocess group', async (t) => {
  const { spawn } = await import('node:child_process');
  const { existsSync } = await import('node:fs');
  const dir = mkdtempSync(`${tmpdir()}/codex-cancel-test-`);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(
    `${dir}/auth.json`,
    JSON.stringify({ tokens: { access_token: 'test-only', account_id: 'wanted' } }),
  );
  const marker = `${dir}/survived`;
  const controller = new AbortController();
  const grandchild = `setTimeout(()=>require('fs').writeFileSync(${JSON.stringify(marker)},'alive'),300)`;
  const script = `const c=require('child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'}); console.log('ready');setInterval(()=>{},1000)`;
  const provider = createCodexCliProvider({
    model: 'test',
    workspace: 'wanted',
    directory: dir,
    spawnImpl: (_file, _args, options) => {
      const child = spawn(process.execPath, ['-e', script], options);
      child.stdout.once('data', () => controller.abort());
      return child;
    },
  });
  await assert.rejects(provider.generate('Hello', { signal: controller.signal }), {
    code: 'timeout',
  });
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert.equal(existsSync(marker), false);
});

test('local CLI uses the same default or explicit directory for -C and cwd', async (t) => {
  const { spawn } = await import('node:child_process');
  const dir = mkdtempSync(`${tmpdir()}/codex-local-`);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const explicitDirectory = `${dir}/project with spaces`;
  mkdirSync(explicitDirectory);
  const environment = {
    PATH: process.env.PATH,
    HOME: dir,
    CODEX_HOME: `${dir}/config`,
    SSH_AUTH_SOCK: '/host/agent',
  };
  for (const directory of [undefined, explicitDirectory]) {
    const expectedDirectory = directory || projectRoot;
    const provider = createCodexCliProvider({
      environment,
      ...(directory ? { directory } : {}),
      executable: '/custom/codex',
      spawnImpl: (file, args, options) => {
        assert.equal(file, '/custom/codex');
        assert.equal(options.cwd, expectedDirectory);
        assert.equal(args[args.indexOf('-C') + 1], expectedDirectory);
        assert.deepEqual(options.env, environment);
        assert.ok(args.includes('--ephemeral'));
        return spawn(
          process.execPath,
          [
            '-e',
            `process.stdin.resume();process.stdin.on('end',()=>{
      console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'OK'}}));
      console.log(JSON.stringify({type:'turn.completed'}));
    })`,
          ],
          options,
        );
      },
    });
    const result = await provider.generate('Hello', { signal: new AbortController().signal });
    assert.equal(result.text, 'OK');
    assert.equal(result.model, 'configured-default');
  }
});

test('Codex provider returns a content-free summary without writing a report', async (t) => {
  const { spawn } = await import('node:child_process');
  const directory = mkdtempSync(`${tmpdir()}/codex-usage-provider-`);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const provider = createCodexCliProvider({
    model: 'test',
    spawnImpl: (_file, _args, options) => spawn(process.execPath, ['-e', `
      process.stdin.resume();
      process.stdin.on('end', () => {
        console.log(JSON.stringify({type:'item.completed',item:{type:'command_execution',command:'cat secret-file',aggregated_output:'secret contents',exit_code:0}}));
        console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'OK'}}));
        console.log(JSON.stringify({type:'turn.completed',usage:{input_tokens:10,cached_input_tokens:4,output_tokens:2}}));
      });
    `], options),
  });
  const result = await provider.generate('Execute /next', {
    signal: new AbortController().signal,
    traceId: 'b'.repeat(32),
  });
  assert.equal(result.codexSummary.usage.input_tokens, 10);
  assert.equal(result.codexSummary.items[0].commandName, 'cat');
  assert.ok(Number.isFinite(Date.parse(result.codexSummary.items[0].completedAt)));
  assert.doesNotMatch(JSON.stringify(result.codexSummary), /secret-file|secret contents/);
  assert.equal((await import('node:fs')).existsSync(`${directory}/reports`), false);
});

test('Codex provider records item completion arrival times in stream order', async () => {
  const { spawn } = await import('node:child_process');
  const provider = createCodexCliProvider({
    spawnImpl: (_file, _args, options) => spawn(process.execPath, ['-e', `
      process.stdin.resume();
      process.stdin.on('end', () => {
        console.log(JSON.stringify({type:'item.completed',item:{id:'one',type:'command_execution',command:'pwd',exit_code:0}}));
        setTimeout(() => {
          console.log(JSON.stringify({type:'item.completed',item:{id:'two',type:'command_execution',command:'cat file',exit_code:0}}));
          console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'OK'}}));
          console.log(JSON.stringify({type:'turn.completed'}));
        }, 25);
      });
    `], options),
  });
  const result = await provider.generate('Execute /next', {
    signal: new AbortController().signal,
    traceId: 'd'.repeat(32),
  });
  const [first, second] = result.codexSummary.items;
  assert.ok(Date.parse(first.completedAt) < Date.parse(second.completedAt));
});

test('failed Codex turns still return observable events with unknown usage', async (t) => {
  const { spawn } = await import('node:child_process');
  const directory = mkdtempSync(`${tmpdir()}/codex-failed-usage-`);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const provider = createCodexCliProvider({
    spawnImpl: (_file, _args, options) => spawn(process.execPath, ['-e', `
      process.stdin.resume();
      process.stdin.on('end', () => console.log(JSON.stringify({type:'turn.failed'})));
    `], options),
  });
  let error;
  try {
    await provider.generate('Execute /next', {
      signal: new AbortController().signal,
      traceId: 'c'.repeat(32),
    });
  } catch (caught) {
    error = caught;
  }
  assert.equal(error.code, 'codex_error');
  assert.equal(error.codexSummary.usage, null);
  assert.equal(error.codexSummary.eventCounts['turn.failed'], 1);
});
