import assert from 'node:assert/strict';
import test from 'node:test';
import { saveItem } from './save-item.ts';

test('Linear create sends only confirmed fields and selected destination', () => {
  const calls: Array<{ program: string; args: string[]; input: string | undefined }> = [];
  const saved = saveItem('linear', { mode: 'create', title: 'Clarify write',
    body: 'Free-form body', destination: { team: 'team-1', project: 'project-2' } },
  (program, args, input) => {
    calls.push({ program, args, input });
    return JSON.stringify({ data: { issueCreate: { success: true, issue: {
      id: 'uuid', identifier: 'ICY-200', title: 'Clarify write',
      url: 'https://linear.app/icy/issue/ICY-200', state: { name: 'Backlog' },
    } } } });
  });
  assert.equal(saved.item_id, 'uuid');
  assert.equal(calls[0]?.program, 'linear');
  assert.deepEqual(JSON.parse(calls[0]!.args[2]!), { payload: {
    teamId: 'team-1', projectId: 'project-2', title: 'Clarify write',
    description: 'Free-form body', useDefaultTemplate: false,
  } });
  assert.match(calls[0]!.input!, /issueCreate/);
});

test('Linear update stops when mutation is not confirmed', () => {
  assert.throws(() => saveItem('linear', { mode: 'update', item_id: 'ICY-200',
    title: 'Changed', body: 'Body' }, () => JSON.stringify({ data: {
    issueUpdate: { success: false },
  } })), /did not confirm/);
});

test('ClickUp create preserves a literal leading @ in the body', () => {
  const result = saveItem('clickup', { mode: 'create', title: 'Task',
    body: '@literal', destination: 'list-1' }, (_program, args) => {
    assert.deepEqual(args, ['task', 'create', '--list', 'list-1', '--name',
      'Task', '--description', '@@literal', '--output', 'json']);
    return JSON.stringify([{ id: 'task-1', name: 'Task', url: 'https://app.clickup.com/t/task-1' }]);
  });
  assert.equal(result.item_id, 'task-1');
});

test('Linear child create preserves the parent and returns a CLI reference', () => {
  const result = saveItem('linear', { mode: 'create', title: 'Child', body: 'Body',
    destination: { team: 'team-1' }, parent_item_id: 'parent-uuid' },
  (_program, args) => {
    const variables = JSON.parse(args[2]!) as { payload: Record<string, unknown> };
    assert.deepEqual(variables.payload, { teamId: 'team-1', parentId: 'parent-uuid',
      title: 'Child', description: 'Body', useDefaultTemplate: false });
    return JSON.stringify({ data: { issueCreate: { success: true, issue: {
      id: 'child-uuid', identifier: 'ICY-201', title: 'Child', url: 'https://linear.app/icy/issue/ICY-201',
    } } } });
  });
  assert.equal(result.item_id, 'child-uuid');
  assert.equal(result.item_reference, 'ICY-201');
});

test('ClickUp child create includes the parent task', () => {
  const result = saveItem('clickup', { mode: 'create', title: 'Child', body: 'Body',
    destination: 'list-1', parent_item_id: 'parent-1' }, (_program, args) => {
    assert.deepEqual(args, ['task', 'create', '--list', 'list-1', '--parent', 'parent-1',
      '--name', 'Child', '--description', 'Body', '--output', 'json']);
    return JSON.stringify([{ id: 'child-1', name: 'Child' }]);
  });
  assert.equal(result.item_reference, 'child-1');
});
