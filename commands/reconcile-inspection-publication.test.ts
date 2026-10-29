import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileInspectionPublication } from './reconcile-inspection-publication.ts';
import type { Finding } from './reconcile-inspection-publication.ts';

const finding = (id: string, source_review?: string): Finding => ({
  id, head_sha: 'abc', severity: 'blocking',
  ...(source_review ? { source_review } : {}),
  body: `### Finding ${id}\n\n<!-- agent-workflows-finding id="${id}" head="abc" -->`,
});

test('filters already published findings by marker or human review identity', () => {
  const activity = {
    reviews: [{ id: 1, body: finding('RF-001').body }],
    discussions: [{ id: 'd1', notes: [{ id: 'n2', body: 'Required change' }] }],
  };
  const unseen = reconcileInspectionPublication('abc', [
    finding('RF-001'), finding('RF-002', 'n2'), finding('RF-003'),
  ], activity);
  assert.deepEqual(unseen.map(item => item.id), ['RF-003']);
});

test('rejects findings from another snapshot', () => {
  assert.throws(() => reconcileInspectionPublication('different', [finding('RF-001')], []),
    /frozen review snapshot/);
});
