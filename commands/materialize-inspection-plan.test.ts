import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { materializeInspectionPlan } from './materialize-inspection-plan.ts';

const itemUrl = 'https://linear.app/team/issue/ICY-134/inspect';
const plan = `# Inspect\n\n**Ticket :** [ICY-134](${itemUrl})\n\n## Steps\n\n1. ✓ Fix review\n\n## Validation\n\n- [x] Check types\n`;
const input = {
  item_id: 'ICY-134', item_url: itemUrl, head_sha: 'a'.repeat(40),
  plan_content: plan,
};

test('materializes an ignored plan once without overwriting it', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'inspection-plan-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const path = materializeInspectionPlan(root, input, () => true);
  assert.match(path, /^plans\/inspection-icy-134-/);
  assert.equal(readFileSync(join(root, path), 'utf8'), plan);
  assert.equal(materializeInspectionPlan(root, input, () => true), path);
  writeFileSync(join(root, path), 'other');
  const next = materializeInspectionPlan(root, input, () => true);
  assert.notEqual(next, path);
  assert.equal(readFileSync(join(root, path), 'utf8'), 'other');
});

test('rejects non-ignored paths and invalid plan associations', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'inspection-plan-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.throws(() => materializeInspectionPlan(root, input, () => false), /not Git-ignored/);
  assert.throws(() => materializeInspectionPlan(root,
    { ...input, item_id: 'ICY-999' }, () => true), /official item/);
  assert.throws(() => materializeInspectionPlan(root,
    { ...input, plan_content: plan.replace('1. ✓', '1. ○') }, () => true), /todo/);
});
