import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';
import type { WorkItem } from './read-item.ts';
import { classifyPickItem } from './classify-pick-item.ts';

const item: WorkItem = {
  id: 'uuid', identifier: 'ICY-143', title: 'Refactor `/pick`',
  description: 'Update the workflow.', url: 'https://linear.app/icy/issue/ICY-143',
  status: { name: 'Backlog' }, closed: false, destination: { team: 'ICY' },
  labels: ['agent-shaped'], comments: [], request_backlinks: [],
  attachments: [], linked_resources: [], relations: 'No relations',
};

test('pick eligibility gives closed and unavailable openness precedence', () => {
  assert.deepEqual(classifyPickItem({ ...item, closed: true,
    labels: ['agent-planned'] }), { status: 'ineligible', reason: 'closed',
    item: { ...item, closed: true, labels: ['agent-planned'] } });
  assert.deepEqual(classifyPickItem({ ...item, closed: null }), {
    status: 'ineligible', reason: 'openness_unavailable',
    item: { ...item, closed: null },
  });
});

test('pick eligibility recognizes planned, shaped, and unshaped open items', () => {
  assert.equal(classifyPickItem({ ...item,
    labels: ['agent-shaped', 'agent-planned'] }).status, 'already_planned');
  assert.equal(classifyPickItem(item).status, 'eligible');
  assert.deepEqual(classifyPickItem({ ...item, labels: [] }), {
    status: 'ineligible', reason: 'missing_agent_shaped',
    item: { ...item, labels: [] },
  });
  assert.equal(classifyPickItem(item).item, item);
});

test('pick eligibility CLI classifies supplied official context without resolving it', () => {
  const command = join(import.meta.dirname, 'classify-pick-item.ts');
  const run = spawnSync(process.execPath, [command], {
    input: JSON.stringify(item), encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.status, 'eligible');
  assert.deepEqual(result.item, item);
});
