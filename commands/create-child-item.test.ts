import assert from 'node:assert/strict';
import test from 'node:test';
import { createChildItem } from './create-child-item.ts';

test('Linear child creation derives team, project, and parent from the official item', () => {
  const result = createChildItem('linear', { parent_item: {
    id: 'parent-uuid', destination: { team: { id: 'team-1' }, project: { id: 'project-2' } },
  }, child: { title: 'Child', body: 'Body' } }, (_program, args) => {
    assert.deepEqual(JSON.parse(args[2]!), { payload: { teamId: 'team-1',
      projectId: 'project-2', parentId: 'parent-uuid', title: 'Child',
      description: 'Body', useDefaultTemplate: false } });
    return JSON.stringify({ data: { issueCreate: { success: true, issue: {
      id: 'child-uuid', identifier: 'ICY-201', title: 'Child',
    } } } });
  });
  assert.equal(result.item_reference, 'ICY-201');
});

test('ClickUp child creation derives List and parent from the official item', () => {
  const result = createChildItem('clickup', { parent_item: {
    id: 'parent-1', destination: { list: { id: 'list-1' } },
  }, child: { title: 'Child', body: 'Body' } }, (_program, args) => {
    assert.deepEqual(args, ['task', 'create', '--list', 'list-1', '--parent',
      'parent-1', '--name', 'Child', '--description', 'Body', '--output', 'json']);
    return JSON.stringify([{ id: 'child-1', name: 'Child' }]);
  });
  assert.equal(result.item_id, 'child-1');
});

test('Child creation stops before mutation when the parent destination is incomplete', () => {
  let called = false;
  assert.throws(() => createChildItem('linear', { parent_item: {
    id: 'parent-uuid', destination: {},
  }, child: { title: 'Child', body: 'Body' } }, () => {
    called = true;
    return '';
  }), /team and project/);
  assert.equal(called, false);
});
