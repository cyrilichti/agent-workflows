import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskInputValidator } from './task-input.validator.ts';

const input = { requestId: 'test-request-001', prompt: 'Say OK' };
test('input validation rejects malformed correlation IDs and invalid prompts', () => {
  for (const body of [
    null,
    {},
    { ...input, requestId: '../escape' },
    { ...input, prompt: '' },
    { ...input, prompt: 'x'.repeat(16001) },
  ])
    assert.throws(() => new TaskInputValidator().validate(body), { code: 'invalid_input' });
});
