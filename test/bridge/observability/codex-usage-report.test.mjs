import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveCodexUsageReport } from '../../../src/bridge/observability/codex-usage-report.mjs';

test('usage reports keep exact turn tokens separate from tool character counts', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'codex-usage-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const events = [
    { type: 'thread.started', thread_id: 'thread-1' },
    { type: 'item.completed', item: {
      id: 'call-1', type: 'mcp_tool_call', server: 'linear', tool: 'list_issues',
      arguments: { label: 'agent-planned' }, result: 'secret issue data',
    } },
    { type: 'turn.completed', usage: {
      input_tokens: 169027, cached_input_tokens: 129536, output_tokens: 519,
    } },
  ];
  const jsonl = events.map(JSON.stringify).join('\n');
  const summaryPath = await saveCodexUsageReport(directory, jsonl, {
    traceId: 'a'.repeat(32), phase: 'next', requestId: 'run-next-1',
    model: 'test-model', prompt: 'Execute /next',
  });
  const summaryText = readFileSync(summaryPath, 'utf8');
  const summary = JSON.parse(summaryText);
  assert.deepEqual(summary.usage, events[2].usage);
  assert.equal(summary.phase, 'next');
  assert.equal(summary.items[0].tool, 'linear/list_issues');
  assert.equal(summary.items[0].outputCharacters, 'secret issue data'.length);
  assert.equal(summary.jsonlBytes, Buffer.byteLength(jsonl));
  assert.doesNotMatch(summaryText, /secret issue data/);
  assert.equal(readFileSync(summaryPath.replace('.summary.json', '.jsonl'), 'utf8'), jsonl);
  assert.equal(statSync(summaryPath).mode & 0o777, 0o600);
});
