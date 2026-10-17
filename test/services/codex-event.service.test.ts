import test from 'node:test';
import assert from 'node:assert/strict';
import { CodexEventService } from '../../src/services/codex-event.service.ts';

test('in-memory summary keeps exact turn tokens separate from tool character counts', () => {
  const events = [
    { type: 'thread.started', thread_id: 'thread-1' },
    { type: 'item.completed', item: {
      id: 'call-1', type: 'mcp_tool_call', server: 'linear', tool: 'list_issues',
      arguments: { label: 'agent-planned' }, result: 'secret issue data',
    } },
    { type: 'item.completed', item: {
      id: 'call-2', type: 'command_execution', command: "/bin/zsh -lc 'cat secret-file'",
      aggregated_output: 'secret contents', exit_code: 0,
    } },
    { type: 'turn.completed', usage: {
      input_tokens: 169027, cached_input_tokens: 129536, output_tokens: 519,
    } },
  ];
  const jsonl = events.map((event) => JSON.stringify(event)).join('\n');
  const summary = new CodexEventService().summarize(jsonl, {
    traceId: 'a'.repeat(32), phase: 'next', requestId: 'run-next-1',
    model: 'test-model', prompt: 'Execute /next',
  });
  const summaryText = JSON.stringify(summary);
  assert.equal(summary.schemaVersion, 2);
  assert.deepEqual(summary.usage, events[3]?.usage);
  assert.equal(summary.phase, 'next');
  assert.equal(summary.items[0]?.tool, 'linear/list_issues');
  assert.equal(summary.items[0]?.outputCharacters, 'secret issue data'.length);
  assert.equal(summary.items[1]?.commandName, 'cat');
  assert.equal(summary.items[1]?.exitCode, 0);
  assert.equal(summary.items[1]?.outputCharacters, 'secret contents'.length);
  assert.equal(summary.jsonlBytes, Buffer.byteLength(jsonl));
  assert.doesNotMatch(summaryText, /secret issue data/);
  assert.doesNotMatch(summaryText, /secret-file|secret contents/);
});

test('invalid Codex event fields are counted as malformed and rejected as output', () => {
  const events = new CodexEventService();
  const invalid = JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 'ten', output_tokens: 1 } });
  const summary = events.summarize(invalid, { model: 'test', prompt: 'Say OK' });
  assert.equal(summary.malformedLines, 1);
  assert.equal(summary.usage, null);
  assert.throws(() => events.parseTurnResult(invalid, 'test'), { code: 'invalid_output' });
});
