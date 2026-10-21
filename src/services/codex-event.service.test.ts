import test from 'node:test';
import assert from 'node:assert/strict';
import { CodexEventService } from './codex-event.service.ts';

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

test('Codex accepts a null command exit code and structured tool output', () => {
  const events = new CodexEventService();
  const jsonl = [
    { type: 'item.completed', item: { type: 'command_execution', command: 'pwd', exit_code: null } },
    { type: 'item.completed', item: { type: 'mcp_tool_call', server: 'test', tool: 'read', output: { count: 2 } } },
    { type: 'item.completed', item: { type: 'agent_message', text: 'OK' } },
    { type: 'turn.completed', usage: { input_tokens: 10, cached_input_tokens: 4, output_tokens: 2 } },
  ].map((event) => JSON.stringify(event)).join('\n');
  const summary = events.summarize(jsonl, { model: 'test', prompt: 'Say OK' });
  assert.equal(summary.malformedLines, 0);
  assert.equal(summary.items[0]?.exitCode, undefined);
  assert.equal(summary.items[1]?.outputCharacters, JSON.stringify({ count: 2 }).length);
  assert.equal(events.parseTurnResult(jsonl, 'test').text, 'OK');
});

test('malformed auxiliary events do not discard a valid final answer', () => {
  const events = new CodexEventService();
  const jsonl = [
    { type: 'item.completed', item: { type: 'command_execution', exit_code: 'unknown' } },
    { type: 'item.completed', item: { type: 'agent_message', text: 'OK' } },
    { type: 'turn.completed', usage: { input_tokens: 10, output_tokens: 2 } },
  ].map((event) => JSON.stringify(event)).join('\n');
  assert.equal(events.summarize(jsonl, { model: 'test', prompt: 'Say OK' }).malformedLines, 1);
  assert.equal(events.parseTurnResult(jsonl, 'test').text, 'OK');
  const invalidAnswer = jsonl.replace('"text":"OK"', '"text":42');
  assert.throws(() => events.parseTurnResult(invalidAnswer, 'test'), { code: 'invalid_output' });
});
