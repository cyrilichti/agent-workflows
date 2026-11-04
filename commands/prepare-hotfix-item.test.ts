import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareHotfixItem } from './prepare-hotfix-item.ts';
import { applyItemLabel } from './apply-item-label.ts';
import type { WorkItem } from './read-item.ts';

const item: WorkItem = {
  id: 'saved-id', title: 'Checkout fails', description: 'Payment returns 500',
  url: 'https://example.test/item', status: { name: 'Open' }, closed: false,
  destination: { team: 'team' }, labels: ['agent-shaped'], comments: [],
  request_backlinks: [], relations: [],
};

test('both providers hand off complete official context only after label operations and a read', () => {
  for (const provider of ['linear', 'clickup'] as const) {
    const calls: string[] = [];
    const result = prepareHotfixItem(provider, item.id, {
      applyLabel: (actualProvider, input) => {
        assert.equal(actualProvider, provider);
        assert.equal(input.item_id, item.id);
        calls.push(input.label);
        return { applied: true };
      },
      read: (actualProvider, id, relations) => {
        assert.equal(actualProvider, provider);
        assert.equal(id, item.id);
        assert.equal(relations, true);
        calls.push('read');
        return item;
      },
    });
    assert.equal(result.status, 'prepared');
    assert.equal(result.item, item);
    assert.deepEqual(calls, ['agent-shaped', 'hotfix', 'read']);
  }
});

test('an unsuccessful required label operation blocks handoff even if the item was already shaped', () => {
  for (const throws of [false, true]) {
    const result = prepareHotfixItem('linear', item.id, {
      applyLabel: (_provider, { label }) => {
        if (label === 'hotfix') return { applied: true };
        if (throws) throw new Error('permission denied');
        return { applied: false, reason: 'provider_failure' };
      },
      read: () => assert.fail('Failed shaping must stop before handoff verification'),
    });
    assert.equal(result.status, 'failed');
    assert.equal(result.stage, 'apply_agent_shaped');
    assert.equal(result.labels.hotfix.applied, true);
  }
});

test('a confirmed mutation cannot substitute for observed eligibility', () => {
  const cases = [
    { changes: { labels: [] }, reason: 'missing_agent_shaped' },
    { changes: { labels: ['agent-shaped', 'agent-planned'] }, reason: 'already_planned' },
    { changes: { closed: true }, reason: 'closed' },
    { changes: { closed: null }, reason: 'openness_unavailable' },
  ];
  for (const { changes, reason } of cases) {
    const result = prepareHotfixItem('linear', item.id, {
      applyLabel: () => ({ applied: true }), read: () => ({ ...item, ...changes }),
    });
    assert.equal(result.status, 'failed');
    assert.equal(result.stage, 'classify_item');
    assert.equal(result.reason, reason);
  }
});

test('read failures and different item identities block handoff', () => {
  for (const read of [() => { throw new Error('offline'); },
    () => ({ ...item, id: 'another-id' })]) {
    const result = prepareHotfixItem('linear', item.id, {
      applyLabel: () => ({ applied: true }), read,
    });
    assert.equal(result.status, 'failed');
    assert.equal(result.stage, 'verify_item');
  }
});

test('ClickUp missing hotfix tag is reported without blocking an eligible handoff', () => {
  const result = prepareHotfixItem('clickup', item.id, {
    applyLabel: (provider, input) => applyItemLabel(provider, input, (_program, args) => {
      if (args.includes('hotfix')) throw new Error('Tag not found');
      return JSON.stringify({ success: true });
    }),
    read: () => item,
  });
  assert.equal(result.status, 'prepared');
  assert.deepEqual(result.labels.hotfix, {
    status: 'failed', applied: false, reason: 'label_missing',
  });
});

test('ClickUp missing required tag blocks handoff', () => {
  const result = prepareHotfixItem('clickup', item.id, {
    applyLabel: (provider, input) => applyItemLabel(provider, input, () => {
      throw new Error('Tag does not exist');
    }),
    read: () => assert.fail('Missing agent-shaped must block handoff'),
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.stage, 'apply_agent_shaped');
  assert.equal(result.reason, 'label_missing');
});

test('an optional label exception is reported and official context is still verified', () => {
  const result = prepareHotfixItem('linear', item.id, {
    applyLabel: (_provider, { label }) => {
      if (label === 'hotfix') throw new Error('label creation denied');
      return { applied: true };
    },
    read: () => item,
  });
  assert.equal(result.status, 'prepared');
  assert.deepEqual(result.labels.hotfix, { applied: false, reason: 'label creation denied' });
});
