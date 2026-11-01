import assert from 'node:assert/strict';
import test from 'node:test';
import { assessRefinementNeed } from './assess-refinement-need.ts';

test('one coherent unit does not require refinement', () => {
  assert.deepEqual(assessRefinementNeed({ autonomous_units: [
    { outcome: 'Refactor one plan flow', verification: 'Both paths remain valid' },
  ] }), { status: 'refinement-not-needed', findings: 'One coherent delivery unit.' });
});

test('independently verifiable units require refinement with exact findings', () => {
  assert.deepEqual(assessRefinementNeed({ autonomous_units: [
    { outcome: 'Deliver A', verification: 'A works' },
    { outcome: 'Deliver B', verification: 'B works' },
  ] }), { status: 'needs-refinement', findings: ['Deliver A — A works',
    'Deliver B — B works'] });
});

test('incomplete assessments fail', () => {
  assert.throws(() => assessRefinementNeed({ autonomous_units: [] }),
    /Supply assessed/);
  assert.throws(() => assessRefinementNeed({ autonomous_units: [
    { outcome: 'A', verification: '' },
  ] }), /Supply assessed/);
});
