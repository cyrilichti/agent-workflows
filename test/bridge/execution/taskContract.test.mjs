import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTaskInput } from '../../../src/bridge/execution/taskContract.mjs';

const input = { requestId: 'test-request-001', prompt: 'Say OK' };
test('input validation prevents traversal and empty or excessive prompts', () => {
  for (const body of [
    null,
    {},
    { ...input, requestId: '../escape' },
    { ...input, prompt: '' },
    { ...input, prompt: 'x'.repeat(16001) },
  ])
    assert.throws(() => validateTaskInput(body), { code: 'invalid_input' });
});
