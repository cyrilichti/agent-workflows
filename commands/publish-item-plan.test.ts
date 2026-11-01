import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPlanComment, publishItemPlan } from './publish-item-plan.ts';

const input = { item_id: 'ICY-137', plan_path: 'plans/approved.plan.md' };
const plan = '# Plan\n\n1. ○ Step\n';

test('Linear publishes the exact authoritative plan and requires a comment link', () => {
  const result = publishItemPlan('linear', input, (program, args, body) => {
    assert.equal(program, 'linear');
    assert.deepEqual(args, ['issue', 'comment', 'add', 'ICY-137', '--body-file', '-',
      '--yes', '--no-input']);
    assert.equal(body, `Agent-Workflows-Approved-Plan:\n\n${plan}`);
    return '✓ Added comment to issue ICY-137\nhttps://linear.app/example/issue/ICY-137/x#comment-abc\n';
  }, () => plan);
  assert.equal(result.published, true);
  assert.match(result.comment_url!, /#comment-abc$/);
  assert.throws(() => publishItemPlan('linear', input, () => '✓ Added comment',
    () => plan), /identify/);
});

test('ClickUp fences exact plan content and requires a created comment ID', () => {
  const content = '# Plan\n\n```ts\ncode\n```\n';
  const result = publishItemPlan('clickup', input, (program, args) => {
    assert.equal(program, 'clickup-cli');
    assert.deepEqual(args.slice(0, 5), ['comment', 'create', '--task', 'ICY-137', '--text']);
    assert.equal(args[5], formatPlanComment('clickup', content));
    assert.match(args[5]!, /^Agent-Workflows-Approved-Plan:\n\n````markdown\n/);
    return '{"id":"comment-1"}';
  }, () => content);
  assert.equal(result.comment_id, 'comment-1');
  assert.throws(() => publishItemPlan('clickup', input, () => '{}', () => content),
    /identify/);
});

test('Publication stops before mutation when plan content is empty', () => {
  assert.throws(() => publishItemPlan('linear', input, () => {
    throw new Error('Mutation must not run.');
  }, () => ''), /empty/);
});
