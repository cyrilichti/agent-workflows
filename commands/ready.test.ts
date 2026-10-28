import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { assertReadyPlan } from './ready-plan.ts';
import { prepareStandaloneReady } from './ready-standalone.ts';
import type { WorkItem } from './read-item.ts';

const plan = '# Fix CTA\n\n## Steps\n\n1. ✓ Fix color\n2. ✓ Add coverage\n\n## Validation\n\n- [x] Run tests\n- [X] Check UI\n';
const request = {
  request_id: 7, source_branch: 'fix/cta', state: 'open', kind: 'pull_request' as const,
  url: 'https://github.com/acme/repo/pull/7', target_branch: 'main', draft: true,
  title: 'Fix CTA', body: '', head_sha: 'abc',
};
function item(): WorkItem {
  return {
    id: 'uuid', identifier: 'ICY-133', title: 'Fix CTA', description: '',
    url: 'https://linear.app/acme/issue/ICY-133/fix', closed: false,
    status: { name: 'In progress' }, destination: { team: 'Acme' },
    labels: ['agent-planned'],
    comments: [{ id: 'backlink', body:
      'Draft PR: https://github.com/acme/repo/pull/7\n\nAgent-Workflows-Plan: plans/cta.plan.md' }],
    request_backlinks: [request.url],
  };
}

test('ready accepts only fully completed todos and checked validations', () => {
  assert.doesNotThrow(() => assertReadyPlan(plan));
  assert.throws(() => assertReadyPlan(plan.replace('2. ✓', '2. ⊘')), /todo/);
  assert.throws(() => assertReadyPlan(plan.replace('[x]', '[ ]')), /validation/);
  assert.throws(() => assertReadyPlan(plan.replace('## Validation', '## Checks')), /Validation/);
  assert.throws(() => assertReadyPlan(plan.replace('1. ✓', '1. ◐')), /todo/);
});

test('standalone ready reuses the linked local plan without creating one', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ready-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'plans'));
  writeFileSync(join(root, 'plans/cta.plan.md'), plan);
  const result = await prepareStandaloneReady(root, 'linear', item(), () => request);
  assert.equal(result.delivery_context.plan, 'plans/cta.plan.md');
  assert.equal(result.delivery_context.request?.request_id, 7);
  assert.equal(readFileSync(join(root, 'plans/cta.plan.md'), 'utf8'), plan);
});

test('standalone ready stops without a linked request or local plan', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ready-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const noLink = item();
  noLink.comments = [];
  noLink.request_backlinks = [];
  await assert.rejects(prepareStandaloneReady(root, 'linear', noLink, () => request), /no linked/);
  await assert.rejects(prepareStandaloneReady(root, 'linear', item(), () => request), /ENOENT/);
});
