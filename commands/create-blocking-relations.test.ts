import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlockingRelations } from './create-blocking-relations.ts';

test('Linear creates blocked-by relations with created child references', () => {
  const calls: string[][] = [];
  const result = createBlockingRelations('linear', { blocked_item_ref: 'ICY-202',
    blocking_item_refs: ['ICY-200', 'ICY-201'] }, (_program, args) => {
    calls.push(args);
    return '';
  });
  assert.deepEqual(calls, [
    ['issue', 'relation', 'add', 'ICY-202', 'blocked-by', 'ICY-200', '--no-input'],
    ['issue', 'relation', 'add', 'ICY-202', 'blocked-by', 'ICY-201', '--no-input'],
  ]);
  assert.equal(result.status, 'created');
  assert.deepEqual(result.created, ['ICY-200', 'ICY-201']);
});

test('ClickUp records one failed relation and continues feasible edges', () => {
  const result = createBlockingRelations('clickup', { blocked_item_ref: 'child-3',
    blocking_item_refs: ['child-1', 'child-2'] }, (_program, args) => {
    if (args[4] === 'child-1') throw new Error('relation failed');
    return '{}';
  });
  assert.equal(result.status, 'partially-failed');
  assert.deepEqual(result.created, ['child-2']);
  assert.deepEqual(result.failed, [{ blocking_item_ref: 'child-1', reason: 'relation failed' }]);
});
