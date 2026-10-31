import assert from 'node:assert/strict';
import test from 'node:test';
import { applyItemLabel } from './apply-item-label.ts';

test('Linear reuses an existing workspace label before adding it to the item', () => {
  const calls: string[][] = [];
  const result = applyItemLabel('linear', { item_id: 'ICY-134', label: 'agent-inspected' },
    (program, args) => {
      calls.push([program, ...args]);
      if (args.includes('api')) {
        return JSON.stringify({ data: { issue: { team: { id: 'team-icy' } }, issueLabels: { nodes: [
          { id: 'label-1', name: 'agent-inspected' },
        ], pageInfo: { hasNextPage: false, endCursor: null } } } });
      }
      return '';
    });
  assert.equal(result.applied, true);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], ['linear', 'issue', 'update', 'ICY-134',
    '--add-label', 'agent-inspected', '--no-input']);
});

test('Linear reuses an existing team label instead of trying to create a duplicate', () => {
  const calls: string[][] = [];
  const result = applyItemLabel('linear', { item_id: 'ICY-135', label: 'agent-planned' },
    (program, args, input) => {
      calls.push([program, ...args]);
      if (input?.includes('query FindLabel')) {
        if (input.includes('team: {null: true}')) {
          return JSON.stringify({ data: { issueLabels: { nodes: [],
            pageInfo: { hasNextPage: false, endCursor: null } } } });
        }
        return JSON.stringify({ data: { issue: { team: { id: 'team-icy' } },
          issueLabels: { nodes: [{ id: 'label-1', name: 'agent-planned',
            team: { id: 'team-icy' } }],
            pageInfo: { hasNextPage: false, endCursor: null } } } });
      }
      if (input?.includes('mutation CreateLabel')) {
        throw new Error('duplicate label name');
      }
      return '';
    });
  assert.equal(result.applied, true);
  assert.equal(calls.at(-1)?.[1], 'issue');
  assert.equal(calls.some((call) => call.includes('CreateLabel')), false);
});

test('Linear creates a missing workspace label before adding it', () => {
  const calls: string[][] = [];
  const result = applyItemLabel('linear', { item_id: 'ICY-134', label: 'agent-inspected' },
    (program, args, input) => {
      calls.push([program, ...args]);
      if (input?.includes('query FindLabel')) {
        return JSON.stringify({ data: { issue: { team: { id: 'team-icy' } }, issueLabels: { nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null } } } });
      }
      if (input?.includes('mutation CreateLabel')) {
        return JSON.stringify({ data: { issueLabelCreate: { success: true,
          issueLabel: { id: 'label-2', name: 'agent-inspected' } } } });
      }
      return '';
    });
  assert.equal(result.applied, true);
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[2]!.slice(0, 4), ['linear', 'issue', 'update', 'ICY-134']);
});

test('Linear stops before item update when label creation is unconfirmed', () => {
  const calls: string[][] = [];
  assert.throws(() => applyItemLabel('linear',
    { item_id: 'ICY-134', label: 'agent-inspected' }, (program, args, input) => {
      calls.push([program, ...args]);
      return input?.includes('query FindLabel')
        ? JSON.stringify({ data: { issue: { team: { id: 'team-icy' } }, issueLabels: { nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null } } } })
        : JSON.stringify({ data: { issueLabelCreate: { success: false } } });
    }), /not confirmed/);
  assert.equal(calls.length, 2);
});

test('ClickUp adds an existing tag and classifies a missing tag', () => {
  const input = { item_id: 'task-1', label: 'agent-inspected' };
  const success = applyItemLabel('clickup', input, (_program, args) => {
    assert.deepEqual(args, ['task', 'add-tag', 'task-1', 'agent-inspected',
      '--output', 'json']);
    return JSON.stringify({ success: true });
  });
  assert.equal(success.applied, true);
  const missing = applyItemLabel('clickup', input, () => {
    throw new Error('Tag not found');
  });
  assert.deepEqual(missing, { status: 'failed', applied: false, reason: 'label_missing' });
});
