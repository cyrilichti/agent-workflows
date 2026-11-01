import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Exercise the deployed expression rather than a second implementation.
// Requires jq, which provides the same filter language as Kestra's jq filter.
const workflow = readFileSync(new URL('./work.yaml', import.meta.url), 'utf8');
const expression = /- id: is-success\n[\s\S]*?value: >-\n\s*\{\{ fromJson\(outputs\['work'\]\.body\)\.text \| toJson \| jq\('([\s\S]*?)'\) \| first \}\}/.exec(workflow)?.[1];
assert.ok(expression, 'The is-success jq expression must be present');

function classify(text: unknown): string {
  const result = spawnSync('jq', ['-r', expression!], {
    input: JSON.stringify(text), encoding: 'utf8',
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function response(inspection: string, label: string): string {
  return `## Inspect result

**Request github/cyrilichti/agent-workflows#187:** ${inspection}
**Item ICY-142:** ${label}`;
}

for (const inspection of ['inspection published', 'inspection completed without findings']) {
  const canonical = response(inspection, 'agent-inspected applied');
  for (const [format, text] of [
    ['canonical', canonical],
    ['escaped Markdown and literal newlines', canonical.replace(/[*#]/g, '\\$&').replace(/\n/g, '\\n')],
    ['flattened', canonical.replace(/\s+/g, ' ')],
    ['tabs and line breaks inside statuses', canonical.replace(/ /g, '\t\n')],
    ['inline code', `\`${inspection}\` and \`agent-inspected applied\``],
    ['different item identity', canonical.replace('ICY-142', 'another-item-id')],
    ['reordered fields', `agent-inspected applied; ${inspection}`],
  ]) {
    test(`${format}: ${inspection} succeeds`, () => {
      assert.equal(classify(text), 'success');
    });
  }
}

const inspectionStatuses = [
  'inspection published', 'inspection completed without findings',
  'inspection incomplete', 'inspection failed', 'inspection not attempted', 'unobserved',
];
const labelStatuses = ['agent-inspected applied', 'agent-inspected not applied', 'unobserved'];
for (const inspection of inspectionStatuses) {
  for (const label of labelStatuses) {
    const expected = inspectionStatuses.indexOf(inspection) < 2 && label === labelStatuses[0]
      ? 'success' : 'partial';
    test(`${inspection} with ${label} routes to ${expected}`, () => {
      assert.equal(classify(response(inspection, label)), expected);
    });
  }
}

test('compact unobserved fields tolerate absent spaces after colons', () => {
  assert.equal(classify(response('unobserved', 'unobserved').replace(/:\*\* /g, ':**')), 'partial');
});

test('repeated identical statuses remain consistent', () => {
  const text = response('inspection published', 'agent-inspected applied');
  assert.equal(classify(`${text}\n${text}`), 'success');
});

for (const [name, text] of [
  ['no inspection result', 'Implementation complete. Tests passed.'],
  ['missing inspection status', 'agent-inspected applied'],
  ['missing label status', 'inspection published'],
  ['unknown inspection status', response('inspection postponed', 'agent-inspected applied')],
  ['unknown label status', response('inspection published', 'agent-inspected pending')],
  ['unknown multiword inspection status', response('inspection completed with findings', 'agent-inspected applied')],
  ['conflicting inspection statuses', response('inspection published; inspection failed', 'agent-inspected applied')],
  ['conflicting success statuses', response('inspection published; inspection completed without findings', 'agent-inspected applied')],
  ['conflicting label statuses', response('inspection published', 'agent-inspected applied; agent-inspected not applied')],
  ['unobserved and published inspection', `${response('unobserved', 'agent-inspected applied')} inspection published`],
  ['unobserved and applied label', `${response('inspection published', 'unobserved')} agent-inspected applied`],
  ['unknown and recognized inspection', response('inspection published; inspection postponed', 'agent-inspected applied')],
  ['unknown and recognized label', response('inspection published', 'agent-inspected applied; agent-inspected pending')],
] as const) {
  test(`${name} routes to error`, () => {
    assert.equal(classify(text), 'error');
  });
}

for (const text of [null, {}, [], 42]) {
  test(`nontext response ${JSON.stringify(text)} routes to error`, () => {
    assert.equal(classify(text), 'error');
  });
}
