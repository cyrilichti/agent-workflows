import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const flow = readFileSync(new URL('../orchestration/work.yaml', import.meta.url), 'utf8');
const classify = flow.slice(flow.indexOf('- id: is-success'));
function classifyResponse(input: unknown): unknown {
  const filter = classify.match(/jq\('([\s\S]*?)'\)/)?.[1];
  assert.ok(filter);
  return JSON.parse(execFileSync('jq', ['-c', filter], { input: JSON.stringify(input), encoding: 'utf8' }));
}
const response = (text: unknown, code = 200) => ({ code, body: JSON.stringify({ text }) });

test('flow classifies success, partial, invalid responses and HTTP failures', () => {
  for (const text of ['inspection published; agent-inspected applied',
    '**inspection completed without findings**; `agent-inspected applied`']) {
    assert.equal(classifyResponse(response(text)), 'success');
  }
  assert.equal(classifyResponse(response('inspection incomplete; agent-inspected not applied')), 'partial');
  for (const text of [null, {}, 'unknown', 'inspection published; inspection failed; agent-inspected applied']) {
    assert.equal(classifyResponse(response(text)), 'error');
  }
  assert.equal(classifyResponse({ code: 200, body: 'invalid JSON' }), 'error');
  for (const code of [400, 502, 504]) {
    assert.equal(classifyResponse(response('inspection published; agent-inspected applied', code)), 'error');
  }
});

test('work publishes one comment before classifying its result, then sleeps', () => {
  assert.match(flow, /- id: work\s+type: io\.kestra\.plugin\.core\.http\.Request[\s\S]*?allowFailed: true[\s\S]*?- id: notify-work\s+type: io\.kestra\.plugin\.core\.http\.Request[\s\S]*?- id: is-success/);
  assert.doesNotMatch(flow, /- id: work-call|- id: work-output|- id: report-work-/);
  const notification = flow.slice(flow.indexOf('- id: notify-work'), flow.indexOf('- id: is-success'));
  assert.match(notification, /"path": inputs.commandsDirectory ~ "\/publish-work-result.ts"/);
  assert.match(notification, /fromJson\(fromJson\(outputs.next.body\).stdout\).id/);
  assert.match(notification, /outputs\.work\.body, execution\.id\]/);
  assert.equal((flow.match(/- id: notify-work/g) ?? []).length, 1);
  assert.match(flow, /\n      - id: sleep\s+type: io\.kestra\.plugin\.core\.flow\.Sleep/);
});
