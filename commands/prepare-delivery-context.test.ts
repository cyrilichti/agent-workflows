import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readItemPlan } from './read-item-plan.ts';
import { prepareDeliveryContext } from './prepare-delivery-context.ts';
import type { WorkItem } from './read-item.ts';

const plan =
  '# Fix CTA\n\n**Ticket :** [ICY-133](https://linear.app/acme/issue/ICY-133/fix)\n\n## Objective\n\nFix CTA\n\n## Steps\n\n1. ○ Fix color\n';
function createItem(): WorkItem {
  return {
    id: 'uuid',
    identifier: 'ICY-133',
    title: 'Fix CTA',
    description: '',
    url: 'https://linear.app/acme/issue/ICY-133/fix',
    closed: false,
    status: { name: 'Todo' },
    destination: { team: 'Acme' },
    labels: ['agent-planned'],
    comments: [{ id: 'plan', body: `Agent-Workflows-Approved-Plan:\n\n${plan}` }],
    request_backlinks: [],
  };
}
function createFixture(t: test.TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'standalone-'));
  t.after(() => {
    return rmSync(root, { recursive: true, force: true });
  });
  return root;
}

test('approved plan extraction preserves bytes and removes only the ClickUp wrapper', () => {
  assert.equal(readItemPlan('linear', createItem().comments), plan);
  assert.equal(
    readItemPlan('clickup', [
      { id: 'p', body: `Agent-Workflows-Approved-Plan:\n\n\`\`\`\`markdown\n${plan}\n\`\`\`\`` },
    ]),
    plan,
  );
  assert.throws(() => {
    return readItemPlan('linear', []);
  }, /approved plan/i);
});

test('new work reuses comments and materializes unchanged plan with collision-safe filename', async (t) => {
  const root = createFixture(t);
  mkdirSync(join(root, 'plans'));
  writeFileSync(join(root, 'plans/2026-10-27-fix-cta.plan.md'), 'existing');
  const result = await prepareDeliveryContext(root, 'linear', createItem(), '2026-10-27');
  assert.equal(result.work_mode, 'new');
  assert.equal(result.delivery_context.plan, 'plans/2026-10-27-fix-cta-2.plan.md');
  assert.equal(readFileSync(join(root, result.delivery_context.plan), 'utf8'), plan);
  assert.equal(result.delivery_context.item.id, 'uuid');
  assert.equal(readFileSync(join(root, 'plans/2026-10-27-fix-cta.plan.md'), 'utf8'), 'existing');
});

test('ready mode stops without a linked request before creating a plan', async (t) => {
  const root = createFixture(t);
  await assert.rejects(
    prepareDeliveryContext(root, 'linear', createItem(), '2026-10-27', undefined, true),
    /no linked pull or merge request/i,
  );
  assert.equal(existsSync(join(root, 'plans')), false);
});

test('ineligible items stop before writing the plan', async (t) => {
  const root = createFixture(t);
  for (const official of [
    { ...createItem(), closed: true },
    { ...createItem(), labels: [] },
  ]) {
    await assert.rejects(prepareDeliveryContext(root, 'linear', official, '2026-10-27'));
  }
  assert.equal(existsSync(join(root, 'plans')), false);
});

test('resumed work reads the local plan and resolves its existing request', async (t) => {
  const root = createFixture(t);
  mkdirSync(join(root, '.agents/plans'), { recursive: true });
  const reference = '.agents/plans/cta.plan.md';
  const local = plan.replace('○', '✓');
  writeFileSync(join(root, reference), local);
  const official = createItem();
  official.request_backlinks = ['https://github.com/acme/repo/pull/7'];
  official.comments.push({
    id: 'b',
    body: `Draft PR: https://github.com/acme/repo/pull/7\nAgent-Workflows-Plan: ${reference}`,
  });
  const request = {
    request_id: 7,
    source_branch: 'fix/cta',
    state: 'open',
    kind: 'pull_request' as const,
    url: 'https://github.com/acme/repo/pull/7',
    target_branch: 'main',
    draft: true,
    title: 'Fix CTA',
    body: '',
  };
  const result = await prepareDeliveryContext(root, 'linear', official, '2026-10-27', () => {
    return request;
  });
  assert.equal(result.work_mode, 'resumed');
  assert.equal(result.delivery_context.plan, reference);
  assert.equal(result.delivery_context.branch, 'fix/cta');
  assert.deepEqual(result.delivery_context.request, request);
  assert.equal(readFileSync(join(root, reference), 'utf8'), local);

  official.comments[1]!.body = `Draft PR: https://github.com/acme/repo/pull/8\nAgent-Workflows-Plan: ${reference}`;
  const ready = await prepareDeliveryContext(root, 'linear', official, '2026-10-27',
    () => request, true);
  assert.equal(ready.delivery_context.plan, reference);
  assert.deepEqual(ready.delivery_context.request, request);
});

test('resumed work stops for a missing plan or missing backlink reference', async (t) => {
  const root = createFixture(t);
  const official = createItem();
  official.request_backlinks = ['https://github.com/acme/repo/pull/7'];
  await assert.rejects(prepareDeliveryContext(root, 'linear', official), /plan reference/i);
  official.comments.push({
    id: 'b',
    body: 'Draft PR: https://github.com/acme/repo/pull/7\nAgent-Workflows-Plan: plans/missing.plan.md',
  });
  await assert.rejects(prepareDeliveryContext(root, 'linear', official), /ENOENT/);
});
