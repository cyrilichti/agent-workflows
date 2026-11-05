import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COMMENT_LIMIT, formatWorkResult, publishWorkResult, type WorkResult } from './publish-work-result.ts';

const input: WorkResult = { item_id: 'exact-item-uuid', outcome: 'success',
  output: 'inspection published; agent-inspected applied', execution_id: 'kestra-execution-123' };
for (const provider of ['linear', 'clickup'] as const) {
  for (const outcome of ['success', 'partial', 'error'] as const) {
    test(`${provider} verifies ${outcome} comment creation with exact item and execution`, () => {
      let mutations = 0;
      const result = publishWorkResult(provider, { ...input, outcome }, (program, args, body) => {
        if (args.includes('api')) {
          assert.equal(program, 'linear');
          assert.ok(args.includes(JSON.stringify({ itemId: input.item_id })));
          return '{"data":{"issue":{"identifier":"ICY-163"}}}';
        }
        mutations++;
        const comment = provider === 'linear' ? body! : args[5]!;
        assert.match(comment, new RegExp(`Work result: ${outcome}`));
        assert.ok(comment.includes(input.item_id));
        assert.ok(comment.includes(input.execution_id));
        assert.ok(comment.includes(input.output));
        if (provider === 'linear') {
          assert.deepEqual(args, ['issue', 'comment', 'add', 'ICY-163', '--body-file', '-', '--yes', '--no-input']);
          return '✓ Added comment to issue ICY-163\nhttps://linear.app/test/issue/ICY-163/x#comment-created';
        }
        assert.equal(program, 'clickup-cli');
        assert.deepEqual(args.slice(0, 5), ['comment', 'create', '--task', input.item_id, '--text']);
        return '[{"id":"created"}]';
      });
      assert.equal(result.published, true);
      assert.equal(result.outcome, outcome);
      assert.equal(mutations, 1);
    });
  }
}

test('comments bound Unicode output and retain final diagnostics plus execution identity', () => {
  const output = 'Start diagnosis\n' + '🙂'.repeat(20000) + '\nFinal root cause: timeout';
  const comment = formatWorkResult({ ...input, outcome: 'error', output });
  assert.equal(Array.from(comment).length, COMMENT_LIMIT);
  assert.match(comment, /Output truncated/);
  assert.match(comment, /Start diagnosis/);
  assert.ok(comment.endsWith('Final root cause: timeout'));
  assert.ok(comment.includes(input.execution_id));
  assert.doesNotMatch(comment, /\uFFFD/);
  assert.ok(formatWorkResult({ ...input, output: '' }).endsWith('No textual response received.'));
});

test('unconfirmed comments, failed provider responses, and CLI failures are rejected', () => {
  for (const response of ['{}', '[]', '[{"id":"a"},{"id":"b"}]', '{"id":"created","success":false}', 'not json']) {
    assert.throws(() => publishWorkResult('clickup', input, () => response));
  }
  for (const response of ['Added comment', 'https://linear.app/test#comment-created', '']) {
    assert.throws(() => publishWorkResult('linear', input, (_p, args) => args.includes('api')
      ? '{"data":{"issue":{"identifier":"ICY-163"}}}' : response), /identify/);
  }
  assert.throws(() => publishWorkResult('linear', input, () => '{"data":{"issue":null}}'), /identifier/);
  assert.throws(() => publishWorkResult('clickup', input, () => { throw Error('provider unavailable'); }), /provider unavailable/);
});

test('invalid input fails before mutating the item', () => {
  for (const value of [{ item_id: '' }, { execution_id: ' ' }, { outcome: 'unknown' }, { output: null }]) {
    assert.throws(() => publishWorkResult('clickup', { ...input, ...value } as WorkResult,
      () => assert.fail('No mutation expected')));
  }
});

for (const directory of ['commands', '.agents/commands']) {
  test(`CLI uses configured provider from ${directory} and returns failure exit codes`, t => {
    const root = mkdtempSync(join(tmpdir(), 'work-report-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const commands = join(root, directory);
    const bin = join(root, 'bin');
    mkdirSync(commands, { recursive: true }); mkdirSync(bin);
    for (const file of ['publish-work-result.ts', 'publish-item-comment.ts', 'resolve-item-provider.ts']) {
      copyFileSync(new URL(file, import.meta.url), join(commands, file));
    }
    const receipt = join(root, 'comment.txt');
    writeFileSync(join(bin, 'clickup-cli'), '#!/bin/sh\nprintf "%s" "$6" > "$COMMENT_RECEIPT"\nprintf \'{"id":"new-comment"}\'\n', { mode: 0o755 });
    writeFileSync(join(root, 'agent-workflows.yaml'), 'item:\n  provider: clickup\n');
    const args = [join(commands, 'publish-work-result.ts'), input.item_id, input.outcome, input.output, input.execution_id];
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, COMMENT_RECEIPT: receipt };
    const result = JSON.parse(execFileSync(process.execPath, args, { cwd: tmpdir(), env, encoding: 'utf8' }));
    assert.equal(result.comment_id, 'new-comment');
    assert.ok(readFileSync(receipt, 'utf8').includes(input.execution_id));
    writeFileSync(join(root, 'agent-workflows.yaml'), 'item:\n  provider: unsupported\n');
    const failed = spawnSync(process.execPath, args, { env, encoding: 'utf8' });
    assert.equal(failed.status, 1);
    assert.equal(JSON.parse(failed.stdout).stage, 'resolve_item_provider');
    writeFileSync(join(root, 'agent-workflows.yaml'), 'item:\n  provider: clickup\n');
    writeFileSync(join(bin, 'clickup-cli'), '#!/bin/sh\nprintf \'{}\'\n', { mode: 0o755 });
    const unconfirmed = spawnSync(process.execPath, args, { env, encoding: 'utf8' });
    assert.equal(unconfirmed.status, 1);
    assert.equal(JSON.parse(unconfirmed.stdout).published, false);
  });
}
