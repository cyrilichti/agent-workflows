import assert from 'node:assert/strict';
import test from 'node:test';
import { applyHotfixLabels } from './apply-hotfix-labels.ts';
import { applyItemLabel } from './apply-item-label.ts';

test('both providers apply labels to the saved item ID before handoff', () => {
  for (const provider of ['linear', 'clickup'] as const) {
    const calls: string[] = [];
    const result = applyHotfixLabels(provider, 'saved-id', (actualProvider, input) => {
      assert.equal(actualProvider, provider);
      assert.equal(input.item_id, 'saved-id');
      calls.push(input.label);
      return { applied: true };
    });
    assert.equal(result.status, 'prepared');
    assert.equal(result.item_id, 'saved-id');
    assert.deepEqual(calls, ['agent-shaped', 'hotfix']);
  }
});

test('an unsuccessful required label operation blocks handoff', () => {
  for (const throws of [false, true]) {
    const result = applyHotfixLabels('linear', 'saved-id', (_provider, { label }) => {
      if (label === 'hotfix') return { applied: true };
      if (throws) throw new Error('permission denied');
      return { applied: false, reason: 'provider_failure' };
    });
    assert.equal(result.status, 'failed');
    assert.equal(result.stage, 'apply_agent_shaped');
    assert.equal(result.labels.hotfix.applied, true);
  }
});

test('ClickUp missing hotfix tag is reported without blocking handoff', () => {
  const result = applyHotfixLabels('clickup', 'saved-id',
    (provider, input) => applyItemLabel(provider, input, (_program, args) => {
      if (args.includes('hotfix')) throw new Error('Tag not found');
      return JSON.stringify({ success: true });
    }));
  assert.equal(result.status, 'prepared');
  assert.equal(result.item_id, 'saved-id');
  assert.deepEqual(result.labels.hotfix, {
    status: 'failed', applied: false, reason: 'label_missing',
  });
});

test('ClickUp missing required tag blocks handoff', () => {
  const result = applyHotfixLabels('clickup', 'saved-id',
    (provider, input) => applyItemLabel(provider, input, () => {
      throw new Error('Tag does not exist');
    }));
  assert.equal(result.status, 'failed');
  assert.equal(result.stage, 'apply_agent_shaped');
  assert.equal(result.reason, 'label_missing');
});

test('an optional label exception is reported without blocking handoff', () => {
  const result = applyHotfixLabels('linear', 'saved-id', (_provider, { label }) => {
    if (label === 'hotfix') throw new Error('label creation denied');
    return { applied: true };
  });
  assert.equal(result.status, 'prepared');
  assert.equal(result.item_id, 'saved-id');
  assert.deepEqual(result.labels.hotfix, { applied: false, reason: 'label creation denied' });
});
