import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectResultSchema, presentInspectResult } from '../../../src/bridge/execution/inspect-result.mjs';

const inspected = {
  requestId: 'GitHub/cyrilichti/agent-workflows#113',
  requestUrl: 'https://github.com/cyrilichti/agent-workflows/pull/113',
  inspectionStatus: 'published',
  itemId: 'ICY-108',
  itemUrl: 'https://linear.app/icyril/issue/ICY-108',
  labelStatus: 'applied',
  details: 'Le label est appliqué. La PR reste ouverte.',
};

test('both successful inspection states render fixed markers with localized explanations', () => {
  for (const [inspectionStatus, marker] of [
    ['published', 'inspection published'],
    ['completed_without_findings', 'inspection completed without findings'],
  ]) {
    const result = presentInspectResult(JSON.stringify({ ...inspected, inspectionStatus }), 'ICY-108');
    assert.equal(result.deliveryResult.outcome, 'success');
    assert.equal(result.text, `## Inspect result\n\n**Request [GitHub/cyrilichti/agent-workflows#113](${inspected.requestUrl}):** ${marker}\n**Item [ICY-108](${inspected.itemUrl}):** agent-inspected applied\n\n${inspected.details}`);
    assert.ok(!Object.hasOwn(result.deliveryResult, 'details'));
  }
});

test('every unsuccessful inspection or label combination remains partial despite success prose', () => {
  const schema = inspectResultSchema('ICY-108');
  for (const inspectionStatus of schema.properties.inspectionStatus.enum) {
    for (const labelStatus of schema.properties.labelStatus.enum) {
      const result = presentInspectResult(JSON.stringify({
        ...inspected, inspectionStatus, labelStatus,
        details: 'inspection published — agent-inspected applied — SUCCESS',
      }), 'ICY-108');
      const successful = ['published', 'completed_without_findings'].includes(inspectionStatus)
        && labelStatus === 'applied';
      assert.equal(result.deliveryResult.outcome, successful ? 'success' : 'partial');
    }
  }
});

test('unresolved request on an early stop produces a readable partial outcome', () => {
  const result = presentInspectResult(JSON.stringify({
    ...inspected, requestId: null, requestUrl: null, itemUrl: null,
    inspectionStatus: 'not_attempted', labelStatus: 'not_applied', details: '',
  }), 'ICY-108');
  assert.equal(result.deliveryResult.outcome, 'partial');
  assert.match(result.text, /\*\*Request Unavailable:\*\* inspection not attempted/);
});

test('invalid, incomplete, translated or wrong-item responses never become delivery success', () => {
  const { labelStatus: _label, ...incomplete } = inspected;
  for (const response of [
    'Work completed successfully', '```json\n{}\n```', 'null', '[]',
    JSON.stringify(incomplete),
    JSON.stringify({ ...inspected, itemId: 'ICY-999' }),
    JSON.stringify({ ...inspected, labelStatus: 'appliqué' }),
    JSON.stringify({ ...inspected, inspectionStatus: 'success' }),
    JSON.stringify({ ...inspected, outcome: 'success' }),
    JSON.stringify({ ...inspected, details: false }),
    JSON.stringify({ ...inspected, requestId: null }),
    JSON.stringify({ ...inspected, requestId: '   ' }),
    JSON.stringify({ ...inspected, requestUrl: null }),
    JSON.stringify({ ...inspected, itemUrl: null }),
    JSON.stringify({ ...inspected, requestUrl: 'javascript:alert(1)' }),
  ]) assert.throws(() => presentInspectResult(response, 'ICY-108'), { code: 'invalid_output' });
});

test('schema binds the selected item and renderer preserves valid Markdown links', () => {
  assert.deepEqual(inspectResultSchema('ICY-108').properties.itemId.enum, ['ICY-108']);
  const result = presentInspectResult(JSON.stringify({
    ...inspected, requestUrl: 'https://example.test/request(a)',
  }), 'ICY-108');
  assert.match(result.text, /https:\/\/example.test\/request%28a%29/);
});
