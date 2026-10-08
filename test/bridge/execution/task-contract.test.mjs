import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTaskInput } from '../../../src/bridge/execution/task-contract.mjs';

const input = { requestId: 'test-request-001', prompt: 'Say OK' };
test('input validation rejects malformed correlation IDs and invalid prompts', () => {
  for (const body of [
    null,
    {},
    { ...input, requestId: '../escape' },
    { ...input, prompt: '' },
    { ...input, prompt: 'x'.repeat(16001) },
  ])
    assert.throws(() => validateTaskInput(body), { code: 'invalid_input' });
});

test('delivery result contract is explicit and binds one exact item', () => {
  const resultContract = { type: 'inspect', itemId: 'ICY-108' };
  assert.deepEqual(validateTaskInput({ ...input, resultContract }).resultContract, resultContract);
  assert.ok(!Object.hasOwn(validateTaskInput(input), 'resultContract'));
  for (const invalid of [null, {}, 'inspect', { ...resultContract, itemId: '' },
    { ...resultContract, itemId: 'ICY-108\nICY-999' }, { ...resultContract, type: 'work' },
    { ...resultContract, outcome: 'success' }]) {
    assert.throws(() => validateTaskInput({ ...input, resultContract: invalid }), { code: 'invalid_input' });
  }
});
