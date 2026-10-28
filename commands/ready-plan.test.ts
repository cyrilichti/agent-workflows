import assert from 'node:assert/strict';
import test from 'node:test';
import { assertReadyPlan } from './ready-plan.ts';

const plan = '# Fix CTA\n\n## Steps\n\n1. ✓ Fix color\n2. ✓ Add coverage\n\n## Validation\n\n- [x] Run tests\n- [X] Check UI\n';

test('ready accepts only fully completed todos and checked validations', () => {
  assert.doesNotThrow(() => assertReadyPlan(plan));
  assert.throws(() => assertReadyPlan(plan.replace('2. ✓', '2. ⊘')), /todo/);
  assert.throws(() => assertReadyPlan(plan.replace('[x]', '[ ]')), /validation/);
  assert.throws(() => assertReadyPlan(plan.replace('## Validation', '## Checks')), /Validation/);
  assert.throws(() => assertReadyPlan(plan.replace('1. ✓', '1. ◐')), /todo/);
});
