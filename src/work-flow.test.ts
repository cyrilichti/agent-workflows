import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const flow = readFileSync(new URL('../orchestration/work.yaml', import.meta.url), 'utf8');
const classify = flow.slice(flow.indexOf('- id: is-success'));
const output = flow.slice(flow.indexOf('- id: work-output'), flow.indexOf('                        errors:', flow.indexOf('- id: work-output')));
function jq(section: string, input: unknown): unknown {
  const filter = section.match(/jq\('([\s\S]*?)'\)/)?.[1];
  assert.ok(filter);
  return JSON.parse(execFileSync('jq', ['-c', filter], { input: JSON.stringify(input), encoding: 'utf8' }));
}
const response = (text: unknown, code = 200) => ({ code, body: JSON.stringify({ text }) });

test('flow classifies success, partial, invalid responses and HTTP failures', () => {
  for (const text of ['inspection published; agent-inspected applied',
    '**inspection completed without findings**; `agent-inspected applied`']) {
    assert.equal(jq(classify, response(text)), 'success');
  }
  assert.equal(jq(classify, response('inspection incomplete; agent-inspected not applied')), 'partial');
  for (const text of [null, {}, 'unknown', 'inspection published; inspection failed; agent-inspected applied']) {
    assert.equal(jq(classify, response(text)), 'error');
  }
  assert.equal(jq(classify, { code: 200, body: 'invalid JSON' }), 'error');
  for (const code of [400, 502, 504]) {
    assert.equal(jq(classify, response('inspection published; agent-inspected applied', code)), 'error');
  }
});

test('flow bounds script arguments, removes NULs, and retains final diagnostics', () => {
  const text = 'Start\n' + '🙂'.repeat(30000) + '\nFinal root cause';
  const result = jq(output, JSON.stringify({ text })) as string;
  assert.match(result, /truncated/);
  assert.ok(result.startsWith('Start'));
  assert.ok(result.endsWith('Final root cause'));
  assert.ok(Array.from(result).length <= 12000);
  assert.equal(jq(output, JSON.stringify({ text: 'before\0after' })), 'beforeafter');
  assert.equal(jq(output, 'broken response'), 'broken response');
});

test('every branch publishes exact selected identity and execution before its terminal task', () => {
  for (const [outcome, terminal] of [['error', 'work-error'], ['partial', 'work-partial'], ['success', 'work-sucess']]) {
    const section = classify.slice(classify.indexOf(`- id: report-work-${outcome}\n`), classify.indexOf(`- id: ${terminal}\n`));
    assert.match(section, /type: io\.kestra\.plugin\.core\.flow\.AllowFailure/);
    assert.match(section, /"path": inputs.commandsDirectory ~ "\/publish-work-result.ts"/);
    assert.match(section, /fromJson\(fromJson\(outputs.next.body\).stdout\).id/);
    assert.ok(section.includes(`"${outcome}", outputs['work-output'].value, execution.id]`));
    assert.match(section, /type: io\.kestra\.plugin\.core\.execution\.Assert/);
    assert.match(section, /errors:[\s\S]*level: ERROR/);
    assert.ok(section.includes(`original outcome ${outcome} is retained`));
    for (const stdout of ['{}', '{"status":"published","published":false}', '{"status":"published","published":true}']) {
      assert.equal(jq(section, JSON.stringify({ stdout })), 0);
    }
    assert.equal(jq(section, JSON.stringify({ stdout: '{"status":"published","published":true,"comment_id":"new"}' })), 1);
    assert.equal(jq(section, 'invalid'), 0);
  }
});

test('transport errors and task timeouts report through the request error handler and preserve the delay', () => {
  const call = flow.slice(flow.indexOf('- id: work-call'), flow.indexOf('- id: is-success'));
  assert.match(call, /type: io\.kestra\.plugin\.core\.flow\.Sequential/);
  assert.match(call, /allowFailed: true/);
  assert.match(call, /timeout: PT1H/);
  assert.match(call, /errors:\s+- id: report-work-transport-error/);
  assert.match(call, /"error", "The \/work HTTP request failed or timed out/);
  assert.match(call, /execution.id\]/);
  assert.match(call, /fromJson\(fromJson\(outputs.next.body\).stdout\).id/);
  assert.match(call, /level: ERROR/);
  assert.match(flow, /id: start\s+type: io\.kestra\.plugin\.core\.flow\.AllowFailure/);
  assert.match(flow, /\n      - id: sleep\s+type: io\.kestra\.plugin\.core\.flow\.Sleep/);
});
